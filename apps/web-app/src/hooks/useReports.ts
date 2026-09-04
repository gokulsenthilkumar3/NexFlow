'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ReportPeriod = '7d' | '30d' | '90d';
export type ReportType = 'TICKET_VOLUME' | 'AGENT_PERFORMANCE' | 'SPRINT_VELOCITY' | 'ASSET_UTILIZATION';

// Properly typed data shapes — no more `as any`
export interface TicketVolumeDayData {
  date: string;
  byPriority: { CRITICAL?: number; HIGH?: number; MEDIUM?: number; LOW?: number };
  total?: number;
}

export interface TicketVolumeData {
  daily: TicketVolumeDayData[];
  total: number;
}

export interface AgentData {
  agentId: string;
  agentName?: string;
  ticketsResolved: number;
  ticketsOpen: number;
  avgResolutionHours?: number;
}

export interface AgentPerformanceData {
  agents: AgentData[];
}

export interface SprintWeekData {
  week: string;
  itemsCompleted: number;
  itemsAdded?: number;
}

export interface SprintVelocityData {
  weeks: SprintWeekData[];
}

export interface AssetUtilizationData {
  overall: Record<string, number>; // e.g. { Available: 10, Assigned: 5, Maintenance: 2, Retired: 1 }
  total: number;
}

export interface ReportResponse<T> {
  data: T;
  period: ReportPeriod;
  generatedAt: string;
}

export const REPORT_KEYS = {
  report: (type: ReportType, period: ReportPeriod) => ['reports', type, period] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Typed generic report hook — no `as any` casts at call sites. */
export function useReport<T>(type: ReportType, period: ReportPeriod) {
  return useQuery<ReportResponse<T>>({
    queryKey: REPORT_KEYS.report(type, period),
    queryFn: async () => {
      const { data } = await apiClient.get<ReportResponse<T>>(`/api/reports/${type}`, {
        params: { period },
      });
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 min
    retry: 1,
  });
}

export function useTriggerEtl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (period: number) => {
      const { data } = await apiClient.post('/api/reports/trigger', { period });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function exportReportUrl(type: ReportType, period: ReportPeriod): string {
  const base =
    (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
    'http://localhost:8080';
  return `${base}/api/reports/${type}/export?period=${period}`;
}

/**
 * Triggers a fetch-based CSV download with proper error handling.
 * Use this instead of a raw <a> tag pointing to exportReportUrl().
 */
export async function downloadReport(type: ReportType, period: ReportPeriod): Promise<void> {
  const url = exportReportUrl(type, period);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }
  const blob = await response.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `nexflow-${type.toLowerCase()}-${period}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
