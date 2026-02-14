import { Module } from '@nestjs/common';
import { RidesController } from './rides.controller';
import { RidesService } from './rides.service';
import { RidesGateway } from './rides.gateway';

@Module({
  controllers: [RidesController],
  providers: [RidesService, RidesGateway]
})
export class RidesModule {}
