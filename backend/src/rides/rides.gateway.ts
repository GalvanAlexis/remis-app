import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RidesService } from './rides.service';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { IsVerifiedGuard } from '../auth/guards/is-verified.guard';
import {
  CreateRideRequestDto,
  CreateOfferDto,
  AcceptOfferDto,
  UpdateDriverStatusDto,
  RatingDto,
} from './dto/rides.dto';
import { NotificationsService } from '../notifications/notifications.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
})
export class RidesGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private ridesService: RidesService,
    private notificationsService: NotificationsService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.roomId);
    console.log(`Client ${client.id} joined room ${data.roomId}`);
  }

  @UseGuards(WsJwtGuard)
  @UsePipes(new ValidationPipe())
  @SubscribeMessage('request_ride')
  async handleRequestRide(
    @MessageBody() data: CreateRideRequestDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Usar ID del usuario autenticado si existe
      const user = client.data.user;
      const rideData = {
        ...data,
        clientId: user ? user.id : data.clientId,
      };

      const ride = await this.ridesService.createRideRequest(rideData);
      this.server.emit('new_ride_request', ride);
      client.join(`ride_${ride.id}`);
      return ride;
    } catch (error) {
      console.error('Error in request_ride:', error);
      throw error;
    }
  }

  @UseGuards(WsJwtGuard, IsVerifiedGuard)
  @UsePipes(new ValidationPipe())
  @SubscribeMessage('send_offer')
  async handleSendOffer(
    @MessageBody() data: CreateOfferDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = client.data.user;
      // Forzar que el driverId sea el del usuario autenticado
      const offerData = {
        ...data,
        driverId: user.id,
      };

      const offer = await this.ridesService.createOffer(offerData);
      this.server.to(`ride_${data.rideRequestId}`).emit('new_offer', offer);
      return offer;
    } catch (error) {
      console.error('Error in send_offer:', error);
      throw error;
    }
  }

  @UseGuards(WsJwtGuard)
  @UsePipes(new ValidationPipe())
  @SubscribeMessage('accept_offer')
  async handleAcceptOffer(
    @MessageBody() data: AcceptOfferDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = client.data.user;

      // Verificación de ownership: solo el dueño del viaje puede aceptar una oferta
      const rideOwner = await this.ridesService.getRideOwner(data.rideId);
      if (rideOwner !== null && rideOwner !== user?.id) {
        throw new WsException('No tenés permiso para aceptar esta oferta');
      }

      const ride = await this.ridesService.acceptOffer(
        data.rideId,
        data.offerId,
      );
      this.server.emit('offer_accepted', ride);
      this.server.to(`ride_${data.rideId}`).emit('ride_matched', ride);

      // Auto-emitir: el chofer queda "en camino" inmediatamente al aceptarse la oferta
      const driverName =
        ride.selectedOffer?.driver?.profile?.nombre ?? 'Tu chofer';
      this.server
        .to(`ride_${data.rideId}`)
        .emit('driver_en_camino', { ride, driverName });

      // PUSH: notificar al cliente que el chofer está en camino
      void this.notificationsService.notifyDriverEnRoute(
        ride.clientId,
        driverName,
      );

      return ride;
    } catch (error) {
      console.error('Error in accept_offer:', error);
      throw error;
    }
  }

  @UseGuards(WsJwtGuard)
  @UsePipes(new ValidationPipe())
  @SubscribeMessage('update_driver_status')
  async handleUpdateStatus(
    @MessageBody() data: UpdateDriverStatusDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    // Solo permitir actualizar el propio estado
    await this.ridesService.updateDriverStatus(user.id, data);
    return { success: true };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('finish_ride')
  async handleFinishRide(
    @MessageBody() data: { rideId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const ride = await this.ridesService.finishRide(data.rideId);

    // Notificar a ambos que el viaje terminó
    this.server.to(`ride_${data.rideId}`).emit('ride_completed', ride);
    this.server.emit('ride_completed_global', ride);

    return ride;
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('start_ride')
  async handleStartRide(
    @MessageBody() data: { rideId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const ride = await this.ridesService.startRide(data.rideId);
      // Notificar al cliente que el chofer ya lo recogió
      this.server.to(`ride_${data.rideId}`).emit('ride_started', ride);
      return ride;
    } catch (error) {
      console.error('Error in start_ride:', error);
      throw error;
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('cancel_ride')
  async handleCancelRide(
    @MessageBody() data: { rideId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = client.data.user;
      const ride = await this.ridesService.cancelRide(data.rideId, user.id);
      // Notificar al chofer que cancelaron
      this.server.to(`ride_${data.rideId}`).emit('ride_cancelled', ride);
      this.server.emit('ride_cancelled_global', { rideId: data.rideId });

      // PUSH: notificar al chofer asignado que el cliente canceló
      const driverId = ride.selectedOffer?.driverId ?? null;
      const clientName =
        user?.profile?.nombre ?? user?.username ?? 'El cliente';
      if (driverId) {
        void this.notificationsService.notifyRideCancelled(
          driverId,
          clientName,
        );
      }

      return ride;
    } catch (error) {
      console.error('Error in cancel_ride:', error);
      throw error;
    }
  }

  @UseGuards(WsJwtGuard)
  @UsePipes(new ValidationPipe())
  @SubscribeMessage('rate_ride')
  async handleRateRide(
    @MessageBody() data: RatingDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    const rateData = {
      ...data,
      fromUserId: user.id,
    };
    return this.ridesService.rateRide(rateData);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('get_user_ratings')
  async handleGetRatings(
    @MessageBody() data: { targetUserId: string; requesterRole: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    return this.ridesService.getRatingsForUser(data.targetUserId, user.role);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('driver_arrived')
  async handleDriverArrived(
    @MessageBody() data: { rideId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const ride = await this.ridesService.markAtLocation(data.rideId);
      // Notificar al cliente que el chofer ya está en el lugar
      this.server
        .to(`ride_${data.rideId}`)
        .emit('driver_at_location', { ride });

      // PUSH: notificar al cliente que el remis llegó
      const driverName =
        ride.selectedOffer?.driver?.profile?.nombre ?? 'Tu chofer';
      void this.notificationsService.notifyDriverArrived(
        ride.clientId,
        driverName,
      );

      return ride;
    } catch (error) {
      console.error('Error in driver_arrived:', error);
      throw error;
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('horn_beep')
  async handleHornBeep(
    @MessageBody() data: { rideId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    const driverName = user?.profile?.nombre ?? 'Tu chofer';

    // Emitir alerta de bocina al cliente en la room del viaje
    this.server.to(`ride_${data.rideId}`).emit('horn_beep', {
      rideId: data.rideId,
      driverName,
      timestamp: new Date().toISOString(),
    });

    // PUSH: notificar bocina al cliente (funciona aunque app esté cerrada)
    const ride = await this.ridesService.getRideById(data.rideId);
    if (ride?.clientId) {
      void this.notificationsService.notifyHorn(ride.clientId, driverName);
    }

    return { success: true };
  }

  @SubscribeMessage('expire_ride')
  async handleExpireRide(@MessageBody() data: { rideId: string }) {
    try {
      const ride = await this.ridesService.expireRide(data.rideId);
      // Notificar al cliente que su pedido expiró
      this.server.emit('ride_expired', { rideId: data.rideId });

      // PUSH: notificar expiración al cliente
      void this.notificationsService.notifyRideExpired(ride.clientId);

      return ride;
    } catch (error) {
      console.error('Error in expire_ride:', error);
      throw error;
    }
  }
}
