import { Injectable, Logger } from '@nestjs/common';

/**
 * NotificationsService — STUB para implementar después.
 *
 * Actualmente los métodos sólo registran en el log.
 * Para implementar push notifications reales:
 *   - Integrar con Expo Notifications (servicio: https://exp.host/--/api/v2/push/send)
 *   - Guardar el `expoPushToken` del cliente en la tabla Users o Profiles
 *   - Reemplazar el Logger.log() por una llamada HTTP a la API de Expo
 *
 * Token storage pendiente: agregar campo `pushToken String?` a Profile en schema.prisma
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  /**
   * Notifica al cliente que el chofer está en camino.
   * @param clientPushToken - Token Expo del cliente (pendiente de implementar)
   * @param driverName - Nombre del chofer
   */
  async notifyDriverEnRoute(
    clientPushToken: string | null,
    driverName: string,
  ): Promise<void> {
    this.logger.log(
      `[STUB] notifyDriverEnRoute → cliente, chofer: ${driverName}`,
    );
    // TODO: implementar llamada a Expo Push Notifications API
    // await this.sendPush(clientPushToken, '🚗 Tu remis está en camino', `${driverName} ya va para allá`);
  }

  /**
   * Notifica al cliente que el chofer llegó al punto de encuentro.
   * @param clientPushToken - Token Expo del cliente
   * @param driverName - Nombre del chofer
   */
  async notifyDriverArrived(
    clientPushToken: string | null,
    driverName: string,
  ): Promise<void> {
    this.logger.log(
      `[STUB] notifyDriverArrived → cliente, chofer: ${driverName}`,
    );
    // TODO: implementar llamada a Expo Push Notifications API
    // await this.sendPush(clientPushToken, '📍 Tu remis llegó', `${driverName} te está esperando`);
  }

  /**
   * Notifica al cliente que el chofer tocó la bocina.
   * Se puede llamar múltiples veces — cada toque genera una notif.
   * @param clientPushToken - Token Expo del cliente
   * @param driverName - Nombre del chofer
   */
  async notifyHorn(
    clientPushToken: string | null,
    driverName: string,
  ): Promise<void> {
    this.logger.log(`[STUB] notifyHorn → cliente, chofer: ${driverName}`);
    // TODO: implementar llamada a Expo Push Notifications API
    // await this.sendPush(clientPushToken, '📣 ¡Beep beep!', `${driverName} te está avisando`);
  }

  /**
   * Método base para enviar push notifications via Expo.
   * Implementar cuando el token del cliente esté disponible.
   */
  private async sendPush(
    token: string | null,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    if (!token) {
      this.logger.warn('[STUB] sendPush: no hay token disponible, omitiendo');
      return;
    }

    // TODO: descomentar cuando Expo Push esté configurado
    // const response = await fetch('https://exp.host/--/api/v2/push/send', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ to: token, title, body, data }),
    // });
    // const result = await response.json();
    // this.logger.log(`[PUSH] enviado: ${JSON.stringify(result)}`);

    this.logger.log(`[STUB] push: "${title}" → "${body}" (token: ${token})`);
  }
}
