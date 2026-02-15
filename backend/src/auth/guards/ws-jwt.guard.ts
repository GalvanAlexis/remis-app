import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AuthService } from '../auth.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const token = client.handshake.auth?.token;

      // Si no hay token, permitir la conexión (usuario invitado)
      if (!token) {
        this.logger.log('Guest connection (no token provided)');
        client.data.user = null; // Marcar como invitado
        return true;
      }

      // Si hay token, validarlo
      const payload = await this.jwtService.verifyAsync(token);
      const user = await this.authService.validateUser(payload.sub);

      if (!user) {
        this.logger.error('User not found in database');
        return false;
      }

      // Adjuntar usuario al cliente de socket para uso posterior
      client.data.user = user;

      return true;
    } catch (err) {
      this.logger.error(`Invalid token: ${err.message}`);
      return false;
    }
  }
}
