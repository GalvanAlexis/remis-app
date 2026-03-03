import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * NotificationsService — Expo Push Notifications.
 *
 * Guarda el pushToken del usuario en Profile y lo usa para enviar
 * notificaciones push reales vía la API de Expo.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  /** Guarda o actualiza el Expo Push Token del usuario. */
  async saveToken(userId: string, pushToken: string): Promise<void> {
    await this.prisma.profile.update({
      where: { userId },
      data: { pushToken },
    });
    this.logger.log(`pushToken guardado para userId: ${userId}`);
  }

  /** Obtiene el Expo Push Token de un usuario por su userId. */
  async getPushToken(
    userId: string | null | undefined,
  ): Promise<string | null> {
    if (!userId) return null;
    try {
      const profile = await this.prisma.profile.findUnique({
        where: { userId },
        select: { pushToken: true },
      });
      return profile?.pushToken ?? null;
    } catch {
      return null;
    }
  }

  /** Notifica al cliente que el chofer está en camino. */
  async notifyDriverEnRoute(
    clientId: string | null,
    driverName: string,
  ): Promise<void> {
    const token = await this.getPushToken(clientId);
    await this.sendPush(
      token,
      '🚗 Tu remis está en camino',
      `${driverName} ya va para allá`,
    );
  }

  /** Notifica al cliente que el chofer llegó al punto de encuentro. */
  async notifyDriverArrived(
    clientId: string | null,
    driverName: string,
  ): Promise<void> {
    const token = await this.getPushToken(clientId);
    await this.sendPush(
      token,
      '📍 ¡Tu remis llegó!',
      `${driverName} te está esperando`,
    );
  }

  /** Notifica al cliente que el chofer tocó la bocina. */
  async notifyHorn(clientId: string | null, driverName: string): Promise<void> {
    const token = await this.getPushToken(clientId);
    await this.sendPush(
      token,
      '📣 ¡Beep beep!',
      `${driverName} te está avisando`,
    );
  }

  /** Notifica al chofer que el cliente canceló el viaje. */
  async notifyRideCancelled(
    driverId: string | null,
    clientName: string,
  ): Promise<void> {
    const token = await this.getPushToken(driverId);
    await this.sendPush(
      token,
      '⚠️ Viaje cancelado',
      `${clientName} canceló el viaje`,
    );
  }

  /** Notifica al cliente que su pedido expiró sin recibir ofertas. */
  async notifyRideExpired(clientId: string | null): Promise<void> {
    const token = await this.getPushToken(clientId);
    await this.sendPush(
      token,
      '⏰ Pedido expirado',
      'No llegaron ofertas a tiempo. Podés pedir de nuevo.',
    );
  }

  /**
   * Envía una notificación push a través de la API de Expo.
   * No lanza errores — los fallos se loguean silenciosamente.
   */
  private async sendPush(
    token: string | null,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    if (!token) {
      this.logger.debug(
        `sendPush omitido: token no disponible (title: "${title}")`,
      );
      return;
    }

    // Validar que sea un token Expo válido
    if (
      !token.startsWith('ExponentPushToken[') &&
      !token.startsWith('ExpoPushToken[')
    ) {
      this.logger.warn(`sendPush: token inválido: ${token}`);
      return;
    }

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify({
          to: token,
          title,
          body,
          data: data ?? {},
          sound: 'default',
          priority: 'high',
        }),
      });

      const result = (await response.json()) as {
        data?: { status: string; message?: string };
      };
      const status = result?.data?.status;

      if (status === 'ok') {
        this.logger.log(
          `[PUSH ✓] "${title}" enviado a ${token.slice(0, 30)}...`,
        );
      } else {
        this.logger.warn(`[PUSH ✗] Expo respondió: ${JSON.stringify(result)}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`[PUSH] Error al enviar push: ${message}`);
    }
  }
}
