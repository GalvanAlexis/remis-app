import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * IsPremiumGuard — Verifica que el chofer autenticado tenga isPremium: true.
 *
 * Si premiumUntil está seteado, también verifica que no haya expirado.
 * Requiere que JwtAuthGuard se aplique antes (para que req.user esté disponible).
 */
@Injectable()
export class IsPremiumGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.id;

    if (!userId) return false;

    const doc = await this.prisma.driverDocument.findUnique({
      where: { userId },
      select: { isPremium: true, premiumUntil: true },
    });

    if (!doc?.isPremium) return false;

    // Si tiene fecha de expiración, verificar que no haya pasado
    if (doc.premiumUntil && doc.premiumUntil < new Date()) return false;

    return true;
  }
}
