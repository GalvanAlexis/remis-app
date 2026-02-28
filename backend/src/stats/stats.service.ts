import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RideStatus } from '@prisma/client';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  // ─────────────────────────────────────────────
  // FREE: Datos básicos disponibles para todos
  // ─────────────────────────────────────────────

  async getFreeStats(driverId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Viajes completados del chofer (su driverId aparece en Offer aceptada)
    const completedRides = await this.prisma.rideRequest.findMany({
      where: {
        status: RideStatus.COMPLETED,
        selectedOffer: { driverId },
      },
      include: {
        selectedOffer: { select: { quotedPrice: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Total de viajes completados
    const totalRides = completedRides.length;

    // Ganancias del último mes
    const thisMonthRides = completedRides.filter(
      (r) => r.updatedAt >= thirtyDaysAgo,
    );
    const earningsThisMonth = thisMonthRides.reduce(
      (sum, r) => sum + (r.selectedOffer?.quotedPrice ?? 0),
      0,
    );

    // Rating promedio
    const ratings = await this.prisma.rating.findMany({
      where: { toUserId: driverId },
      select: { score: true },
    });
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((s, r) => s + r.score, 0) / ratings.length
        : null;

    // Historial paginado (últimos 20)
    const history = completedRides.slice(0, 20).map((r) => ({
      id: r.id,
      origin: r.originAddress,
      dest: r.destAddress,
      price: r.selectedOffer?.quotedPrice ?? 0,
      date: r.updatedAt,
    }));

    return {
      totalRides,
      earningsThisMonth: parseFloat(earningsThisMonth.toFixed(2)),
      avgRating: avgRating ? parseFloat(avgRating.toFixed(2)) : null,
      totalRatings: ratings.length,
      history,
    };
  }

  // Historial paginado con cursor (llamado por separado para paginación real)
  async getRideHistory(driverId: string, cursor?: string, take = 20) {
    const rides = await this.prisma.rideRequest.findMany({
      where: {
        status: RideStatus.COMPLETED,
        selectedOffer: { driverId },
      },
      include: {
        selectedOffer: {
          select: { quotedPrice: true, estimatedMinutes: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = rides.length > take;
    const items = hasMore ? rides.slice(0, take) : rides;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      items: items.map((r) => ({
        id: r.id,
        origin: r.originAddress,
        dest: r.destAddress,
        price: r.selectedOffer?.quotedPrice ?? 0,
        estimatedMinutes: r.selectedOffer?.estimatedMinutes ?? null,
        date: r.updatedAt,
      })),
      nextCursor,
      hasMore,
    };
  }

  // ─────────────────────────────────────────────
  // PREMIUM: Analytics avanzado
  // ─────────────────────────────────────────────

  async getPremiumStats(driverId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(now.getDate() - 60);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const [completedRides, allOffers, cancelledRides, ratings] =
      await Promise.all([
        // Viajes completados con datos completos
        this.prisma.rideRequest.findMany({
          where: {
            status: RideStatus.COMPLETED,
            selectedOffer: { driverId },
          },
          include: {
            selectedOffer: {
              select: { quotedPrice: true, estimatedMinutes: true },
            },
          },
          orderBy: { updatedAt: 'desc' },
        }),
        // Todas las ofertas enviadas por el chofer (para tasa de aceptación)
        this.prisma.offer.findMany({
          where: { driverId },
          select: { status: true, createdAt: true },
        }),
        // Viajes cancelados donde el chofer tenía oferta
        this.prisma.rideRequest.findMany({
          where: {
            status: RideStatus.CANCELLED,
            selectedOffer: { driverId },
          },
        }),
        // Ratings con comentarios
        this.prisma.rating.findMany({
          where: { toUserId: driverId },
          select: { score: true, comment: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    // ── 1. Ganancias diarias (últimos 30 días) ──
    const earningsByDay = this.groupEarningsByDay(
      completedRides.filter((r) => r.updatedAt >= thirtyDaysAgo),
    );

    // ── 2. Comparativa: este mes vs mes anterior ──
    const thisMonthTotal = completedRides
      .filter((r) => r.updatedAt >= thirtyDaysAgo)
      .reduce((s, r) => s + (r.selectedOffer?.quotedPrice ?? 0), 0);

    const lastMonthTotal = completedRides
      .filter((r) => r.updatedAt >= sixtyDaysAgo && r.updatedAt < thirtyDaysAgo)
      .reduce((s, r) => s + (r.selectedOffer?.quotedPrice ?? 0), 0);

    const growthPct =
      lastMonthTotal > 0
        ? parseFloat(
            (
              ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) *
              100
            ).toFixed(1),
          )
        : null;

    // ── 3. Proyección mensual (últimos 7 días × (30/7)) ──
    const last7Total = completedRides
      .filter((r) => r.updatedAt >= sevenDaysAgo)
      .reduce((s, r) => s + (r.selectedOffer?.quotedPrice ?? 0), 0);
    const monthlyProjection = parseFloat(((last7Total / 7) * 30).toFixed(2));

    // ── 4. Tasa de aceptación ──
    const totalOffers = allOffers.length;
    const acceptedOffers = allOffers.filter(
      (o) => o.status === 'ACCEPTED',
    ).length;
    const acceptanceRate =
      totalOffers > 0
        ? parseFloat(((acceptedOffers / totalOffers) * 100).toFixed(1))
        : null;

    // ── 5. Horas pico (0-23) ──
    const hourDistribution = this.groupByHour(completedRides);

    // ── 6. Top 5 zonas (origen más frecuente) ──
    const topZones = this.topNByFrequency(
      completedRides.map((r) => r.originAddress),
      5,
    );

    // ── 7. Top 5 rutas ──
    const topRoutes = this.topNByFrequency(
      completedRides.map((r) => `${r.originAddress} → ${r.destAddress}`),
      5,
    );

    // ── 8. Rating breakdown ──
    const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: ratings.filter((r) => r.score === star).length,
    }));
    const topComments = ratings
      .filter((r) => r.comment && r.score >= 4)
      .slice(0, 5)
      .map((r) => ({ score: r.score, comment: r.comment }));

    // ── 9. Tasa de cancelaciones ──
    const cancellationRate =
      completedRides.length + cancelledRides.length > 0
        ? parseFloat(
            (
              (cancelledRides.length /
                (completedRides.length + cancelledRides.length)) *
              100
            ).toFixed(1),
          )
        : 0;

    return {
      earningsByDay,
      thisMonthTotal: parseFloat(thisMonthTotal.toFixed(2)),
      lastMonthTotal: parseFloat(lastMonthTotal.toFixed(2)),
      growthPct,
      monthlyProjection,
      acceptanceRate,
      totalOffers,
      acceptedOffers,
      hourDistribution,
      topZones,
      topRoutes,
      ratingBreakdown,
      topComments,
      cancellationRate,
    };
  }

  // ─────────────────────────────────────────────
  // Helpers privados
  // ─────────────────────────────────────────────

  private groupEarningsByDay(
    rides: { updatedAt: Date; selectedOffer: { quotedPrice: number } | null }[],
  ) {
    const map: Record<string, number> = {};
    for (const ride of rides) {
      const day = ride.updatedAt.toISOString().split('T')[0];
      map[day] = (map[day] ?? 0) + (ride.selectedOffer?.quotedPrice ?? 0);
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({
        date,
        total: parseFloat(total.toFixed(2)),
      }));
  }

  private groupByHour(rides: { updatedAt: Date }[]) {
    const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
    for (const ride of rides) {
      const h = ride.updatedAt.getHours();
      hours[h].count++;
    }
    return hours;
  }

  private topNByFrequency(items: string[], n: number) {
    const freq: Record<string, number> = {};
    for (const item of items) {
      freq[item] = (freq[item] ?? 0) + 1;
    }
    return Object.entries(freq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, n)
      .map(([label, count]) => ({ label, count }));
  }
}
