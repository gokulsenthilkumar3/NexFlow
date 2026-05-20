import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import Redis from 'ioredis';

@Injectable()
export class WorkItemsService {
  private redis: Redis;

  constructor(private prisma: PrismaService) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });
  }

  async create(data: { title: string; description?: string; item_type?: string; priority?: number; project_id: string; assigned_to?: string; parent_id?: string }) {
    const workItem = await this.prisma.work_items.create({
      data: {
        ...data,
        item_status: 'New'
      }
    });

    // Publish to Redis Streams (events:triage)
    await this.redis.xadd(
      'events:triage',
      '*',
      'work_item_id', workItem.id,
      'title', workItem.title,
      'description', workItem.description || ''
    );

    return workItem;
  }

  async findAll(projectId?: string) {
    return this.prisma.work_items.findMany({
      where: projectId ? { project_id: projectId } : undefined,
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.work_items.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Work item not found');
    return item;
  }

  async update(id: string, data: any) {
    if (data.item_status) {
      await this.validateStatusTransition(id, data.item_status);
    }
    return this.prisma.work_items.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.work_items.delete({ where: { id } });
  }

  async linkTicket(id: string, ticketId: string) {
    const item = await this.findOne(id);
    const meta = (item.github_metadata as any) || {};
    meta.linkedTicketId = ticketId;
    return this.prisma.work_items.update({
      where: { id },
      data: { github_metadata: meta }
    });
  }

  private async validateStatusTransition(id: string, newStatus: string) {
    const item = await this.findOne(id);
    const validTransitions: Record<string, string[]> = {
      'New': ['Approved', 'Removed'],
      'Approved': ['Committed', 'New', 'Removed'],
      'Committed': ['Done', 'Approved', 'Removed'],
      'Done': ['Committed', 'Removed'],
      'Removed': ['New']
    };

    const allowed = validTransitions[item.item_status || 'New'] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(`Invalid transition from ${item.item_status} to ${newStatus}`);
    }
  }
}
