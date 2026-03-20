import { Test, TestingModule } from '@nestjs/testing';
import { RidesService } from './rides.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RideStatus } from '@prisma/client';

describe('RidesService - Ratings (Unit)', () => {
  let service: RidesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    rideRequest: {
      findUnique: jest.fn(),
    },
    rating: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RidesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<RidesService>(RidesService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('rateRide', () => {
    const mockRide = {
      id: 'ride-1',
      clientId: 'client-1',
      status: RideStatus.COMPLETED,
      selectedOffer: { driverId: 'driver-1' },
    };

    it('debe arrojar NotFoundException si el viaje no existe', async () => {
      mockPrismaService.rideRequest.findUnique.mockResolvedValueOnce(null);
      await expect(service.rateRide({
        rideId: 'non-existent',
        fromUserId: 'u1',
        toUserId: 'u2',
        score: 5
      })).rejects.toThrow(NotFoundException);
    });

    it('debe arrojar BadRequestException si el viaje no está COMPLETED', async () => {
      mockPrismaService.rideRequest.findUnique.mockResolvedValueOnce({
        ...mockRide,
        status: RideStatus.MATCHED
      });
      await expect(service.rateRide({
        rideId: 'ride-1',
        fromUserId: 'client-1',
        toUserId: 'driver-1',
        score: 5
      })).rejects.toThrow(BadRequestException);
    });

    it('debe arrojar BadRequestException si el usuario calificador no es parte del viaje', async () => {
      mockPrismaService.rideRequest.findUnique.mockResolvedValueOnce(mockRide);
      await expect(service.rateRide({
        rideId: 'ride-1',
        fromUserId: 'stranger-1',
        toUserId: 'driver-1',
        score: 5
      })).rejects.toThrow(BadRequestException);
    });

    it('debe crear la calificación exitosamente para participantes legítimos', async () => {
      mockPrismaService.rideRequest.findUnique.mockResolvedValueOnce(mockRide);
      mockPrismaService.rating.create.mockResolvedValueOnce({ id: 'rating-1' });

      const result = await service.rateRide({
        rideId: 'ride-1',
        fromUserId: 'client-1',
        toUserId: 'driver-1',
        score: 5
      });

      expect(result).toBeDefined();
      expect(mockPrismaService.rating.create).toHaveBeenCalled();
    });
  });

  describe('getRatingsForUser - Visibilidad Diferida', () => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);

    it('debe mostrar calificaciones si el viaje tiene 2 o más calificaciones (mutuo)', async () => {
      const mockRatings = [
        {
          id: 'r1',
          ride: { updatedAt: oneHourAgo, ratings: [{ id: 'r1' }, { id: 'r2' }] }
        }
      ];
      mockPrismaService.rating.findMany.mockResolvedValueOnce(mockRatings);

      const result = await service.getRatingsForUser('target', 'CLIENTE');
      expect(result.length).toBe(1);
    });

    it('debe mostrar calificaciones si el viaje terminó hace más de 48hs', async () => {
      const mockRatings = [
        {
          id: 'r1',
          ride: { updatedAt: threeDaysAgo, ratings: [{ id: 'r1' }] }
        }
      ];
      mockPrismaService.rating.findMany.mockResolvedValueOnce(mockRatings);

      const result = await service.getRatingsForUser('target', 'CLIENTE');
      expect(result.length).toBe(1);
    });

    it('debe ocultar calificaciones si es reciente (<48h) y no hay calificación mutua', async () => {
      const mockRatings = [
        {
          id: 'r1',
          ride: { updatedAt: oneHourAgo, ratings: [{ id: 'r1' }] }
        }
      ];
      mockPrismaService.rating.findMany.mockResolvedValueOnce(mockRatings);

      const result = await service.getRatingsForUser('target', 'CLIENTE');
      expect(result.length).toBe(0);
    });
  });
});
