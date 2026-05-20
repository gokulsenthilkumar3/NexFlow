import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type SlaPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface SlaDeadlines {
  responseAt: Date;
  resolveAt: Date;
}

@Injectable()
export class SlaService {
  constructor(private config: ConfigService) {}

  /**
   * Returns SLA deadlines based on priority.
   * Thresholds are driven entirely by env vars — no hardcoded values.
   *
   * Env vars (all in minutes):
   *   SLA_CRITICAL_RESPONSE_MIN, SLA_CRITICAL_RESOLVE_MIN
   *   SLA_HIGH_RESPONSE_MIN,     SLA_HIGH_RESOLVE_MIN
   *   SLA_MEDIUM_RESPONSE_MIN,   SLA_MEDIUM_RESOLVE_MIN
   *   SLA_LOW_RESPONSE_MIN,      SLA_LOW_RESOLVE_MIN
   */
  getSlaDeadlines(priority: SlaPriority, from: Date = new Date()): SlaDeadlines {
    const key = priority.toUpperCase();

    const responseMin = this.getMinutes(`SLA_${key}_RESPONSE_MIN`);
    const resolveMin = this.getMinutes(`SLA_${key}_RESOLVE_MIN`);

    return {
      responseAt: new Date(from.getTime() + responseMin * 60_000),
      resolveAt: new Date(from.getTime() + resolveMin * 60_000),
    };
  }

  private getMinutes(envKey: string): number {
    const raw = this.config.get<string>(envKey);
    if (!raw) {
      throw new Error(
        `Missing required env variable "${envKey}". ` +
          `Please set it in your .env file.`,
      );
    }
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed) || parsed <= 0) {
      throw new Error(
        `Env variable "${envKey}" must be a positive integer (minutes), got "${raw}"`,
      );
    }
    return parsed;
  }
}
