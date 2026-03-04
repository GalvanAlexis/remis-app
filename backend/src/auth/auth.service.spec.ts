import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

describe('AuthService (Unit)', () => {
  let authService: AuthService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mock_token'),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'secret';
      if (key === 'JWT_REFRESH_SECRET') return 'refresh_secret';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('saveRefreshToken (Lógica de Hashing)', () => {
    it('debe hashear el refresh token y guardarlo en la DB', async () => {
      const mockUserId = '123';
      const mockRefreshToken = 'my-plain-refresh-token';

      // Accedemos al método privado mediante cast
      await (authService as any).saveRefreshToken(mockUserId, mockRefreshToken);

      expect(prismaService.user.update).toHaveBeenCalledTimes(1);

      const updateCallArgs = (prismaService.user.update as jest.Mock).mock
        .calls[0][0];
      expect(updateCallArgs.where.id).toBe(mockUserId);

      const hashedValue = updateCallArgs.data.refreshTokenHash;
      expect(hashedValue).toBeDefined();
      expect(hashedValue).not.toBe(mockRefreshToken); // debe estar hasheado

      // Comprobar que realmente es un hash de bcrypt válido
      const isValid = await bcrypt.compare(mockRefreshToken, hashedValue);
      expect(isValid).toBe(true);
    });
  });
});
