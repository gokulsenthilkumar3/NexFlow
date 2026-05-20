import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EtlService } from '../etl/etl.service';

const PERIOD_DAYS: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };

const CSV_HEADERS: Record<string, string[]> = {
  TICKET_VOLUME:     ['Date', 'Total', 'Critical', 'High', 'Medium', 'Low'],
  AGENT_PERFORMANCE: ['AgentId', 'Resolved', 'Open', 'AvgResolutionHours'],
  SPRINT_VELOCITY:   ['Week', 'ItemsCompleted'],
  ASSET_UTILIZATION: ['Category', 'Total', 'Available', 'Assigned', 'Maintenance', 'Retired'],
};

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly etlService: EtlService,
  ) {}

  async getReport(type: string, period: string) {
    const days = PERIOD_DAYS[period] ?? 7;

    let snapshot = await this.prisma.reports_snapshots.findFirst({
      where: { report_type: type as any, period_days: days },
      orderBy: { generated_at: 'desc' },
    });

    // On cache miss, trigger ETL and retry once
    if (!snapshot) {
      await this.etlService.runForPeriod(days);
      snapshot = await this.prisma.reports_snapshots.findFirst({
        where: { report_type: type as any, period_days: days },
        orderBy: { generated_at: 'desc' },
      });
    }

    if (!snapshot) {
      throw new NotFoundException(`No data for report type ${type}, period ${period}. ETL may have failed.`);
    }

    return {
      type: snapshot.report_type,
      period,
      generatedAt: snapshot.generated_at,
      data: snapshot.payload,
    };
  }

  async triggerEtl(days: number) {
    await this.etlService.runForPeriod(days);
    return { message: `ETL triggered for ${days}d period` };
  }

  async exportCsv(type: string, period: string): Promise<string> {
    const report = await this.getReport(type, period);
    const payload = report.data as any;
    const headers = CSV_HEADERS[type] ?? ['Data'];

    const rows: string[][] = [headers];

    switch (type) {
      case 'TICKET_VOLUME':
        for (const day of payload.daily ?? []) {
          rows.push([
            day.date,
            String(day.count),
            String(day.byPriority?.CRITICAL ?? 0),
            String(day.byPriority?.HIGH ?? 0),
            String(day.byPriority?.MEDIUM ?? 0),
            String(day.byPriority?.LOW ?? 0),
          ]);
        }
        break;
      case 'AGENT_PERFORMANCE':
        for (const a of payload.agents ?? []) {
          rows.push([a.agentId, String(a.ticketsResolved), String(a.ticketsOpen), String(a.avgResolutionHours ?? '')]);
        }
        break;
      case 'SPRINT_VELOCITY':
        for (const w of payload.weeks ?? []) {
          rows.push([w.week, String(w.itemsCompleted)]);
        }
        break;
      case 'ASSET_UTILIZATION':
        for (const c of payload.categories ?? []) {
          rows.push([
            c.category,
            String(c.total),
            String(c.byStatus?.Available ?? 0),
            String(c.byStatus?.Assigned ?? 0),
            String(c.byStatus?.Maintenance ?? 0),
            String(c.byStatus?.Retired ?? 0),
          ]);
        }
        break;
      default:
        rows.push([JSON.stringify(payload)]);
    }

    return rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  }
}
