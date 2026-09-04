'use client';

import { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  useReport,
  useTriggerEtl,
  downloadReport,
  type ReportPeriod,
  type ReportType,
  type TicketVolumeData,
  type AgentPerformanceData,
  type SprintVelocityData,
  type AssetUtilizationData,
} from '@/hooks/useReports';

// ── Colours ───────────────────────────────────────────────────────────────────

const PRIORITY_COLORS = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#64748b' };
const STATUS_COLORS   = { Available: '#22c55e', Assigned: '#6366f1', Maintenance: '#f59e0b', Retired: '#475569' };
const TOOLTIP_STYLE   = { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 };

// ── Toast (inline — no external dep) ─────────────────────────────────────────

function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const show = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  return { toast, show };
}

function ToastBanner({ toast }: { toast: { msg: string; type: 'success' | 'error' } | null }) {
  if (!toast) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold transition-all ${
      toast.type === 'success'
        ? 'bg-green-500/20 border border-green-500/40 text-green-300'
        : 'bg-red-500/20 border border-red-500/40 text-red-300'
    }`}>
      {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
    </div>
  );
}

// ── Chart Card ────────────────────────────────────────────────────────────────

function ChartCard({
  title,
  type,
  period,
  isLoading,
  isEmpty,
  onExport,
  children,
}: {
  title: string;
  type: ReportType;
  period: ReportPeriod;
  isLoading: boolean;
  isEmpty: boolean;
  onExport: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
        >
          ↓ CSV
        </button>
      </div>
      {isLoading ? (
        <div className="h-48 animate-pulse rounded-xl bg-slate-800/50" />
      ) : isEmpty ? (
        <div className="flex h-48 flex-col items-center justify-center text-slate-600">
          <span className="text-3xl mb-2">📊</span>
          <p className="text-xs">No data for this period</p>
          <p className="text-xs mt-1">Click Refresh to generate</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>('30d');
  const triggerEtl = useTriggerEtl();
  const { toast, show: showToast } = useToast();

  const tv  = useReport<TicketVolumeData>('TICKET_VOLUME',     period);
  const ap  = useReport<AgentPerformanceData>('AGENT_PERFORMANCE', period);
  const sv  = useReport<SprintVelocityData>('SPRINT_VELOCITY',   period);
  const au  = useReport<AssetUtilizationData>('ASSET_UTILIZATION', period);

  const handleRefresh = async () => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    try {
      await triggerEtl.mutateAsync(days);
      showToast('Data refreshed successfully', 'success');
    } catch {
      showToast('Refresh failed — please try again', 'error');
    }
  };

  const handleExport = async (type: ReportType) => {
    try {
      await downloadReport(type, period);
    } catch (err) {
      showToast(`Export failed: ${(err as Error).message}`, 'error');
    }
  };

  // Typed data — no `as any` casts
  const tvData      = tv.data?.data?.daily ?? [];
  const apData      = ap.data?.data?.agents ?? [];
  const svData      = sv.data?.data?.weeks  ?? [];
  const auOverall   = au.data?.data?.overall ?? {};
  const auPieData   = Object.entries(auOverall).map(([name, value]) => ({ name, value }));

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Reports &amp; Analytics</h1>
            <p className="text-sm text-slate-500 mt-0.5">Pre-aggregated snapshots, refreshed daily at 2am</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Period tabs */}
            <div className="flex gap-1 rounded-lg border border-slate-700 p-0.5">
              {(['7d', '30d', '90d'] as ReportPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors
                    ${period === p ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={handleRefresh}
              disabled={triggerEtl.isPending}
              className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:text-white hover:border-violet-500 transition-colors disabled:opacity-50"
            >
              {triggerEtl.isPending ? <span className="animate-spin">⟳</span> : '↻'}
              Refresh Data
            </button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
          {[
            { label: 'Total Tickets',   value: tv.data?.data?.total ?? '—',    color: 'text-blue-400' },
            { label: 'Agents Active',   value: apData.length || '—',            color: 'text-violet-400' },
            { label: 'Sprints Tracked', value: svData.length || '—',            color: 'text-green-400' },
            { label: 'Total Assets',    value: au.data?.data?.total ?? '—',     color: 'text-amber-400' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{String(s.value)}</p>
            </div>
          ))}
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Ticket Volume */}
          <ChartCard
            title="Ticket Volume"
            type="TICKET_VOLUME"
            period={period}
            isLoading={tv.isLoading}
            isEmpty={tvData.length === 0}
            onExport={() => handleExport('TICKET_VOLUME')}
          >
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={tvData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => String(v).slice(5)} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#e2e8f0' }} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                {Object.entries(PRIORITY_COLORS).map(([p, color]) => (
                  <Line key={p} type="monotone" dataKey={`byPriority.${p}`} name={p} stroke={color} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Agent Performance — uses agentName with UUID fallback */}
          <ChartCard
            title="Agent Performance"
            type="AGENT_PERFORMANCE"
            period={period}
            isLoading={ap.isLoading}
            isEmpty={apData.length === 0}
            onExport={() => handleExport('AGENT_PERFORMANCE')}
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={apData.map((a) => ({
                  ...a,
                  displayName: a.agentName ?? (a.agentId?.slice(0, 8) + '…'),
                }))}
                margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="displayName" tick={{ fill: '#64748b', fontSize: 9 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                <Bar dataKey="ticketsResolved" name="Resolved" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ticketsOpen"     name="Open"     fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Sprint Velocity */}
          <ChartCard
            title="Sprint Velocity"
            type="SPRINT_VELOCITY"
            period={period}
            isLoading={sv.isLoading}
            isEmpty={svData.length === 0}
            onExport={() => handleExport('SPRINT_VELOCITY')}
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={svData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 9 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="itemsCompleted" name="Items Completed" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Asset Utilization — donut */}
          <ChartCard
            title="Asset Utilization"
            type="ASSET_UTILIZATION"
            period={period}
            isLoading={au.isLoading}
            isEmpty={auPieData.length === 0 || auPieData.every((d) => d.value === 0)}
            onExport={() => handleExport('ASSET_UTILIZATION')}
          >
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={240}>
                <PieChart>
                  <Pie
                    data={auPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive
                  >
                    {auPieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] ?? '#64748b'}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {auPieData.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] ?? '#64748b' }}
                      />
                      <span className="text-slate-400">{entry.name}</span>
                    </div>
                    <span className="text-white font-medium">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </div>
      </div>

      <ToastBanner toast={toast} />
    </div>
  );
}
