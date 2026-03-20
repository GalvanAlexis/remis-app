import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private mpClient: MercadoPagoConfig;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const accessToken = this.configService.get<string>('MP_ACCESS_TOKEN');
    if (accessToken) {
      this.mpClient = new MercadoPagoConfig({ accessToken });
    } else {
      this.logger.warn('Mercado Pago Access Token not found in environment variables.');
    }
  }

  async createPreference(rideRequestId: string, userId: string) {
    const rideRequest = await this.prisma.rideRequest.findUnique({
      where: { id: rideRequestId },
      include: { selectedOffer: true },
    });

    if (!rideRequest || !rideRequest.selectedOffer) {
      throw new Error('Ride request not found or no offer selected.');
    }

    if (rideRequest.clientId !== userId) {
      throw new Error('Unauthorized to create payment for this ride.');
    }

    if (!this.mpClient) {
      throw new Error('Mercado Pago integration not configured.');
    }

    const preference = new Preference(this.mpClient);

    const result = await preference.create({
      body: {
        items: [
          {
            id: rideRequest.id,
            title: `Viaje - Remis (${rideRequest.originAddress} -> ${rideRequest.destAddress})`,
            quantity: 1,
            unit_price: rideRequest.selectedOffer.quotedPrice,
            currency_id: 'ARS',
          },
        ],
        notification_url: this.configService.get<string>('MP_WEBHOOK_URL'),
        external_reference: rideRequest.id,
        back_urls: {
          success: `${this.configService.get<string>('APP_SCHEME')}://payment/success`,
          failure: `${this.configService.get<string>('APP_SCHEME')}://payment/failure`,
          pending: `${this.configService.get<string>('APP_SCHEME')}://payment/pending`,
        },
        auto_return: 'approved',
      },
    });

    // Guardar el preference ID en la DB
    await this.prisma.rideRequest.update({
      where: { id: rideRequestId },
      data: {
        mercadopagoPreferenceId: result.id,
        paymentMethod: 'MERCADOPAGO',
      },
    });

    return {
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point,
    };
  }

  async handleWebhook(topic: string, id: string) {
    this.logger.log(`Webhook received: Topic=${topic}, ID=${id}`);

    // Mercado Pago envía 'payment' o 'merchant_order'
    if (topic === 'payment') {
      // Aquí consultaríamos el estado del pago a Mercado Pago
      // Pero para este MVP simplificado, si recibimos el webhook correcto
      // actualizamos el estado. (En producción se debe validar contra el API de MP)
      
      // Simulación de búsqueda del rideId mediante el external_reference del pago
      // En una implementación real usaríamos: const payment = await new Payment(this.mpClient).get({ id });
      
      // update payment status ...
      this.logger.log(`Processing payment update for ID ${id}`);
    }

    return { success: true };
  }
}
