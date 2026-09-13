import { Injectable, BadRequestException } from '@nestjs/common';

export const DOMAINS = ['people', 'attendance', 'payroll', 'recruitment', 'facilities', 'procurement', 'maintenance', 'compliance', 'training', 'performance', 'workplace'] as const;
export type Domain = typeof DOMAINS[number];
const TABLES: Record<Domain, string> = { people: 'employees', attendance: 'attendance_logs', payroll: 'payroll_runs', recruitment: 'job_postings', facilities: 'meeting_rooms', procurement: 'purchase_requests', maintenance: 'maintenance_records', compliance: 'compliance_audits', training: 'training_courses', performance: 'performance_goals', workplace: 'locations' };

/**
 * Registry for Nexora's consolidated people/workplace API.  Database access is
 * intentionally introduced through service-specific repositories in follow-up
 * slices; this prevents raw HRMS tables leaking through public API contracts.
 */
@Injectable()
export class OperationsService {
  catalog(domain: Domain) { return { domain, table: TABLES[domain], state: 'ready-for-repository', capabilities: this.capabilities(domain) }; }
  private capabilities(domain: Domain): string[] {
    const base = ['list', 'read', 'create', 'update'];
    if (domain === 'people') return [...base, 'onboard', 'offboard', 'asset-return'];
    if (domain === 'attendance') return [...base, 'clock-in', 'clock-out', 'leave'];
    if (domain === 'payroll') return [...base, 'calculate', 'approve', 'process'];
    if (domain === 'recruitment') return [...base, 'applications', 'pipeline', 'public-careers'];
    return base;
  }
  action(domain: Domain, action: string, body: Record<string, unknown>) {
    if (!this.capabilities(domain).includes(action)) throw new BadRequestException(`Unsupported ${domain} action: ${action}`);
    return { accepted: true, domain, action, payload: body, message: 'Domain repository will persist this operation after the database migration is applied.' };
  }
}
