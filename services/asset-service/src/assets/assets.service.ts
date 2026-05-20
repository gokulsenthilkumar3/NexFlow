import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as QRCode from 'qrcode';

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Query ──────────────────────────────────────────────────────────────────

  async findAll(filters: { status?: string; category?: string; search?: string }) {
    return this.prisma.assets.findMany({
      where: {
        ...(filters.status ? { status: filters.status as any } : {}),
        ...(filters.category ? { category: filters.category as any } : {}),
        ...(filters.search
          ? {
              OR: [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { serial_number: { contains: filters.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        assignments: {
          where: { returned_at: null },
          take: 1,
          orderBy: { assigned_at: 'desc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const asset = await this.prisma.assets.findUnique({
      where: { id },
      include: {
        assignments: { orderBy: { assigned_at: 'desc' } },
        audit_logs: { orderBy: { created_at: 'desc' }, take: 20 },
      },
    });
    if (!asset) throw new NotFoundException(`Asset ${id} not found`);
    return asset;
  }

  async findByTicket(ticketId: string) {
    return this.prisma.assets.findMany({
      where: { linked_ticket_id: ticketId },
    });
  }

  // ── Mutations ──────────────────────────────────────────────────────────────

  async create(dto: {
    name: string;
    serial_number: string;
    category: string;
    purchase_date?: string;
    warranty_expiry?: string;
    purchase_cost?: number;
    notes?: string;
  }, performedBy: string) {
    // Create the asset first to get an ID
    const asset = await this.prisma.assets.create({
      data: {
        name: dto.name,
        serial_number: dto.serial_number,
        category: dto.category as any,
        purchase_date: dto.purchase_date ? new Date(dto.purchase_date) : null,
        warranty_expiry: dto.warranty_expiry ? new Date(dto.warranty_expiry) : null,
        purchase_cost: dto.purchase_cost ? dto.purchase_cost : null,
        notes: dto.notes,
        status: 'Available',
      },
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(`nexflow://assets/${asset.id}`);
    await this.prisma.assets.update({
      where: { id: asset.id },
      data: { qr_code_url: qrCodeUrl },
    });

    // Audit log
    await this.prisma.asset_audit_logs.create({
      data: { asset_id: asset.id, action: 'CREATED', performed_by: performedBy },
    });

    return { ...asset, qr_code_url: qrCodeUrl };
  }

  async update(id: string, dto: Partial<{ name: string; notes: string; purchase_date: string; warranty_expiry: string }>, performedBy: string) {
    await this.findOne(id);
    const updated = await this.prisma.assets.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.purchase_date ? { purchase_date: new Date(dto.purchase_date) } : {}),
        ...(dto.warranty_expiry ? { warranty_expiry: new Date(dto.warranty_expiry) } : {}),
      },
    });
    await this.prisma.asset_audit_logs.create({
      data: { asset_id: id, action: 'UPDATED', performed_by: performedBy, metadata: dto as any },
    });
    return updated;
  }

  async assign(id: string, dto: { userId: string; assignedBy: string; notes?: string }) {
    const asset = await this.findOne(id);
    if (asset.status !== 'Available') {
      throw new BadRequestException(`Asset is ${asset.status} and cannot be assigned`);
    }

    await this.prisma.asset_assignments.create({
      data: { asset_id: id, user_id: dto.userId, assigned_by: dto.assignedBy, notes: dto.notes },
    });
    await this.prisma.assets.update({ where: { id }, data: { status: 'Assigned' } });
    await this.prisma.asset_audit_logs.create({
      data: { asset_id: id, action: 'ASSIGNED', performed_by: dto.assignedBy, metadata: { userId: dto.userId } as any },
    });

    return this.findOne(id);
  }

  async return(id: string, performedBy: string) {
    await this.findOne(id);
    const activeAssignment = await this.prisma.asset_assignments.findFirst({
      where: { asset_id: id, returned_at: null },
    });
    if (!activeAssignment) throw new BadRequestException('No active assignment found');

    await this.prisma.asset_assignments.update({
      where: { id: activeAssignment.id },
      data: { returned_at: new Date() },
    });
    await this.prisma.assets.update({ where: { id }, data: { status: 'Available' } });
    await this.prisma.asset_audit_logs.create({
      data: { asset_id: id, action: 'RETURNED', performed_by: performedBy },
    });

    return this.findOne(id);
  }

  async markMaintenance(id: string, performedBy: string) {
    await this.findOne(id);
    await this.prisma.assets.update({ where: { id }, data: { status: 'Maintenance' } });
    await this.prisma.asset_audit_logs.create({
      data: { asset_id: id, action: 'MAINTENANCE', performed_by: performedBy },
    });
    return this.findOne(id);
  }

  async retire(id: string, performedBy: string) {
    const asset = await this.findOne(id);
    if (asset.status === 'Assigned') throw new BadRequestException('Cannot retire an assigned asset');

    await this.prisma.assets.update({ where: { id }, data: { status: 'Retired' } });
    await this.prisma.asset_audit_logs.create({
      data: { asset_id: id, action: 'RETIRED', performed_by: performedBy },
    });
    return this.findOne(id);
  }

  async linkTicket(id: string, ticketId: string, performedBy: string) {
    await this.findOne(id);
    await this.prisma.assets.update({ where: { id }, data: { linked_ticket_id: ticketId } });
    await this.prisma.asset_audit_logs.create({
      data: { asset_id: id, action: 'LINKED_TICKET', performed_by: performedBy, metadata: { ticketId } as any },
    });
    return this.findOne(id);
  }
}
