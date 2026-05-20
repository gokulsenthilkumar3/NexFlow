import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import axios from 'axios';

@Injectable()
export class EtlService {
  private readonly logger = new Logger(EtlService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ── Scheduled: 2am daily ──────────────────────────────────────────────────

  @Cron('0 2 * * *')
  async runDailyEtl() {
    this.logger.log('Starting daily ETL job...');
    for (const days of [7, 30, 90]) {
      await Promise.allSettled([
        this.generateTicketVolume(days),
        this.generateAgentPerformance(days),
        this.generateSprintVelocity(days),
        this.generateAssetUtilization(days),
      ]);
    }
    this.logger.log('Daily ETL complete');
  }

  /** Manual trigger — called by ReportsService on cache miss. */
  async runForPeriod(days: number) {
    this.logger.log(`Manual ETL triggered for ${days}d`);
    await Promise.allSettled([
      this.generateTicketVolume(days),
      this.generateAgentPerformance(days),
      this.generateSprintVelocity(days),
      this.generateAssetUtilization(days),
    ]);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private period(days: number) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return { start, end };
  }

  private helpdeskUrl() { return this.config.get('HELPDESK_SERVICE_URL', 'http://localhost:3003'); }
  private workItemUrl() { return this.config.get('WORK_ITEM_SERVICE_URL', 'http://localhost:3002'); }
  private assetUrl()    { return this.config.get('ASSET_SERVICE_URL', 'http://localhost:3007'); }

  private async saveSnapshot(reportType: string, days: number, start: Date, end: Date, payload: object) {
    await this.prisma.reports_snapshots.create({
      data: {
        report_type: reportType as any,
        period_days: days,
        period_start: start,
        period_end: end,
        payload: payload as any,
        generated_at: new Date(),
      },
    });
  }

  // ── TICKET_VOLUME ─────────────────────────────────────────────────────────

  async generateTicketVolume(days: number) {
    try {
      const { start, end } = this.period(days);
      const res = await axios.get(`${this.helpdeskUrl()}/tickets`, { params: { limit: 2000 }, timeout: 10_000 }).catch(() => ({ data: [] }));
      const tickets: any[] = Array.isArray(res.data) ? res.data : [];

      const inPeriod = tickets.filter((t) => t.created_at && new Date(t.created_at) >= start);

      // Group by day
      const dailyMap = new Map<string, { count: number; byPriority: Record<string, number> }>();
      for (const t of inPeriod) {
        const day = new Date(t.created_at).toISOString().slice(0, 10);
        if (!dailyMap.has(day)) dailyMap.set(day, { count: 0, byPriority: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 } });
        const entry = dailyMap.get(day)!;
        entry.count++;
        const p = (t.priority ?? 'LOW').toUpperCase();
        entry.byPriority[p] = (entry.byPriority[p] ?? 0) + 1;
      }

      const daily = Array.from(dailyMap.entries())
        .map(([date, v]) => ({ date, ...v }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const byPriority = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
      for (const t of inPeriod) {
        const p = (t.priority ?? 'LOW').toUpperCase();
        byPriority[p as keyof typeof byPriority] = (byPriority[p as keyof typeof byPriority] ?? 0) + 1;
      }

      await this.saveSnapshot('TICKET_VOLUME', days, start, end, { daily, total: inPeriod.length, byPriority });
      this.logger.log(`TICKET_VOLUME (${days}d): ${inPeriod.length} tickets`);
    } catch (err) {
      this.logger.error(`TICKET_VOLUME ETL failed: ${err}`);
    }
  }

  // ── AGENT_PERFORMANCE ─────────────────────────────────────────────────────

  async generateAgentPerformance(days: number) {
    try {
      const { start, end } = this.period(days);
      const res = await axios.get(`${this.helpdeskUrl()}/tickets`, { params: { limit: 2000 }, timeout: 10_000 }).catch(() => ({ data: [] }));
      const tickets: any[] = Array.isArray(res.data) ? res.data : [];
      const inPeriod = tickets.filter((t) => t.created_at && new Date(t.created_at) >= start && t.assigned_agent_id);

      const agentMap = new Map<string, { resolved: number; open: number; totalHours: number; resolvedCount: number }>();
      for (const t of inPeriod) {
        const agent = t.assigned_agent_id;
        if (!agentMap.has(agent)) agentMap.set(agent, { resolved: 0, open: 0, totalHours: 0, resolvedCount: 0 });
        const entry = agentMap.get(agent)!;
        const isResolved = ['Resolved', 'Closed'].includes(t.status);
        if (isResolved) {
          entry.resolved++;
          if (t.resolved_at) {
            const hours = (new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime()) / 3_600_000;
            entry.totalHours += hours;
            entry.resolvedCount++;
          }
        } else {
          entry.open++;
        }
      }

      const agents = Array.from(agentMap.entries()).map(([agentId, v]) => ({
        agentId,
        ticketsResolved: v.resolved,
        ticketsOpen: v.open,
        avgResolutionHours: v.resolvedCount > 0 ? Math.round((v.totalHours / v.resolvedCount) * 10) / 10 : null,
      }));

      await this.saveSnapshot('AGENT_PERFORMANCE', days, start, end, { agents });
      this.logger.log(`AGENT_PERFORMANCE (${days}d): ${agents.length} agents`);
    } catch (err) {
      this.logger.error(`AGENT_PERFORMANCE ETL failed: ${err}`);
    }
  }

  // ── SPRINT_VELOCITY ───────────────────────────────────────────────────────

  async generateSprintVelocity(days: number) {
    try {
      const { start, end } = this.period(days);
      const res = await axios.get(`${this.workItemUrl()}/work-items`, { params: { limit: 2000 }, timeout: 10_000 }).catch(() => ({ data: [] }));
      const items: any[] = Array.isArray(res.data) ? res.data : [];

      const done = items.filter((i) =>
        ['Done', 'Closed', 'Removed'].includes(i.item_status) &&
        i.updated_at && new Date(i.updated_at) >= start,
      );

      // Group by ISO week: YYYY-WNN
      const weekMap = new Map<string, number>();
      for (const item of done) {
        const d = new Date(item.updated_at);
        const jan4 = new Date(d.getFullYear(), 0, 4);
        const week = Math.ceil(((d.getTime() - jan4.getTime()) / 86_400_000 + jan4.getDay() + 1) / 7);
        const key = `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
        weekMap.set(key, (weekMap.get(key) ?? 0) + 1);
      }

      const weeks = Array.from(weekMap.entries())
        .map(([week, itemsCompleted]) => ({ week, itemsCompleted }))
        .sort((a, b) => a.week.localeCompare(b.week));

      await this.saveSnapshot('SPRINT_VELOCITY', days, start, end, { weeks, totalCompleted: done.length });
      this.logger.log(`SPRINT_VELOCITY (${days}d): ${done.length} items completed`);
    } catch (err) {
      this.logger.error(`SPRINT_VELOCITY ETL failed: ${err}`);
    }
  }

  // ── ASSET_UTILIZATION ─────────────────────────────────────────────────────

  async generateAssetUtilization(days: number) {
    try {
      const { start, end } = this.period(365); // assets are not time-limited to period
      const res = await axios.get(`${this.assetUrl()}/assets`, { params: { limit: 2000 }, timeout: 10_000 }).catch(() => ({ data: [] }));
      const assets: any[] = Array.isArray(res.data) ? res.data : [];

      const overall = { Available: 0, Assigned: 0, Maintenance: 0, Retired: 0 };
      const catMap = new Map<string, typeof overall>();

      for (const a of assets) {
        overall[a.status as keyof typeof overall] = (overall[a.status as keyof typeof overall] ?? 0) + 1;
        if (!catMap.has(a.category)) catMap.set(a.category, { Available: 0, Assigned: 0, Maintenance: 0, Retired: 0 });
        const entry = catMap.get(a.category)!;
        entry[a.status as keyof typeof entry] = (entry[a.status as keyof typeof entry] ?? 0) + 1;
      }

      const categories = Array.from(catMap.entries()).map(([category, byStatus]) => ({
        category,
        total: Object.values(byStatus).reduce((s, n) => s + n, 0),
        byStatus,
      }));

      await this.saveSnapshot('ASSET_UTILIZATION', days, start, end, { categories, overall, total: assets.length });
      this.logger.log(`ASSET_UTILIZATION: ${assets.length} assets`);
    } catch (err) {
      this.logger.error(`ASSET_UTILIZATION ETL failed: ${err}`);
    }
  }
}
