import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { RidesModule } from './rides/rides.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Rate limiting global: 3 perfiles configurables por endpoint
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60000, // 1 minuto
        limit: 100, // 100 req/min por IP (default global)
      },
      {
        name: 'auth',
        ttl: 60000, // 1 minuto
        limit: 5, // 5 req/min — protege login/register de brute force
      },
      {
        name: 'rides',
        ttl: 3600000, // 1 hora
        limit: 10, // 10 viajes/hora para guests
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    RidesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Aplica ThrottlerGuard globalmente a todos los controllers
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
