import {
  Controller,
  Get,
  Query,
  Request,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { RidesService } from './rides.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('rides')
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  /**
   * GET /api/v1/rides/history?page=1&limit=20
   * Solo accesible por usuarios autenticados (JWT). Invitados → 401.
   * La respuesta se adapta automáticamente al rol del token:
   *   CLIENTE → viajes como pasajero
   *   CHOFER  → viajes como conductor
   */
  @Get('history')
  @UseGuards(JwtAuthGuard)
  getHistory(
    @Request() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.ridesService.getHistory(
      req.user.id,
      req.user.role,
      Math.max(1, parseInt(page, 10) || 1),
      Math.min(50, parseInt(limit, 10) || 20), // máximo 50 por request
    );
  }

  /**
   * GET /api/v1/rides/pending
   * Devuelve todos los viajes en estado PENDING. Solo para choferes.
   */
  @Get('pending')
  @UseGuards(JwtAuthGuard)
  getPendingRides(@Request() req: any) {
    if (req.user.role !== 'CHOFER') {
      throw new ForbiddenException(
        'Solo los choferes pueden ver los viajes pendientes',
      );
    }
    return this.ridesService.getPendingRides(req.user.id);
  }
}
