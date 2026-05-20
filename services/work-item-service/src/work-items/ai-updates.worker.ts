import { Injectable, OnApplicationBootstrap, OnApplicationShutdown, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../prisma.service';

/**
 * AiUpdatesWorker — Redis Streams consumer for `events:updates`.
 *
 * The AI Orchestrator publishes triage results here (category, suggested_priority,
 * labels, summary). This worker reads those events and patches the work item in Postgres.
 *
 * All configuration is read from environment variables — no hardcoded values.
 */
@Injectable()
export class AiUpdatesWorker implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(AiUpdatesWorker.name);
  private redis: Redis;
  private running = false;

  // Stream / consumer-group config — read from env
  private readonly stream: string;
  private readonly group: string;
  private readonly consumer: string;
  private readonly blockMs: number;

  constructor(private prisma: PrismaService) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      ...(process.env.REDIS_PASSWORD ? { password: process.env.REDIS_PASSWORD } : {}),
    });

    this.stream   = process.env.UPDATES_STREAM   || 'events:updates';
    this.group    = process.env.UPDATES_CONSUMER_GROUP  || 'work-item-service-group';
    this.consumer = process.env.UPDATES_CONSUMER_NAME   || 'work-item-service-1';
    this.blockMs  = parseInt(process.env.UPDATES_BLOCK_MS || '5000');
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.ensureConsumerGroup();
    this.running = true;
    this.logger.log(
      `AI updates worker started | stream=${this.stream} | group=${this.group} | consumer=${this.consumer}`,
    );
    // Run in background — do not await
    this.loop().catch((err) => this.logger.error('AI updates worker crashed', err));
  }

  onApplicationShutdown(): void {
    this.running = false;
    this.redis.quit();
  }

  // ── Private ──────────────────────────────────────────────────────────────────

  private async ensureConsumerGroup(): Promise<void> {
    try {
      await this.redis.xgroup('CREATE', this.stream, this.group, '0', 'MKSTREAM');
      this.logger.log(`Consumer group '${this.group}' created on stream '${this.stream}'`);
    } catch (err: any) {
      if (err?.message?.includes('BUSYGROUP')) {
        this.logger.debug(`Consumer group '${this.group}' already exists`);
      } else {
        throw err;
      }
    }
  }

  private async loop(): Promise<void> {
    while (this.running) {
      try {
        const response = await this.redis.xreadgroup(
          'GROUP', this.group, this.consumer,
          'COUNT', '10',
          'BLOCK', String(this.blockMs),
          'STREAMS', this.stream, '>',
        ) as [string, [string, string[]][]][] | null;

        if (!response) continue;

        for (const [, entries] of response) {
          for (const [entryId, rawFields] of entries) {
            await this.processEntry(entryId, rawFields);
          }
        }
      } catch (err: any) {
        if (!this.running) break;
        this.logger.error(`AI updates worker error: ${err.message} — retrying in 3s`);
        await new Promise((r) => setTimeout(r, 3_000));
      }
    }
  }

  private async processEntry(entryId: string, rawFields: string[]): Promise<void> {
    // ioredis returns fields as a flat [key, value, key, value, ...] array
    const fields: Record<string, string> = {};
    for (let i = 0; i < rawFields.length; i += 2) {
      fields[rawFields[i]] = rawFields[i + 1];
    }

    const workItemId = fields['work_item_id'];
    if (!workItemId) {
      this.logger.warn(`Entry ${entryId} missing work_item_id — skipping`);
      await this.ack(entryId);
      return;
    }

    try {
      const patch: Record<string, any> = {};

      if (fields['category'])         patch['item_type']    = fields['category'];
      if (fields['suggested_priority']) {
        // Map AI priority strings to numeric priority if schema uses int
        const priorityMap: Record<string, number> = {
          Critical: 1, High: 2, Medium: 3, Low: 4,
        };
        patch['priority'] = priorityMap[fields['suggested_priority']] ?? 3;
      }
      if (fields['effort_estimate_days']) {
        const meta = { ai_effort_estimate_days: parseFloat(fields['effort_estimate_days']) };
        patch['github_metadata'] = meta;
      }

      if (Object.keys(patch).length > 0) {
        await this.prisma.work_items.update({
          where: { id: workItemId },
          data: patch,
        });
        this.logger.log(`Patched work item ${workItemId} with AI suggestions: ${JSON.stringify(patch)}`);
      }

      await this.ack(entryId);
    } catch (err: any) {
      // Do NOT ACK — leave pending for retry/dead-letter analysis
      this.logger.error(
        `Failed to patch work item ${workItemId} (entry ${entryId}): ${err.message}`,
      );
    }
  }

  private async ack(entryId: string): Promise<void> {
    await this.redis.xack(this.stream, this.group, entryId);
  }
}
