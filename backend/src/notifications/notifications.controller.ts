import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: { id: string; username: string; role: string };
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * POST /notifications/send-test
   *
   * Envía una notificación de prueba al usuario actual.
   * Útil para verificar que la integración con la API de Expo funciona.
   */
  @UseGuards(JwtAuthGuard)
  @Post('send-test')
  async sendTest(@Req() req: AuthRequest) {
    const token = await this.notificationsService.getPushToken(req.user.id);
    if (!token) {
      throw new BadRequestException(
        'No tienes un pushToken registrado. Inicia sesión desde el móvil primero.',
      );
    }

    await this.notificationsService.notifyDriverArrived(
      req.user.id,
      'Test System',
    );

    return {
      success: true,
      message: 'Notificación de prueba enviada a Expo',
      token: token.slice(0, 30) + '...',
    };
  }

  /**
   * POST /notifications/register-token
   *
   * Registra o actualiza el Expo Push Token del usuario autenticado.
   * La app mobile llama a este endpoint cada vez que inicia sesión.
   */
  @UseGuards(JwtAuthGuard)
  @Post('register-token')
  async registerToken(
    @Body() body: { pushToken: string },
    @Req() req: AuthRequest,
  ): Promise<{ success: boolean }> {
    const { pushToken } = body;

    if (!pushToken || typeof pushToken !== 'string') {
      throw new BadRequestException('pushToken es requerido');
    }

    if (
      !pushToken.startsWith('ExponentPushToken[') &&
      !pushToken.startsWith('ExpoPushToken[')
    ) {
      throw new BadRequestException(
        'pushToken inválido: debe ser un Expo Push Token',
      );
    }

    await this.notificationsService.saveToken(req.user.id, pushToken);
    return { success: true };
  }
}
