import {
  Controller,
  Get,
  UseGuards,
  Request,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { IsPremiumGuard } from './guards/is-premium.guard';
import { Role } from '@prisma/client';

@Controller('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CHOFER)
export class StatsController {
  constructor(private statsService: StatsService) {}

  /**
   * GET /stats/free
   * Datos básicos: total de viajes, ganancias del mes, rating promedio, historial últimos 20.
   * Disponible para TODOS los choferes.
   */
  @Get('free')
  async getFreeStats(@Request() req) {
    return this.statsService.getFreeStats(req.user.id);
  }

  /**
   * GET /stats/history?cursor=<id>&take=20
   * Historial paginado con cursor (free, con paginación real).
   */
  @Get('history')
  async getHistory(
    @Request() req,
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
  ) {
    return this.statsService.getRideHistory(
      req.user.id,
      cursor,
      take ? parseInt(take, 10) : 20,
    );
  }

  /**
   * GET /stats/premium
   * Analytics avanzado: gráficos, proyecciones, horas pico, zonas, rutas, ratings.
   * Solo accesible para choferes con isPremium: true.
   */
  @Get('premium')
  @UseGuards(IsPremiumGuard)
  async getPremiumStats(@Request() req) {
    return this.statsService.getPremiumStats(req.user.id);
  }
}
