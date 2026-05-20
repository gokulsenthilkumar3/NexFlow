'use client';
import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { useTickets } from '@/hooks/useTickets';

// ── Types ─────────────────────────────────────────────────────────────────────
interface SlaDashboardData {
  byPriority: { priority: string; count: number }[];
  byStatus:   { status: string;   count: number }[];
  approachingSla: number;
  breached: number;
  generatedAt: string;
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({
  data,
  colors,
}: {
  data: { label: string; value: number }[];
  colors: Record<string, string>;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map(({ label, value }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 w-24 text-right shrink-0">{label}</span>
          <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${colors[label] ?? 'bg-slate-500'}`}
              style={{ width: `${(value / max) * 100}%` }}
            />
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-300 w-8 shrink-0">{value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Metric tile ───────────────────────────────────────────────────────────────
function MetricTile({
  label,
  value,
  sub,
  accent,
  glow,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent: string;
  glow?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 border bg-slate-900/60 transition-all ${
      glow ? 'border-red-500/40 shadow-[0_0_30px_-8px_rgba(239,68,68,0.4)]' : 'border-slate-800'
    }`}>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">{label}</p>
      <p className={`text-4xl font-black ${accent}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-600 mt-1">{sub}</p>}
    </div>
  );
}

// ── SLA Dashboard ─────────────────────────────────────────────────────────────
export default function SlaDashboardPage() {
  const router = useRouter();

  const { data: dashData, isLoading: isDashLoading, refetch } = useQuery<SlaDashboardData>({
    queryKey: ['sla-dashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get<SlaDashboardData>('/api/tickets/sla-dashboard');
      return data;
    },
    refetchInterval: 30_000, // refresh every 30s
    staleTime: 20_000,
  });

  const { data: tickets = [] } = useTickets();

  // Auto-refresh timestamp
  const generatedAt = dashData?.generatedAt
    ? new Date(dashData.generatedAt).toLocaleTimeString()
    : '—';

  const priorityColors: Record<string, string> = {
    CRITICAL: 'bg-red-500',
    HIGH:     'bg-orange-400',
    MEDIUM:   'bg-yellow-400',
    LOW:      'bg-slate-400',
  };

  const statusColors: Record<string, string> = {
    'Open':        'bg-blue-500',
    'In Progress': 'bg-violet-500',
    'Resolved':    'bg-green-500',
    'Closed':      'bg-slate-600',
  };

  // Derive recent breaches from ticket list (slaResolveAt in the past, not resolved/closed)
  const recentBreaches = tickets.filter(
    (t) =>
      t.slaResolveAt &&
      new Date(t.slaResolveAt) < new Date() &&
      !['Resolved', 'Closed'].includes(t.status),
  ).slice(0, 8);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-slate-800 flex flex-col p-4 bg-slate-900/50">
        <button onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6 px-2">
          ← Dashboard
        </button>
        <nav className="space-y-1">
          {[
            { label: 'Ticket Queue',   href: '/helpdesk/queue' },
            { label: 'SLA Dashboard',  href: '/helpdesk/sla', active: true },
          ].map((item) => (
            <button key={item.label} onClick={() => router.push(item.href)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                item.active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 shrink-0 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/30">
          <h1 className="text-xl font-black">SLA Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Updated {generatedAt}
            </div>
            <button id="sla-refresh-btn" onClick={() => refetch()}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 transition-all">
              ↻ Refresh
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {isDashLoading ? (
            <div className="text-center text-slate-500 animate-pulse py-12">Loading SLA data...</div>
          ) : (
            <>
              {/* Top metric tiles */}
              <div className="grid grid-cols-4 gap-5">
                <MetricTile
                  label="Total Open Tickets"
                  value={tickets.filter((t) => t.status !== 'Closed').length}
                  accent="text-white"
                />
                <MetricTile
                  label="Critical Tickets"
                  value={tickets.filter((t) => t.priority === 'CRITICAL' && t.status !== 'Closed').length}
                  accent="text-red-400"
                />
                <MetricTile
                  label="Approaching SLA"
                  value={dashData?.approachingSla ?? 0}
                  sub="resolve deadline within 30 min"
                  accent="text-orange-400"
                  glow={Boolean(dashData?.approachingSla)}
                />
                <MetricTile
                  label="SLA Breached"
                  value={dashData?.breached ?? 0}
                  sub="past resolve deadline"
                  accent="text-red-400"
                  glow={Boolean(dashData?.breached)}
                />
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                  <h2 className="font-bold text-sm mb-5 text-slate-200">Tickets by Priority</h2>
                  {dashData?.byPriority?.length ? (
                    <BarChart
                      data={dashData.byPriority.map((r) => ({ label: r.priority, value: r.count }))}
                      colors={priorityColors}
                    />
                  ) : (
                    <p className="text-slate-600 text-sm">No data</p>
                  )}
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                  <h2 className="font-bold text-sm mb-5 text-slate-200">Tickets by Status</h2>
                  {dashData?.byStatus?.length ? (
                    <BarChart
                      data={dashData.byStatus.map((r) => ({ label: r.status, value: r.count }))}
                      colors={statusColors}
                    />
                  ) : (
                    <p className="text-slate-600 text-sm">No data</p>
                  )}
                </div>
              </div>

              {/* Breached tickets table */}
              {recentBreaches.length > 0 && (
                <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-6">
                  <h2 className="font-bold text-sm mb-4 text-red-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    SLA Breached — Immediate Attention Required
                  </h2>
                  <div className="space-y-3">
                    {recentBreaches.map((t) => (
                      <div
                        key={t.id}
                        id={`sla-breach-${t.id}`}
                        onClick={() => router.push(`/helpdesk/tickets/${t.id}`)}
                        className="flex items-center justify-between p-4 bg-red-950/30 border border-red-500/20 rounded-xl cursor-pointer hover:border-red-500/40 transition-all"
                      >
                        <div>
                          <span className="text-[10px] font-mono text-red-400/60 block">{t.id.substring(0,8)}</span>
                          <p className="text-sm text-red-200 font-semibold">{t.subject}</p>
                          <p className="text-[11px] text-red-400/70">{t.contactEmail}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-red-500/15 text-red-300 border-red-500/30">
                            {t.priority}
                          </span>
                          <p className="text-[10px] text-red-400 mt-1 font-mono font-bold">BREACH</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
