import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '@nexflow/shared-types';

@UseGuards(JwtAuthGuard)
@Controller('assets')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get(':id/audit-log')
  getAuditLog(@Param('id') id: string) {
    return this.auditService.getAuditLog(id);
  }
}
