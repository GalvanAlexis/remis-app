import { Controller, Post, Body, UseGuards, Param, Query, HttpCode, HttpStatus, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('preference/:rideId')
  async createPreference(
    @Param('rideId') rideId: string,
    @Request() req,
  ) {
    return this.paymentsService.createPreference(rideId, req.user.id);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Query('topic') topic: string,
    @Query('id') id: string,
    @Body() body: any,
  ) {
    // Si la versión del SDK envía el topic/id en el body, lo extraemos de ahí también
    const resourceId = id || body?.data?.id;
    const resourceTopic = topic || body?.type;

    return this.paymentsService.handleWebhook(resourceTopic, resourceId);
  }
}
