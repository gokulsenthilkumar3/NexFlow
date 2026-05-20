import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.getOrThrow<string>('SMTP_HOST'),
      port: parseInt(this.config.getOrThrow<string>('SMTP_PORT'), 10),
      secure: this.config.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.config.getOrThrow<string>('SMTP_USER'),
        pass: this.config.getOrThrow<string>('SMTP_PASS'),
      },
    });
  }

  async sendBreachNotification(opts: {
    to: string;
    ticketId: string;
    subject: string;
    contactEmail: string;
  }) {
    const fromName = this.config.get<string>('SMTP_FROM_NAME', 'NexFlow Helpdesk');
    const fromAddr = this.config.getOrThrow<string>('SMTP_FROM');

    await this.transporter.sendMail({
      from: `"${fromName}" <${fromAddr}>`,
      to: opts.to,
      subject: `🚨 SLA Breach — Ticket #${opts.ticketId.slice(0, 8)}`,
      html: `
        <h2>SLA Breach Alert</h2>
        <p>Ticket <strong>#${opts.ticketId.slice(0, 8)}</strong> has breached its SLA resolve deadline.</p>
        <ul>
          <li><strong>Subject:</strong> ${opts.subject}</li>
          <li><strong>Contact:</strong> ${opts.contactEmail}</li>
          <li><strong>Ticket ID:</strong> ${opts.ticketId}</li>
        </ul>
        <p>Please take immediate action.</p>
      `,
    });
  }

  async sendSlaWarning(opts: {
    to: string;
    ticketId: string;
    subject: string;
    eventType: 'RESPONSE_DUE' | 'RESOLVE_DUE';
  }) {
    const fromName = this.config.get<string>('SMTP_FROM_NAME', 'NexFlow Helpdesk');
    const fromAddr = this.config.getOrThrow<string>('SMTP_FROM');
    const label = opts.eventType === 'RESPONSE_DUE' ? 'Response' : 'Resolution';

    await this.transporter.sendMail({
      from: `"${fromName}" <${fromAddr}>`,
      to: opts.to,
      subject: `⚠️ SLA Warning — ${label} due for Ticket #${opts.ticketId.slice(0, 8)}`,
      html: `
        <h2>SLA Warning</h2>
        <p>Ticket <strong>#${opts.ticketId.slice(0, 8)}</strong> — ${label} SLA is approaching.</p>
        <ul>
          <li><strong>Subject:</strong> ${opts.subject}</li>
          <li><strong>Ticket ID:</strong> ${opts.ticketId}</li>
        </ul>
        <p>Please act before the SLA breach occurs.</p>
      `,
    });
  }
}
