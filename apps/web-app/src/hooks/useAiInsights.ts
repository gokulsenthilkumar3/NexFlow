import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AiInsight {
  type: 'correlation' | 'suggestion' | 'alert';
  message: string;
  relatedEntities: Array<{ type: 'ticket' | 'workItem' | 'pipeline'; id: string; label: string }>;
  actionLabel?: string;
  actionPayload?: Record<string, unknown>;
  createdAt: string;
}

export interface AiInsightsResponse {
  insights: AiInsight[];
  generatedAt: string;
}

// ── Query Key ─────────────────────────────────────────────────────────────────
export const AI_INSIGHTS_KEY = ['aiInsights'] as const;

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Fetches the latest AI Copilot insights from the AI Orchestrator service.
 * These are displayed in the "AI Copilot" panel on the dashboard.
 *
 * staleTime is intentionally longer (60s) because AI insights are expensive
 * to compute and don't change on every request.
 */
export function useAiInsights() {
  return useQuery({
    queryKey: AI_INSIGHTS_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<AiInsightsResponse>('/api/ai/insights');
      return data;
    },
    staleTime: 1000 * 60,      // 60 seconds
    retry: 1,                   // AI may be warming up — limit retries
    refetchOnWindowFocus: false, // Don't hammer AI on every tab switch
  });
}
