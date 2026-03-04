import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy (Unit)', () => {
  let strategy: JwtStrategy;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('super-secret-key'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  describe('validate', () => {
    it('debe retornar el usuario validado si el token es correcto', async () => {
      const mockPayload = { sub: 'user-id-123', role: 'CLIENTE' };
      const expectedUser = { id: 'user-id-123', username: 'testuser' };

      mockAuthService.validateUser.mockResolvedValueOnce(expectedUser as any);

      const result = await strategy.validate(mockPayload);

      expect(authService.validateUser).toHaveBeenCalledWith('user-id-123');
      expect(result).toEqual(expectedUser);
    });

    it('debe lanzar UnauthorizedException si el usuario ya no existe o es inválido', async () => {
      const mockPayload = { sub: 'invalid-id' };

      mockAuthService.validateUser.mockResolvedValueOnce(null);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.validateUser).toHaveBeenCalledWith('invalid-id');
    });
  });
});
