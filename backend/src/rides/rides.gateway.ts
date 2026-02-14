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
import { UseFilters } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
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

  @SubscribeMessage('request_ride')
  async handleRequestRide(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const ride = await this.ridesService.createRideRequest(data);
      this.server.emit('new_ride_request', ride);
      client.join(`ride_${ride.id}`);
      return ride;
    } catch (error) {
      console.error('Error in request_ride:', error);
      throw error;
    }
  }

  @SubscribeMessage('send_offer')
  async handleSendOffer(
    @MessageBody()
    data: {
      rideRequestId: string;
      driverId: string;
      estimatedMinutes: number;
      quotedPrice: number;
    },
  ) {
    try {
      const offer = await this.ridesService.createOffer(data);
      this.server.to(`ride_${data.rideRequestId}`).emit('new_offer', offer);
      return offer;
    } catch (error) {
      console.error('Error in send_offer:', error);
      throw error;
    }
  }

  @SubscribeMessage('accept_offer')
  async handleAcceptOffer(
    @MessageBody() data: { rideId: string; offerId: string },
  ) {
    try {
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

  @SubscribeMessage('update_driver_status')
  async handleUpdateStatus(
    @MessageBody()
    data: {
      userId: string;
      isOnline: boolean;
      onlyRegistered: boolean;
    },
  ) {
    await this.ridesService.updateDriverStatus(data.userId, data);
    return { success: true };
  }

  @SubscribeMessage('finish_ride')
  async handleFinishRide(@MessageBody() data: { rideId: string }) {
    const ride = await this.ridesService.finishRide(data.rideId);

    // Notificar a ambos que el viaje terminó
    this.server.to(`ride_${data.rideId}`).emit('ride_completed', ride);
    this.server.emit('ride_completed_global', ride); // Para que el chofer limpie su vista si no estaba en el room

    return ride;
  }

  @SubscribeMessage('rate_ride')
  async handleRateRide(
    @MessageBody()
    data: {
      rideId: string;
      fromUserId: string;
      toUserId: string;
      score: number;
      comment?: string;
    },
  ) {
    return this.ridesService.rateRide(data);
  }

  @SubscribeMessage('get_user_ratings')
  async handleGetRatings(
    @MessageBody() data: { targetUserId: string; requesterRole: string },
  ) {
    return this.ridesService.getRatingsForUser(
      data.targetUserId,
      data.requesterRole,
    );
  }
}
