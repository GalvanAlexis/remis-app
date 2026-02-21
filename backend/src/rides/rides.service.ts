import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RideStatus, OfferStatus } from '@prisma/client';

@Injectable()
export class RidesService {
  constructor(private prisma: PrismaService) {}

  async createRideRequest(data: {
    clientId?: string;
    guestName?: string;
    guestPhone?: string;
    detalle?: string;
    originAddress: string;
    destAddress: string;
  }) {
    return this.prisma.rideRequest.create({
      data: {
        clientId: data.clientId,
        guestName: data.guestName,
        detalle: data.detalle,
        originAddress: data.originAddress,
        destAddress: data.destAddress,
        status: RideStatus.PENDING,
      },
      include: {
        client: {
          include: { profile: true },
        },
      },
    });
  }

  async updateDriverStatus(
    userId: string,
    data: { isOnline: boolean; onlyRegistered: boolean },
  ) {
    return this.prisma.driverDocument.update({
      where: { userId },
      data: {
        isOnline: data.isOnline,
        onlyRegistered: data.onlyRegistered,
      },
    });
  }

  async createOffer(data: {
    rideRequestId: string;
    driverId: string;
    estimatedMinutes: number;
    quotedPrice: number;
  }) {
    // Verificar si el chofer ya hizo una oferta
    const existing = await this.prisma.offer.findFirst({
      where: {
        rideRequestId: data.rideRequestId,
        driverId: data.driverId,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Ya has realizado una oferta para este viaje',
      );
    }

    return this.prisma.offer.create({
      data: {
        rideRequestId: data.rideRequestId,
        driverId: data.driverId,
        estimatedMinutes: data.estimatedMinutes,
        quotedPrice: data.quotedPrice,
        status: OfferStatus.PENDING,
      },
      include: {
        driver: {
          include: { profile: true },
        },
      },
    });
  }

  async acceptOffer(rideId: string, offerId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer || offer.rideRequestId !== rideId) {
      throw new NotFoundException('Oferta no encontrada');
    }

    // Usar una transacción para actualizar el viaje y la oferta
    return this.prisma.$transaction(async (tx) => {
      // 0. Verificar que el viaje siga PENDIENTE y no tenga oferta seleccionada
      const rideCheck = await tx.rideRequest.findUnique({
        where: { id: rideId },
      });

      if (!rideCheck || rideCheck.status !== RideStatus.PENDING) {
        throw new BadRequestException(
          'Este viaje ya no está disponible o ya ha sido asignado',
        );
      }

      // 1. Marcar la oferta como aceptada
      await tx.offer.update({
        where: { id: offerId },
        data: { status: OfferStatus.ACCEPTED },
      });

      // 2. Marcar las demás ofertas como rechazadas
      await tx.offer.updateMany({
        where: {
          rideRequestId: rideId,
          id: { not: offerId },
        },
        data: { status: OfferStatus.DECLINED },
      });

      // 3. Actualizar el viaje
      const ride = await tx.rideRequest.update({
        where: { id: rideId },
        data: {
          status: RideStatus.MATCHED,
          selectedOfferId: offerId,
        },
        include: {
          selectedOffer: {
            include: {
              driver: {
                include: { profile: true },
              },
            },
          },
        },
      });

      // 4. Pasar al chofer a estado OFF automáticamente
      await tx.driverDocument.update({
        where: { userId: offer.driverId },
        data: { isOnline: false },
      });

      return ride;
    });
  }

  async getPendingRides(driverId: string) {
    // Obtener preferencias del chofer
    const driverDocs = await this.prisma.driverDocument.findUnique({
      where: { userId: driverId },
    });

    return this.prisma.rideRequest.findMany({
      where: {
        status: RideStatus.PENDING,
        ...(driverDocs?.onlyRegistered && {
          clientId: { not: null },
        }),
      },
      include: {
        client: {
          include: { profile: true },
        },
        offers: {
          where: { driverId },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async finishRide(rideId: string) {
    return this.prisma.rideRequest.update({
      where: { id: rideId },
      data: { status: RideStatus.COMPLETED },
      include: {
        client: { include: { profile: true } },
        selectedOffer: { include: { driver: { include: { profile: true } } } },
      },
    });
  }

  async rateRide(data: {
    rideId: string;
    fromUserId: string;
    toUserId: string;
    score: number;
    comment?: string;
  }) {
    return this.prisma.rating.create({
      data: {
        rideId: data.rideId,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        score: data.score,
        comment: data.comment,
      },
    });
  }

  async getHistory(userId: string, role: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const whereClause =
      role === 'CLIENTE'
        ? {
            clientId: userId,
            status: { in: ['COMPLETED', 'CANCELLED'] as any },
          }
        : {
            // CHOFER: viajes que condujo (tiene oferta aceptada como ganador)
            selectedOffer: { driverId: userId },
            status: { in: ['COMPLETED', 'CANCELLED'] as any },
          };

    const [rides, total] = await this.prisma.$transaction([
      this.prisma.rideRequest.findMany({
        where: whereClause,
        include: {
          client: { include: { profile: true } },
          selectedOffer: {
            include: {
              driver: { include: { profile: true } },
            },
          },
          rating: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.rideRequest.count({ where: whereClause }),
    ]);

    return {
      data: rides,
      total,
      page,
      limit,
      hasMore: skip + rides.length < total,
    };
  }

  async getRatingsForUser(targetUserId: string, requesterRole: string) {
    // Definir filtros de visibilidad
    let whereClause: any = { toUserId: targetUserId };

    if (requesterRole === 'CLIENTE') {
      // El cliente solo puede ver reseñas de OTROS CLIENTES (from Role CLIENTE)
      // y solo si el objetivo es un CHOFER (implícito si el cliente está mirando detalles de oferta)
      whereClause = {
        ...whereClause,
        fromUser: { role: 'CLIENTE' },
      };
    }
    // Si es CHOFER, ve todo (reseñas de clientes y de otros choferes)

    return this.prisma.rating.findMany({
      where: whereClause,
      include: {
        fromUser: {
          include: { profile: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
