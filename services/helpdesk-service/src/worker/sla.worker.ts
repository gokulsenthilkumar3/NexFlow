import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const TICKET_SLA_QUEUE = 'ticket-sla-queue';

export interface SlaJobData {
  ticketId: string;
  subject: string;
  contactEmail: string;
  assignedAgentEmail?: string;
  eventType: 'RESPONSE_DUE' | 'RESOLVE_DUE' | 'BREACH';
}

@Processor(TICKET_SLA_QUEUE)
@Injectable()
export class SlaWorker extends WorkerHost {
  private redis: Redis;

  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private config: ConfigService,
  ) {
    super();
    this.redis = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: parseInt(this.config.get<string>('REDIS_PORT', '6379'), 10),
    });
  }

  async process(job: Job<SlaJobData>): Promise<void> {
    const { ticketId, subject, contactEmail, assignedAgentEmail, eventType } = job.data;

    // 1. Write SLA log entry
    await this.prisma.sla_logs.create({
      data: {
        ticket_id: ticketId,
        event_type: eventType as any,
        triggered_at: new Date(),
      },
    });

    // 2. Send email notification
    const notifyEmail = assignedAgentEmail || contactEmail;

    if (eventType === 'BREACH') {
      await this.mail.sendBreachNotification({
        to: notifyEmail,
        ticketId,
        subject,
        contactEmail,
      });

      // 3. Publish breach event to Redis Streams
      await this.redis.xadd(
        'events:breach',
        '*',
        'ticket_id', ticketId,
        'subject', subject,
        'event_type', 'BREACH',
        'triggered_at', new Date().toISOString(),
      );
    } else {
      await this.mail.sendSlaWarning({
        to: notifyEmail,
        ticketId,
        subject,
        eventType,
      });
    }
  }
}
