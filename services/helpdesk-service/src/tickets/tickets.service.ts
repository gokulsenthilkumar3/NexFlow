import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { SlaService, SlaPriority } from '../sla/sla.service';
import { TICKET_SLA_QUEUE, SlaJobData } from '../worker/sla.worker';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private sla: SlaService,
    @InjectQueue(TICKET_SLA_QUEUE) private slaQueue: Queue,
  ) {}

  async create(data: {
    subject: string;
    description?: string;
    contactEmail: string;
    priority: SlaPriority;
    projectId?: string;
    assignedAgentId?: string;
    assignedAgentEmail?: string;
  }) {
    const deadlines = this.sla.getSlaDeadlines(data.priority);

    const ticket = await this.prisma.tickets.create({
      data: {
        subject: data.subject,
        description: data.description,
        contact_email: data.contactEmail,
        priority: data.priority,
        status: 'Open',
        assigned_agent_id: data.assignedAgentId,
        sla_response_at: deadlines.responseAt,
        sla_resolve_at: deadlines.resolveAt,
      },
    });

    // Schedule SLA warning jobs via BullMQ (delay in ms from now)
    const now = Date.now();

    const jobBase: SlaJobData = {
      ticketId: ticket.id,
      subject: ticket.subject,
      contactEmail: ticket.contact_email,
      assignedAgentEmail: data.assignedAgentEmail,
      eventType: 'RESPONSE_DUE',
    };

    await this.slaQueue.add(
      'sla-response-warning',
      { ...jobBase, eventType: 'RESPONSE_DUE' } satisfies SlaJobData,
      { delay: deadlines.responseAt.getTime() - now, attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    await this.slaQueue.add(
      'sla-resolve-warning',
      { ...jobBase, eventType: 'RESOLVE_DUE' } satisfies SlaJobData,
      { delay: deadlines.resolveAt.getTime() - now, attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    // Breach fires slightly after resolve deadline
    await this.slaQueue.add(
      'sla-breach',
      { ...jobBase, eventType: 'BREACH' } satisfies SlaJobData,
      { delay: deadlines.resolveAt.getTime() - now + 60_000, attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    return ticket;
  }

  async findAll(projectId?: string, priority?: string, status?: string) {
    return this.prisma.tickets.findMany({
      where: {
        ...(priority ? { priority } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const ticket = await this.prisma.tickets.findUnique({
      where: { id },
      include: { sla_logs: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async update(id: string, data: any) {
    await this.findOne(id); // validates existence
    return this.prisma.tickets.update({ where: { id }, data });
  }

  async createFromEmail(payload: { from: string; subject: string; body: string }) {
    return this.create({
      subject: payload.subject,
      description: payload.body,
      contactEmail: payload.from,
      priority: 'LOW',
    });
  }

  async getSlaDashboard() {
    const now = new Date();
    const thirtyMinsLater = new Date(now.getTime() + 30 * 60_000);

    const [byPriority, approaching, breached, byStatus] = await Promise.all([
      // count per priority
      this.prisma.tickets.groupBy({
        by: ['priority'],
        _count: { _all: true },
        where: { status: { not: 'Closed' } },
      }),
      // approaching SLA resolve in next 30 min
      this.prisma.tickets.count({
        where: {
          status: { notIn: ['Resolved', 'Closed'] },
          sla_resolve_at: { gte: now, lte: thirtyMinsLater },
        },
      }),
      // already breached (past resolve deadline and not resolved)
      this.prisma.tickets.count({
        where: {
          status: { notIn: ['Resolved', 'Closed'] },
          sla_resolve_at: { lt: now },
        },
      }),
      // count per status
      this.prisma.tickets.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ]);

    return {
      byPriority: byPriority.map((r) => ({ priority: r.priority, count: r._count._all })),
      byStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
      approachingSla: approaching,
      breached,
      generatedAt: now.toISOString(),
    };
  }
}
