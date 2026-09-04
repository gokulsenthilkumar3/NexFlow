'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { useTickets } from '@/hooks/useTickets';
import { AppSidebar } from '@/components/AppSidebar';
import { ComplianceGauge } from '@/components/ComplianceGauge';

// ── Types ─────────────────────────────────────────────────────────────────────
interface SlaDashboardData {
  byPriority: { priority: string; count: number }[];
  byStatus:   { status: string;   count: number }[];
  approachingSla: number;
  breached: number;
  generatedAt: string;
}

const REFRESH_INTERVAL_S = 30;

// ── Refresh Countdown Hook ─────────────────────────────────────────────────────
function useRefreshCountdown(totalSeconds: number, onRefetch: () => void) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const reset = () => setRemaining(totalSeconds);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          onRefetch();
          return totalSeconds;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [totalSeconds, onRefetch]);

  return { remaining, reset, progress: ((totalSeconds - remaining) / totalSeconds) * 100 };
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({
  data,
  colors,
  animate,
}: {
  data: { label: string; value: number }[];
  colors: Record<string, string>;
  animate: boolean;
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
              style={{ width: animate ? `${(value / max) * 100}%` : '0%' }}
            />
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-300 w-8 shrink-0">{value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Metric Tile ───────────────────────────────────────────────────────────────
function MetricTile({
  label, value, sub, accent, glow,
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
  const [barsVisible, setBarsVisible] = useState(false);
  const [showAllBreaches, setShowAllBreaches] = useState(false);

  const { data: dashData, isLoading: isDashLoading, refetch } = useQuery<SlaDashboardData>({
    queryKey: ['sla-dashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get<SlaDashboardData>('/api/tickets/sla-dashboard');
      return data;
    },
    refetchInterval: REFRESH_INTERVAL_S * 1000,
    staleTime: 20_000,
  });

  const { data: tickets = [] } = useTickets();

  // Trigger bar chart entry animation after data loads
  useEffect(() => {
    if (dashData) {
      const timer = setTimeout(() => setBarsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [dashData]);

  const { remaining: countdown, progress: countdownProgress } = useRefreshCountdown(
    REFRESH_INTERVAL_S,
    refetch,
  );

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

  const allBreaches = tickets.filter(
    (t) =>
      t.slaResolveAt &&
      new Date(t.slaResolveAt) < new Date() &&
      !['Resolved', 'Closed'].includes(t.status),
  );
  const visibleBreaches = showAllBreaches ? allBreaches : allBreaches.slice(0, 8);
  const totalOpen = tickets.filter((t) => t.status !== 'Closed').length;

  const helpdeskSubNav = [
    { label: 'Ticket Queue',  href: '/helpdesk/queue' },
    { label: 'SLA Dashboard', href: '/helpdesk/sla' },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <AppSidebar compact backLabel="Dashboard" backHref="/dashboard" subNav={helpdeskSubNav} />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 shrink-0 border-b border-slate-800 flex items-center justify-between gap-3 px-4 sm:px-8 bg-slate-900/30">
          <h1 className="text-xl font-black">SLA Dashboard</h1>
          <div className="flex items-center gap-4">
            {/* Countdown progress bar */}
            <div className="flex items-center gap-2">
              <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                  style={{ width: `${countdownProgress}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 tabular-nums">
                {countdown}s
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Updated {generatedAt}
            </div>
            <button
              id="sla-refresh-btn"
              onClick={() => { refetch(); setBarsVisible(false); setTimeout(() => setBarsVisible(true), 100); }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 transition-all"
            >
              ↻ Refresh
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8">
          {isDashLoading ? (
            <div className="text-center text-slate-500 animate-pulse py-12">Loading SLA data...</div>
          ) : (
            <>
              {/* Top metric tiles */}
              <div className="grid grid-cols-5 gap-5">
                <MetricTile
                  label="Total Open Tickets"
                  value={totalOpen}
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
                  glow={(dashData?.approachingSla ?? 0) > 3}
                />
                <MetricTile
                  label="SLA Breached"
                  value={dashData?.breached ?? 0}
                  sub="past resolve deadline"
                  accent="text-red-400"
                  glow={Boolean(dashData?.breached)}
                />
                {/* SLA Compliance gauge — spans the 5th column */}
                <ComplianceGauge
                  total={totalOpen}
                  breached={dashData?.breached ?? 0}
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
                      animate={barsVisible}
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
                      animate={barsVisible}
                    />
                  ) : (
                    <p className="text-slate-600 text-sm">No data</p>
                  )}
                </div>
              </div>

              {/* Breached tickets table */}
              {allBreaches.length > 0 && (
                <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-sm text-red-300 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      SLA Breached — Immediate Attention Required
                    </h2>
                    {allBreaches.length > 8 && (
                      <button
                        onClick={() => setShowAllBreaches((v) => !v)}
                        className="text-[11px] text-red-400 hover:text-red-300 underline-offset-2 hover:underline transition-colors"
                      >
                        {showAllBreaches
                          ? 'Show fewer'
                          : `View all ${allBreaches.length} breached →`}
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {visibleBreaches.map((t) => (
                      <div
                        key={t.id}
                        id={`sla-breach-${t.id}`}
                        onClick={() => router.push(`/helpdesk/tickets/${t.id}`)}
                        className="flex items-center justify-between p-4 bg-red-950/30 border border-red-500/20 rounded-xl cursor-pointer hover:border-red-500/40 transition-all"
                      >
                        <div>
                          <span className="text-[10px] font-mono text-red-400/60 block">{t.id.substring(0, 8)}</span>
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
