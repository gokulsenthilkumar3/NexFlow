'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ReportPeriod = '7d' | '30d' | '90d';
export type ReportType = 'TICKET_VOLUME' | 'AGENT_PERFORMANCE' | 'SPRINT_VELOCITY' | 'ASSET_UTILIZATION';

export const REPORT_KEYS = {
  report: (type: ReportType, period: ReportPeriod) => ['reports', type, period] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useReport(type: ReportType, period: ReportPeriod) {
  return useQuery({
    queryKey: REPORT_KEYS.report(type, period),
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/reports/${type}`, { params: { period } });
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
  const base = (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:8080';
  return `${base}/api/reports/${type}/export?period=${period}`;
}
