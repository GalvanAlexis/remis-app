import { Test, TestingModule } from '@nestjs/testing';
import { RidesService } from './rides.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('RidesService (Unit)', () => {
  let service: RidesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    offer: {
      findFirst: jest.fn(),
      create: jest.fn(),
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

  describe('createOffer', () => {
    it('debe arrojar BadRequestException si el chofer ya hizo una oferta para el viaje', async () => {
      const mockDto = {
        rideRequestId: 'ride-123',
        driverId: 'driver-456',
        estimatedMinutes: 5,
        quotedPrice: 1500,
      };

      // Simulamos que findFirst encuentra una oferta existente
      mockPrismaService.offer.findFirst.mockResolvedValueOnce({
        id: 'existing-offer-789',
      });

      await expect(service.createOffer(mockDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.offer.findFirst).toHaveBeenCalledWith({
        where: {
          rideRequestId: mockDto.rideRequestId,
          driverId: mockDto.driverId,
        },
      });
      expect(mockPrismaService.offer.create).not.toHaveBeenCalled();
    });

    it('debe crear la oferta exitosamente si no existe otra previa del mismo chofer', async () => {
      const mockDto = {
        rideRequestId: 'ride-123',
        driverId: 'driver-456',
        estimatedMinutes: 5,
        quotedPrice: 1500,
      };

      const expectedOffer = { id: 'new-offer', ...mockDto, status: 'PENDING' };

      // Simulamos que NO existe oferta previa
      mockPrismaService.offer.findFirst.mockResolvedValueOnce(null);
      mockPrismaService.offer.create.mockResolvedValueOnce(expectedOffer);

      const result = await service.createOffer(mockDto);

      expect(result).toEqual(expectedOffer);
      expect(mockPrismaService.offer.create).toHaveBeenCalled();
    });
  });
});
