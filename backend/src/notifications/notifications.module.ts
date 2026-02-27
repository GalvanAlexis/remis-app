import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Module({
  providers: [NotificationsService],
  exports: [NotificationsService], // Exportado para que RidesModule y otros lo inyecten
})
export class NotificationsModule {}
