import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async getAuditLog(assetId: string) {
    return this.prisma.asset_audit_logs.findMany({
      where: { asset_id: assetId },
      orderBy: { created_at: 'desc' },
    });
  }
}
