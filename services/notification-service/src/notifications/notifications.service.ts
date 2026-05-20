import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as nodemailer from 'nodemailer';
import { SendNotificationDto } from './dto/send-notification.dto';

export const NOTIFICATION_QUEUE = 'notifications';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue(NOTIFICATION_QUEUE) private readonly notifQueue: Queue,
  ) {}

  onModuleInit() {
    const smtp = this.configService.get('smtp');
    this.transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
    });
    this.logger.log(`SMTP transport initialized → ${smtp.host}:${smtp.port}`);
  }

  /**
   * Enqueue a notification for async delivery.
   * Supports optional delay (e.g. SLA countdown).
   */
  async enqueue(dto: SendNotificationDto): Promise<{ jobId: string }> {
    const job = await this.notifQueue.add('send', dto, {
      delay: dto.delayMs ?? 0,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: false,
    });
    this.logger.log(`Notification job enqueued: ${job.id} (channel: ${dto.channel})`);
    return { jobId: String(job.id) };
  }

  /**
   * Send an email immediately (called by the processor).
   */
  async sendEmail(dto: SendNotificationDto): Promise<void> {
    if (!dto.to) {
      this.logger.warn('sendEmail called without recipient — skipping');
      return;
    }
    const from = this.configService.get<string>('smtp.from');
    const info = await this.transporter.sendMail({
      from,
      to: dto.to,
      subject: dto.subject ?? 'NexFlow Notification',
      text: dto.body,
      html: dto.htmlBody ?? `<p>${dto.body}</p>`,
    });
    this.logger.log(`Email sent to ${dto.to} — messageId: ${info.messageId}`);
  }
}
