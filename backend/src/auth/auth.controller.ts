import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Límite estricto: 5 intentos por minuto — protege contra brute force
  @Throttle({ auth: {} })
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Throttle({ auth: {} })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  /**
   * POST /auth/refresh
   * Body: { userId: string, refreshToken: string }
   * Devuelve un nuevo par access_token + refresh_token (token rotation).
   */
  @Throttle({ auth: {} })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() body: { userId: string; refreshToken: string },
  ): Promise<AuthResponseDto> {
    return this.authService.refresh(body.userId, body.refreshToken);
  }

  /**
   * POST /auth/logout
   * Requiere Authorization: Bearer <access_token>
   * Invalida el refresh token en BD. El access_token expira solo (15m).
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req): Promise<{ message: string }> {
    return this.authService.logout(req.user.id);
  }
}
