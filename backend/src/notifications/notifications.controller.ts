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
