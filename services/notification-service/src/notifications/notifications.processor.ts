import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { NotificationsService, NOTIFICATION_QUEUE } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { ConfigService } from '@nestjs/config';

@Processor(NOTIFICATION_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job<SendNotificationDto, unknown, string>): Promise<{ status: string }> {
    this.logger.log(`Processing notification job ${job.id} (channel: ${job.data.channel})`);

    const { channel } = job.data;
    if (channel === 'email' || channel === 'both') {
      try {
        await this.notificationsService.sendEmail(job.data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to send email for job ${job.id}: ${message}`);
        throw err; // BullMQ will retry
      }
    }
    if (channel === 'in-app' || channel === 'both') {
      try {
        this.sendInApp(job.data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to send in-app notification for job ${job.id}: ${message}`);
        throw err;
      }
    }
    return { status: 'delivered' };
  }

  private sendInApp(data: SendNotificationDto): void {
    const realtimeUrl = this.configService.get<string>('realtimeServiceUrl') ?? 'http://localhost:3005';
    this.logger.log(`Simulating in-app push to ${realtimeUrl}... payload: ${JSON.stringify(data.metadata)}`);
    // In production: publish to Redis Stream events:updates or call realtime-service HTTP API
  }
}
