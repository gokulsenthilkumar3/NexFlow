import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { EventsGateway } from './events.gateway';

/**
 * RedisBridgeService
 *
 * Subscribes to the following Redis Streams and forwards events to all
 * connected Socket.IO clients via EventsGateway:
 *
 *   events:updates  — published by ai-orchestrator when triage completes
 *   events:breach   — published by helpdesk sla.worker on SLA breach
 *
 * Uses XREAD with blocking (COUNT 10, BLOCK 2000ms) in a loop so it
 * cleanly exits when the module is destroyed without leaving hanging
 * connections.
 */
@Injectable()
export class RedisBridgeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisBridgeService.name);
  private subscriber: Redis;
  private running = false;

  // Track last-seen stream IDs per stream
  private cursors: Record<string, string> = {
    'events:updates': '$',
    'events:breach':  '$',
  };

  constructor(
    private readonly config: ConfigService,
    private readonly gateway: EventsGateway,
  ) {}

  onModuleInit() {
    this.subscriber = new Redis({
      host: this.config.get<string>('redis.host', 'localhost'),
      port: this.config.get<number>('redis.port', 6379),
      password: this.config.get<string | undefined>('redis.password'),
      lazyConnect: false,
    });

    this.running = true;
    void this.poll();
    this.logger.log('Redis bridge started — listening on events:updates, events:breach');
  }

  async onModuleDestroy() {
    this.running = false;
    await this.subscriber.quit();
    this.logger.log('Redis bridge stopped');
  }

  /** Main XREAD polling loop */
  private async poll(): Promise<void> {
    while (this.running) {
      try {
        const streams = Object.entries(this.cursors).flatMap(([stream, cursor]) => [
          stream,
          cursor,
        ]);

        // XREAD COUNT 10 BLOCK 2000 STREAMS stream1 stream2 cursor1 cursor2
        const results: Array<[string, Array<[string, string[]]>]> | null =
          await (this.subscriber as any).xread(
            'COUNT', '10',
            'BLOCK', '2000',
            'STREAMS',
            ...streams,
          );

        if (!results) continue;

        for (const [streamName, entries] of results) {
          for (const [id, fields] of entries) {
            // Update cursor for next read
            this.cursors[streamName] = id;

            // Parse flat key-value field array → object
            const payload: Record<string, unknown> = {};
            for (let i = 0; i < fields.length; i += 2) {
              payload[fields[i]] = fields[i + 1];
            }

            this.dispatchEvent(streamName, payload);
          }
        }
      } catch (err) {
        if (this.running) {
          this.logger.error('Redis XREAD error:', err);
          // Brief back-off before retrying
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }
  }

  /** Map stream name → Socket.IO event name and emit */
  private dispatchEvent(stream: string, payload: Record<string, unknown>): void {
    switch (stream) {
      case 'events:updates': {
        // AI orchestrator published a triage result for a work item
        this.gateway.emit('workItemUpdated', {
          workItemId: payload['work_item_id'],
          category: payload['category'],
          priority: payload['priority'],
          summary: payload['summary'],
          projectId: payload['project_id'],
        });
        this.logger.debug(`Forwarded workItemUpdated for id=${payload['work_item_id']}`);
        break;
      }

      case 'events:breach': {
        // Helpdesk SLA breach
        this.gateway.emit('ticketUpdated', {
          ticketId: payload['ticket_id'],
          eventType: payload['event_type'],
          subject: payload['subject'],
          triggeredAt: payload['triggered_at'],
        });
        this.logger.debug(`Forwarded SLA breach for ticket_id=${payload['ticket_id']}`);
        break;
      }

      default:
        this.logger.warn(`Unknown stream: ${stream}`);
    }
  }
}
