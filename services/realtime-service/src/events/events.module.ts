import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventsGateway } from './events.gateway';
import { EventsService } from './events.service';
import { RedisBridgeService } from './redis-bridge.service';

@Module({
  imports: [ConfigModule],
  providers: [EventsGateway, EventsService, RedisBridgeService],
})
export class EventsModule {}

