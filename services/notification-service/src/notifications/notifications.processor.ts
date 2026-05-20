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

  async process(job: Job<SendNotificationDto, any, string>): Promise<any> {
    this.logger.log(`Processing notification job ${job.id} (channel: ${job.data.channel})`);
    
    const { channel } = job.data;

    if (channel === 'email' || channel === 'both') {
      try {
        await this.notificationsService.sendEmail(job.data);
      } catch (err: any) {
        this.logger.error(`Failed to send email for job ${job.id}: ${err.message}`);
        throw err; // BullMQ will retry
      }
    }

    if (channel === 'in-app' || channel === 'both') {
      try {
        await this.sendInApp(job.data);
      } catch (err: any) {
        this.logger.error(`Failed to send in-app notification for job ${job.id}: ${err.message}`);
        throw err;
      }
    }

    return { status: 'delivered' };
  }

  private async sendInApp(data: SendNotificationDto): Promise<void> {
    // For in-app, we would typically push this to the realtime-service or a database.
    // For now, we'll simulate sending an HTTP request to the realtime-service (or just logging).
    const realtimeUrl = this.configService.get<string>('realtimeServiceUrl');
    this.logger.log(`Simulating in-app push to ${realtimeUrl}... payload: ${JSON.stringify(data.metadata)}`);
    // In a real scenario, we might use HTTP to call realtime-service API, or push to a Redis stream
    // that realtime-service listens to. 
    // Since we have Redis Streams setup in realtime-service (events:updates), we COULD push there
    // but typically notifications are user-specific. We'll leave it as a log for this phase.
  }
}
