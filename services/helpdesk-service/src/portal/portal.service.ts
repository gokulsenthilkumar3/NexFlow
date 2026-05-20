import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { createHmac, createHash, randomBytes } from 'crypto';
import Redis from 'ioredis';
import axios from 'axios';

@Injectable()
export class PortalService {
  private readonly redis: Redis;
  private readonly jwtSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.redis = new Redis({
      host: this.config.get('REDIS_HOST', 'localhost'),
      port: parseInt(this.config.get('REDIS_PORT', '6379'), 10),
      lazyConnect: true,
    });
    this.jwtSecret = this.config.get('PORTAL_JWT_SECRET', 'portal-secret-change-in-production');
  }

  // ── OTP ───────────────────────────────────────────────────────────────────

  async sendOtp(email: string): Promise<void> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.set(`portal_otp:${email}`, otp, 'EX', 600);

    const resendKey = this.config.get('RESEND_API_KEY', '');
    if (resendKey) {
      try {
        await axios.post(
          'https://api.resend.com/emails',
          {
            from: 'NexFlow Support <noreply@nexflow.io>',
            to: email,
            subject: 'Your NexFlow Support Code',
            html: `<p>Your one-time login code is: <strong style="font-size:2em;letter-spacing:0.2em">${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
          },
          { headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' } },
        );
      } catch (err) {
        // Log but don't throw — code is still stored in Redis for dev testing
        console.warn('Resend email failed:', err?.message);
      }
    } else {
      console.log(`[DEV] Portal OTP for ${email}: ${otp}`); // visible in dev logs
    }
  }

  async verifyOtp(email: string, otp: string): Promise<{ token: string; email: string }> {
    const stored = await this.redis.get(`portal_otp:${email}`);
    if (!stored || stored !== otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
    await this.redis.del(`portal_otp:${email}`);
    const token = this.generatePortalJwt(email);
    return { token, email };
  }

  // ── JWT ───────────────────────────────────────────────────────────────────

  generatePortalJwt(email: string): string {
    const header  = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + 7 * 24 * 3600 * 1000 })).toString('base64url');
    const sig     = createHmac('sha256', this.jwtSecret).update(`${header}.${payload}`).digest('base64url');
    return `${header}.${payload}.${sig}`;
  }

  verifyPortalJwt(token: string): { email: string } {
    const parts = token.split('.');
    if (parts.length !== 3) throw new UnauthorizedException('Invalid token format');
    const [header, payload, sig] = parts;
    const expectedSig = createHmac('sha256', this.jwtSecret).update(`${header}.${payload}`).digest('base64url');
    if (expectedSig !== sig) throw new UnauthorizedException('Invalid token signature');

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (decoded.exp < Date.now()) throw new UnauthorizedException('Token expired');
    return { email: decoded.email };
  }

  // ── Tickets ───────────────────────────────────────────────────────────────

  async createPortalTicket(dto: {
    subject: string;
    description?: string;
    email: string;
    priority?: string;
  }) {
    return this.prisma.tickets.create({
      data: {
        subject: dto.subject,
        description: dto.description ?? '',
        contact_email: dto.email,
        priority: (dto.priority?.toUpperCase() ?? 'LOW') as any,
        status: 'Open',
        // required fields with defaults
        ticket_type: 'General',
      } as any,
    });
  }

  async getTicketsForEmail(email: string) {
    return this.prisma.tickets.findMany({
      where: { contact_email: email },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        subject: true,
        status: true,
        priority: true,
        contact_email: true,
        created_at: true,
      },
    });
  }

  async getTicketStatus(ticketId: string) {
    const ticket = await this.prisma.tickets.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) return null;

    const statusHistory = [
      { status: 'Open', timestamp: ticket.created_at, note: 'Ticket created' },
    ];

    // Add synthetic history entries based on status transitions
    if (['In Progress', 'Resolved', 'Closed'].includes(ticket.status)) {
      statusHistory.push({ status: 'In Progress', timestamp: ticket.updated_at ?? ticket.created_at, note: null });
    }
    if (['Resolved', 'Closed'].includes(ticket.status) && ticket.resolved_at) {
      statusHistory.push({ status: 'Resolved', timestamp: ticket.resolved_at, note: null });
    }
    if (ticket.status === 'Closed') {
      statusHistory.push({ status: 'Closed', timestamp: ticket.updated_at, note: null });
    }

    return { ...ticket, statusHistory };
  }

  // ── KB Proxy ──────────────────────────────────────────────────────────────

  async searchKb(q: string) {
    const kbUrl = this.config.get('KB_SERVICE_URL', 'http://localhost:3006');
    try {
      const { data } = await axios.get(`${kbUrl}/articles/public/search`, { params: { q }, timeout: 5000 });
      return data;
    } catch {
      return [];
    }
  }
}
