import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.redis = new Redis({
      host: this.configService.get<string>('redis.host'),
      port: this.configService.get<number>('redis.port'),
    });
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }

  async publishEvent(stream: string, type: string, payload: any) {
    await this.redis.xadd(
      stream,
      '*',
      'type',
      type,
      'payload',
      JSON.stringify(payload),
    );
  }
}
