import { Test, TestingModule } from '@nestjs/testing';
import { StatsService } from './stats.service';
import { PrismaService } from '../prisma/prisma.service';
import { RideStatus } from '@prisma/client';

/**
 * Unit Tests — StatsService
 * Spec: test/low-tests.spec.md → US-014
 *
 * Usa mocks de Prisma para aislar la lógica de negocio.
 */
describe('StatsService', () => {
  let service: StatsService;
  let prisma: jest.Mocked<
    Pick<PrismaService, 'rideRequest' | 'rating' | 'offer' | 'driverDocument'>
  >;

  const makeMockRide = (
    quotedPrice: number,
    updatedAt: Date,
    origin = 'A',
    dest = 'B',
  ) => ({
    id: `ride-${Math.random()}`,
    createdAt: new Date(),
    updatedAt,
    clientId: 'c1',
    guestName: null,
    detalle: null,
    originAddress: origin,
    destAddress: dest,
    status: RideStatus.COMPLETED,
    selectedOfferId: 'o1',
    selectedOffer: { quotedPrice, estimatedMinutes: 10 },
  });

  beforeEach(async () => {
    const mockPrisma = {
      rideRequest: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      rating: { findMany: jest.fn() },
      offer: { findMany: jest.fn() },
      driverDocument: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<StatsService>(StatsService);
    prisma = module.get(PrismaService);
  });

  // ── US-014: getFreeStats ───────────────────────────────────────────────────

  describe('getFreeStats()', () => {
    it('debe devolver avgRating null cuando el chofer no tiene ratings', async () => {
      (prisma.rideRequest.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.rating.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getFreeStats('driver-1');

      expect(result.avgRating).toBeNull();
      expect(result.totalRides).toBe(0);
      expect(result.earningsThisMonth).toBe(0);
    });

    it('debe calcular el promedio de ratings correctamente', async () => {
      (prisma.rideRequest.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.rating.findMany as jest.Mock).mockResolvedValue([
        { score: 5 },
        { score: 3 },
        { score: 4 },
      ]);

      const result = await service.getFreeStats('driver-1');

      expect(result.avgRating).toBe(4.0);
      expect(result.totalRatings).toBe(3);
    });

    it('debe sumar las ganancias del mes correctamente', async () => {
      const now = new Date();
      const rides = [makeMockRide(500, now), makeMockRide(300, now)];

      (prisma.rideRequest.findMany as jest.Mock).mockResolvedValue(rides);
      (prisma.rating.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getFreeStats('driver-1');

      expect(result.totalRides).toBe(2);
      expect(result.earningsThisMonth).toBe(800);
    });

    it('debe devolver history con máximo 20 items', async () => {
      const now = new Date();
      const rides = Array.from({ length: 25 }, (_, i) =>
        makeMockRide(100, now, `Origin ${i}`, `Dest ${i}`),
      );

      (prisma.rideRequest.findMany as jest.Mock).mockResolvedValue(rides);
      (prisma.rating.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getFreeStats('driver-1');

      expect(result.history.length).toBe(20);
    });
  });

  // ── US-014: getRideHistory cursor ─────────────────────────────────────────

  describe('getRideHistory()', () => {
    it('debe devolver hasMore: false cuando hay exactamente take items', async () => {
      const now = new Date();
      // Devuelve exactamente `take` items (no hay más)
      const rides = [makeMockRide(200, now), makeMockRide(300, now)];

      (prisma.rideRequest.findMany as jest.Mock).mockResolvedValue(rides);

      const result = await service.getRideHistory('driver-1', undefined, 2);

      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
      expect(result.items.length).toBe(2);
    });

    it('debe devolver hasMore: true cuando hay más items que take', async () => {
      const now = new Date();
      // El servicio pide take+1 → si devuelve 3 y take=2, hay más
      const rides = [
        makeMockRide(200, now),
        makeMockRide(300, now),
        makeMockRide(400, now),
      ];

      (prisma.rideRequest.findMany as jest.Mock).mockResolvedValue(rides);

      const result = await service.getRideHistory('driver-1', undefined, 2);

      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).not.toBeNull();
      expect(result.items.length).toBe(2);
    });

    it('debe devolver lista vacía cuando no hay viajes', async () => {
      (prisma.rideRequest.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getRideHistory('driver-1');

      expect(result.items).toHaveLength(0);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });
  });
});
