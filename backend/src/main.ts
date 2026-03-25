import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('RemisBackend', {
              colors: true,
              prettyPrint: true,
            }),
          ),
        }),
        new (winston.transports as any).DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new (winston.transports as any).DailyRotateFile({
          filename: 'logs/combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
  });

  // Enable Socket.IO adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // Enable CORS for mobile app
  app.enableCors({
    origin: true, // Allow all origins in development. Specify allowed origins in production
    credentials: true,
  });

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Transform payloads to DTO instances
    }),
  );

  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
