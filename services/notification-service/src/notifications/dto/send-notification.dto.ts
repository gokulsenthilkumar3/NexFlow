export class SendNotificationDto {
  /** Channel: 'email' | 'in-app' | 'both' */
  channel: 'email' | 'in-app' | 'both';

  /** Recipient email address (required for email channel) */
  to?: string;

  /** Subject line for email */
  subject?: string;

  /** Plain-text body */
  body: string;

  /** Optional HTML body for email */
  htmlBody?: string;

  /** Metadata attached to in-app notification (e.g. ticketId, projectId) */
  metadata?: Record<string, unknown>;

  /** Optional delay in milliseconds before delivery */
  delayMs?: number;
}
