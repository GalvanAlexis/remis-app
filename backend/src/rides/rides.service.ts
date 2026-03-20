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
          include: {
            profile: true,
            driverDocs: true,
            ratingsReceived: {
              select: { score: true },
            },
          },
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
                include: {
                  profile: true,
                  driverDocs: true,
                },
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
          include: {
            profile: true,
            ratingsReceived: {
              select: { score: true },
            },
          },
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
    // 1. Verificar existencia y estado del viaje
    const ride = await this.prisma.rideRequest.findUnique({
      where: { id: data.rideId },
      include: { selectedOffer: true },
    });

    if (!ride) throw new NotFoundException('Viaje no encontrado');
    if (ride.status !== RideStatus.COMPLETED) {
      throw new BadRequestException('Solo se pueden calificar viajes finalizados');
    }

    // 2. Verificar que el usuario 'from' sea parte del viaje
    const isClient = ride.clientId === data.fromUserId;
    const isDriver = ride.selectedOffer?.driverId === data.fromUserId;

    if (!isClient && !isDriver) {
      throw new BadRequestException('No tienes permiso para calificar este viaje');
    }

    // 3. Verificar que no se esté calificando a sí mismo
    if (data.fromUserId === data.toUserId) {
      throw new BadRequestException('No puedes calificarte a ti mismo');
    }

    // 4. Crear la calificación (el índice @@unique de Prisma evita duplicados)
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
            status: { in: ['COMPLETED', 'CANCELLED', 'EXPIRED'] as any },
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
          ratings: true,
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

  async startRide(rideId: string) {
    const ride = await this.prisma.rideRequest.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException('Viaje no encontrado');
    }

    // El chofer puede iniciar desde MATCHED (saltó el paso de AT_LOCATION)
    // o desde AT_LOCATION (ya estaba esperando al cliente)
    if (
      ride.status !== RideStatus.MATCHED &&
      ride.status !== RideStatus.AT_LOCATION
    ) {
      throw new BadRequestException(
        'Solo se puede iniciar un viaje en estado MATCHED o AT_LOCATION',
      );
    }

    return this.prisma.rideRequest.update({
      where: { id: rideId },
      data: { status: RideStatus.IN_PROGRESS },
      include: {
        client: { include: { profile: true } },
        selectedOffer: { include: { driver: { include: { profile: true } } } },
      },
    });
  }

  async markAtLocation(rideId: string) {
    const ride = await this.prisma.rideRequest.findUnique({
      where: { id: rideId },
    });

    if (!ride) throw new NotFoundException('Viaje no encontrado');

    if (ride.status !== RideStatus.MATCHED) {
      throw new BadRequestException(
        'El chofer debe estar en camino (MATCHED) para marcar llegada',
      );
    }

    return this.prisma.rideRequest.update({
      where: { id: rideId },
      data: { status: RideStatus.AT_LOCATION },
      include: {
        client: { include: { profile: true } },
        selectedOffer: { include: { driver: { include: { profile: true } } } },
      },
    });
  }

  async cancelRide(rideId: string, clientId: string) {
    const ride = await this.prisma.rideRequest.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException('Viaje no encontrado');
    }

    // Solo se puede cancelar si está en MATCHED (no durante IN_PROGRESS)
    if (ride.status !== RideStatus.MATCHED) {
      throw new BadRequestException(
        'Solo podés cancelar un viaje confirmado (MATCHED)',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Marcar el viaje como cancelado
      const cancelled = await tx.rideRequest.update({
        where: { id: rideId },
        data: { status: RideStatus.CANCELLED },
        include: {
          selectedOffer: true,
        },
      });

      // Volver a poner al chofer online (puede recibir nuevos viajes)
      if (cancelled.selectedOffer?.driverId) {
        await tx.driverDocument.update({
          where: { userId: cancelled.selectedOffer.driverId },
          data: { isOnline: true },
        });
      }

      return cancelled;
    });
  }

  async expireRide(rideId: string) {
    return this.prisma.rideRequest.update({
      where: { id: rideId },
      data: { status: RideStatus.EXPIRED },
    });
  }

  async getRatingsForUser(targetUserId: string, requesterRole: string) {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const ratings = await this.prisma.rating.findMany({
      where: { toUserId: targetUserId },
      include: {
        fromUser: { include: { profile: true } },
        ride: {
          include: {
            ratings: { select: { id: true } }, // Traemos IDs para contar
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filtrar por visibilidad:
    // Mostrar si: (Suma de ratings en el viaje == 2) OR (Ride finalizado hace > 48hs)
    return ratings.filter((r) => {
      const isMutuallyRated = r.ride.ratings.length >= 2;
      const isOldEnough = r.ride.updatedAt <= fortyEightHoursAgo;

      return isMutuallyRated || isOldEnough;
    });
  }

  async getRideOwner(rideId: string): Promise<string | null> {
    const ride = await this.prisma.rideRequest.findUnique({
      where: { id: rideId },
      select: { clientId: true },
    });
    return ride?.clientId ?? null;
  }

  /** Obtiene un viaje por ID con datos básicos (para push notifications). */
  async getRideById(rideId: string) {
    return this.prisma.rideRequest.findUnique({
      where: { id: rideId },
      select: {
        id: true,
        clientId: true,
        status: true,
      },
    });
  }

  private getVisibilityFilter() {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    return {
      OR: [
        { ride: { ratings: { _count: { gte: 2 } } } },
        { ride: { updatedAt: { lte: fortyEightHoursAgo } } },
      ],
    };
  }
}
