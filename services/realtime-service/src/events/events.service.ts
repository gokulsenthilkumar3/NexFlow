import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { EventsGateway } from './events.gateway';

// Redis stream names consumed by this service
const STREAMS = {
  UPDATES: 'events:updates',
  AI: 'events:ai',
} as const;

const CONSUMER_GROUP = 'realtime-consumers';
const CONSUMER_NAME = 'realtime-service';

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsService.name);
  private subscriber: Redis;
  private running = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly gateway: EventsGateway,
  ) {}

  async onModuleInit() {
    const host = this.configService.get<string>('redis.host');
    const port = this.configService.get<number>('redis.port');
    const password = this.configService.get<string>('redis.password');

    this.subscriber = new Redis({ host, port, password });

    // Ensure consumer groups exist
    await this.ensureGroups();

    this.running = true;
    this.startConsuming();
  }

  async onModuleDestroy() {
    this.running = false;
    await this.subscriber.quit();
  }

  private async ensureGroups() {
    for (const stream of Object.values(STREAMS)) {
      try {
        await this.subscriber.xgroup('CREATE', stream, CONSUMER_GROUP, '$', 'MKSTREAM');
        this.logger.log(`Consumer group created for stream: ${stream}`);
      } catch (err: any) {
        if (!err.message.includes('BUSYGROUP')) {
          this.logger.warn(`Could not create group for ${stream}: ${err.message}`);
        }
      }
    }
  }

  private async startConsuming() {
    while (this.running) {
      try {
        const results = await this.subscriber.xreadgroup(
          'GROUP',
          CONSUMER_GROUP,
          CONSUMER_NAME,
          'COUNT',
          '10',
          'BLOCK',
          '2000',
          'STREAMS',
          ...Object.values(STREAMS),
          ...Object.values(STREAMS).map(() => '>'),
        );

        if (!results) continue;

        for (const [stream, messages] of results as [string, [string, string[]][]][]) {
          for (const [id, fields] of messages) {
            const payload = this.parseFields(fields);
            this.dispatch(stream, payload);

            // Acknowledge the message
            await this.subscriber.xack(stream, CONSUMER_GROUP, id);
          }
        }
      } catch (err: any) {
        if (this.running) {
          this.logger.error(`Stream consumption error: ${err.message}`);
          await this.sleep(1000);
        }
      }
    }
  }

  private parseFields(fields: string[]): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (let i = 0; i < fields.length; i += 2) {
      const key = fields[i];
      const value = fields[i + 1];
      try {
        result[key] = JSON.parse(value);
      } catch {
        result[key] = value;
      }
    }
    return result;
  }

  private dispatch(stream: string, payload: Record<string, unknown>) {
    if (stream === STREAMS.UPDATES) {
      const eventType = (payload['type'] as string) ?? 'workItemUpdated';
      this.logger.debug(`Emitting ${eventType} from ${stream}`);
      this.gateway.emit(eventType, payload);
    } else if (stream === STREAMS.AI) {
      this.logger.debug(`Emitting aiSuggestion from ${stream}`);
      this.gateway.emit('aiSuggestion', payload);
    }
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
