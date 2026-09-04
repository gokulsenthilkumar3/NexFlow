import axios from 'axios';

/**
 * Axios instance pre-configured to point at the NexFlow API Gateway.
 * The base URL is injected from NEXT_PUBLIC_API_URL so no hardcoding occurs.
 *
 * The request interceptor automatically attaches the Clerk session JWT as a
 * Bearer token on every outgoing request. Clerk's getToken() is called lazily
 * (window.__clerk__) so this works both in browser and SSR environments.
 *
 * The response interceptor handles 401 Unauthorized responses gracefully by
 * logging out the user via the Clerk client.
 */

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['data', 'items', 'results', 'assets', 'tickets', 'workItems']) {
      if (Array.isArray(record[key])) return record[key];
    }
  }
  return [];
}

function normalizeDate(value: unknown): string {
  if (!value) return '';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function normalizeResponse(url: string, data: unknown): unknown {
  if (url.includes('/api/work-items')) {
    return asArray(data).map((item) => {
      const value = item as Record<string, unknown>;
      return {
        ...value,
        description: value.description ?? '',
        tags: Array.isArray(value.tags) ? value.tags : [],
        metadata: value.metadata && typeof value.metadata === 'object' ? value.metadata : {},
        createdAt: normalizeDate(value.createdAt ?? value.created_at),
        updatedAt: normalizeDate(value.updatedAt ?? value.updated_at),
      };
    });
  }
  if (url.includes('/api/tickets') && !url.includes('sla-dashboard')) {
    return asArray(data).map((ticket) => {
      const value = ticket as Record<string, unknown>;
      const rawStatus = String(value.status ?? 'Open').toUpperCase();
      const statusMap: Record<string, string> = {
        OPEN: 'Open', IN_PROGRESS: 'In Progress', RESOLVED: 'Resolved', CLOSED: 'Closed',
      };
      return {
        ...value,
        subject: value.subject ?? value.title ?? '',
        contactEmail: value.contactEmail ?? value.contact_email ?? '',
        status: statusMap[rawStatus] ?? value.status ?? 'Open',
        createdAt: normalizeDate(value.createdAt ?? value.created_at),
        slaResponseAt: normalizeDate(value.slaResponseAt ?? value.sla_response_at),
        slaResolveAt: normalizeDate(value.slaResolveAt ?? value.sla_resolve_at ?? value.slaDeadline),
      };
    });
  }
  if (url.includes('/api/assets')) return asArray(data);
  return data;
}

// ── Request Interceptor: attach Clerk JWT ──────────────────────────────────────
apiClient.interceptors.request.use(async (config) => {
  try {
    // Clerk exposes a global helper in the browser for token retrieval.
    // During SSR there is no window so we skip token attachment.
    if (typeof window !== 'undefined') {
      const clerk = (window as any).__clerk__;
      if (clerk?.session) {
        const token = await clerk.session.getToken();
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }
    }
  } catch {
    // Non-fatal: proceed without token (unauthenticated request)
  }
  return config;
});

// ── Response Interceptor: handle 401 & Mock Data ──────────────────────────────
apiClient.interceptors.response.use(
  (response) => {
    response.data = normalizeResponse(response.config.url || '', response.data);
    return response;
  },
  async (error) => {
    // ── Mock Backend Data on Network Error ──
    // If the backend is not running, return mock data instead of crashing the UI
    if (process.env.NODE_ENV !== 'production' && (error.code === 'ERR_NETWORK' || error.message.includes('Network Error'))) {
      const url = error.config.url || '';
      console.warn(`[API Mock] Backend unreachable. Intercepted request to ${url} and returning mock data.`);
      let mockData: any = {};
      if (url.includes('/api/work-items')) {
        mockData = [
          { id: '1', title: 'Implement Auth', status: 'COMMITTED', type: 'EPIC', priority: 1, projectId: 'DEFAULT', createdAt: '2026-05-20T08:00:00Z' },
          { id: '2', title: 'Fix Layout Bug', status: 'NEW', type: 'BUG', priority: 2, projectId: 'DEFAULT', createdAt: '2026-05-21T08:00:00Z' },
          { id: '3', title: 'Write Tests', status: 'APPROVED', type: 'TASK', priority: 3, projectId: 'DEFAULT', createdAt: '2026-05-22T08:00:00Z' },
          { id: '4', title: 'Deploy to Prod', status: 'DONE', type: 'STORY', priority: 4, projectId: 'DEFAULT', createdAt: '2026-05-23T08:00:00Z' },
        ];
      } else if (url.includes('/api/tickets/sla-dashboard')) {
        mockData = {
          generatedAt: new Date().toISOString(),
          activeTickets: 42,
          atRisk: 5,
          breached: 1,
          breachedTrend: 0,
          atRiskTrend: 0,
          resolutionTime: 1.5,
          resolutionTrend: 0,
          chartData: [
            { id: 'c1', title: 'UI freeze on login', status: 'OPEN', priority: 'CRITICAL', slaDeadline: new Date(Date.now() + 1800000).toISOString(), assignedTo: 'Mock User' },
            { id: 'c2', title: 'Database timeout', status: 'IN_PROGRESS', priority: 'CRITICAL', slaDeadline: new Date(Date.now() + 3600000).toISOString(), assignedTo: 'Mock User' }
          ],
          byPriority: { CRITICAL: 2, HIGH: 5, MEDIUM: 15, LOW: 20 },
        };
      } else if (url.includes('/api/tickets')) {
        mockData = [
          { id: 'T-100', title: 'Server Down', status: 'OPEN', priority: 'CRITICAL', slaDeadline: new Date(Date.now() + 3600000).toISOString(), createdAt: '2026-05-20T08:00:00Z' },
          { id: 'T-101', title: 'Login Failing', status: 'IN_PROGRESS', priority: 'HIGH', slaDeadline: new Date(Date.now() - 3600000).toISOString(), createdAt: '2026-05-21T08:00:00Z' },
          { id: 'T-102', title: 'Update Billing', status: 'OPEN', priority: 'MEDIUM', slaDeadline: new Date(Date.now() + 86400000).toISOString(), createdAt: '2026-05-22T08:00:00Z' },
        ];
      } else if (url.includes('/api/ai/insights')) {
        mockData = {
          generatedAt: new Date().toISOString(),
          insights: [
            { type: 'suggestion', message: 'Review server capacity', relatedEntities: [], createdAt: new Date().toISOString() },
            { type: 'alert', message: 'Update dependencies', relatedEntities: [], createdAt: new Date().toISOString() }
          ]
        };
      } else if (url.includes('/api/kb')) {
        mockData = [];
      } else if (url.includes('/api/reports')) {
        mockData = { metrics: [] };
      }
      return Promise.resolve({ data: normalizeResponse(url, mockData), status: 200, statusText: 'OK', headers: {}, config: error.config });
    }

    if (error.response?.status === 401 && typeof window !== 'undefined') {
      try {
        const clerk = (window as any).__clerk__;
        await clerk?.signOut();
        window.location.href = '/sign-in';
      } catch {
        // Ignore sign-out errors
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
