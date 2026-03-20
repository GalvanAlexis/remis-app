import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RideStatus, OfferStatus } from '@prisma/client';

@Injectable()
export class RidesCleanupService {
  private readonly logger = new Logger(RidesCleanupService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Tarea periódica cada 5 minutos (US-S03).
   * - Viajes PENDING con más de 10 minutos -> EXPIRED.
   * - Ofertas PENDING con más de 5 minutos -> EXPIRED.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCleanup() {
    this.logger.log('Starting auto-cleanup for expired rides and offers...');

    const now = new Date();
    
    // 10 minutos atrás para viajes
    const ridesThreshold = new Date(now.getTime() - 10 * 60 * 1000);
    
    // 5 minutos atrás para ofertas
    const offersThreshold = new Date(now.getTime() - 5 * 60 * 1000);

    try {
      // Expirar Rides PENDING antiguos
      const expiredRides = await this.prisma.rideRequest.updateMany({
        where: {
          status: RideStatus.PENDING,
          createdAt: { lt: ridesThreshold },
        },
        data: { status: RideStatus.EXPIRED },
      });

      if (expiredRides.count > 0) {
        this.logger.log(`Expired ${expiredRides.count} pending ride requests.`);
      }

      // Expirar Offers PENDING antiguas
      const expiredOffers = await this.prisma.offer.updateMany({
        where: {
          status: OfferStatus.PENDING,
          createdAt: { lt: offersThreshold },
        },
        data: { status: OfferStatus.EXPIRED },
      });

      if (expiredOffers.count > 0) {
        this.logger.log(`Expired ${expiredOffers.count} pending offers.`);
      }
      
      this.logger.log('Cleanup completed successfully.');
    } catch (error) {
      this.logger.error('Error during auto-cleanup task:', error);
    }
  }
}
