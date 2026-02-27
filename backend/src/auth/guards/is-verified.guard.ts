import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { PrismaService } from '../../prisma/prisma.service';
import { Socket } from 'socket.io';

/**
 * Guard para WebSocket: verifica que el chofer autenticado
 * tenga sus documentos aprobados (isVerified === true) antes
 * de permitirle enviar ofertas.
 *
 * Uso: @UseGuards(WsJwtGuard, IsVerifiedGuard) en @SubscribeMessage('send_offer')
 */
@Injectable()
export class IsVerifiedGuard implements CanActivate {
  private readonly logger = new Logger(IsVerifiedGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const user = client.data.user;

    if (!user) {
      throw new WsException('No autenticado');
    }

    if (user.role !== 'CHOFER') {
      throw new WsException('Solo los choferes pueden enviar ofertas');
    }

    const driverDoc = await this.prisma.driverDocument.findUnique({
      where: { userId: user.id },
      select: { isVerified: true },
    });

    if (!driverDoc?.isVerified) {
      this.logger.warn(
        `Driver ${user.id} intentó ofertar sin estar verificado`,
      );
      throw new WsException(
        'Tu cuenta no está verificada aún. Esperá la aprobación del administrador.',
      );
    }

    return true;
  }
}
