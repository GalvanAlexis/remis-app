import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RidesService } from './rides.service';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import {
  CreateRideRequestDto,
  CreateOfferDto,
  AcceptOfferDto,
  UpdateDriverStatusDto,
  RatingDto,
} from './dto/rides.dto';

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

  constructor(private ridesService: RidesService) {}

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

  @UseGuards(WsJwtGuard)
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
      // TODO: Verificar que el rideId pertenezca al usuario que acepta (si es cliente)
      const ride = await this.ridesService.acceptOffer(
        data.rideId,
        data.offerId,
      );
      this.server.emit('offer_accepted', ride);
      this.server.to(`ride_${data.rideId}`).emit('ride_matched', ride);
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

  @SubscribeMessage('expire_ride')
  async handleExpireRide(@MessageBody() data: { rideId: string }) {
    try {
      const ride = await this.ridesService.expireRide(data.rideId);
      // Notificar al cliente que su pedido expiró
      this.server.emit('ride_expired', { rideId: data.rideId });
      return ride;
    } catch (error) {
      console.error('Error in expire_ride:', error);
      throw error;
    }
  }
}
