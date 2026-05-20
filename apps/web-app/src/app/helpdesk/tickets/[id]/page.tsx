'use client';
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { Ticket, TICKET_KEYS } from '@/hooks/useTickets';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AiSummaryResult {
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
  suggestedSteps: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const PRIORITY_BADGE: Record<string, string> = {
  CRITICAL: 'bg-red-500/15 text-red-300 border-red-500/30',
  HIGH:     'bg-orange-500/15 text-orange-300 border-orange-500/30',
  MEDIUM:   'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  LOW:      'bg-slate-700/50 text-slate-400 border-slate-600',
};

const SENTIMENT_CONFIG: Record<string, { color: string; icon: string }> = {
  positive: { color: 'text-green-400', icon: '😊' },
  neutral:  { color: 'text-slate-400', icon: '😐' },
  negative: { color: 'text-orange-400', icon: '😟' },
  urgent:   { color: 'text-red-400',    icon: '🚨' },
};

function SlaBar({ responseAt, resolveAt }: { responseAt?: string; resolveAt?: string }) {
  const now = Date.now();
  const computeStatus = (deadline?: string) => {
    if (!deadline) return { label: '—', color: 'text-slate-600', pct: 0 };
    const d = new Date(deadline).getTime();
    if (d < now) return { label: 'BREACHED', color: 'text-red-400', pct: 100 };
    const diff = d - now;
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const label = `${h}h ${m}m left`;
    const pct = Math.max(0, Math.min(100, (1 - diff / (24 * 3_600_000)) * 100));
    const color = diff < 30 * 60_000 ? 'text-orange-400' : 'text-green-400';
    return { label, color, pct };
  };

  const resp = computeStatus(responseAt);
  const resol = computeStatus(resolveAt);

  return (
    <div className="space-y-3">
      {[
        { name: 'Response SLA', ...resp },
        { name: 'Resolve SLA',  ...resol },
      ].map(({ name, label, color, pct }) => (
        <div key={name}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400">{name}</span>
            <span className={`text-xs font-bold font-mono ${color}`}>{label}</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pct >= 100 ? 'bg-red-500' : pct > 70 ? 'bg-orange-500' : 'bg-green-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Ticket Detail Page ─────────────────────────────────────────────────────────
export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const ticketId = params?.id as string;

  const [aiSummary, setAiSummary] = useState<AiSummaryResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [linkItemId, setLinkItemId] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);

  // Fetch ticket detail
  const { data: ticket, isLoading, error } = useQuery<Ticket & { sla_logs?: { event_type: string; triggered_at: string }[] }>({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/tickets/${ticketId}`);
      return data;
    },
    enabled: Boolean(ticketId),
  });

  // Update ticket status mutation
  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const { data } = await apiClient.patch(`/api/tickets/${ticketId}`, { status: newStatus });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: TICKET_KEYS.all });
    },
  });

  // Link work item mutation
  const linkWorkItem = useMutation({
    mutationFn: async (workItemId: string) => {
      const { data } = await apiClient.patch(`/api/tickets/${ticketId}`, { linked_work_item_id: workItemId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      setShowLinkInput(false);
      setLinkItemId('');
    },
  });

  // AI Summarize
  const handleAiSummarize = async () => {
    if (!ticket) return;
    setIsAiLoading(true);
    setAiSummary(null);
    try {
      const { data } = await apiClient.post<AiSummaryResult>('/api/ai/summarize-ticket', {
        ticket_id: ticket.id,
        subject: ticket.subject,
        description: ticket.description ?? '',
        comments: [],
      });
      setAiSummary(data);
    } catch {
      setAiSummary({
        summary: 'AI summary unavailable — please check the AI Orchestrator service.',
        sentiment: 'neutral',
        suggestedSteps: [],
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center">
        <div className="text-slate-500 animate-pulse">Loading ticket...</div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center flex-col gap-4">
        <p className="text-red-400">Ticket not found or failed to load.</p>
        <button onClick={() => router.push('/helpdesk/queue')}
          className="text-sm text-slate-400 hover:text-white">← Back to Queue</button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-slate-800 flex flex-col p-4 bg-slate-900/50">
        <button onClick={() => router.push('/helpdesk/queue')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6 px-2">
          ← Ticket Queue
        </button>
        <div className="px-2 space-y-2">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest">Ticket</p>
          <p className="text-xs font-mono text-violet-400">{ticketId.substring(0,8)}</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 shrink-0 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/30">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-black text-white truncate max-w-[500px]">{ticket.subject}</h1>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${PRIORITY_BADGE[ticket.priority]}`}>
              {ticket.priority}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <select
              id="ticket-status-select"
              value={ticket.status}
              onChange={(e) => updateStatus.mutate(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-xl px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {['Open','In Progress','Resolved','Closed'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </header>

        {/* Content — two-column */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-3 gap-6">

            {/* Left: main content */}
            <div className="col-span-2 space-y-6">
              {/* Description */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-sm font-bold text-slate-300 mb-3">Description</h2>
                <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
                  {ticket.description || <span className="italic text-slate-600">No description provided.</span>}
                </p>
              </div>

              {/* AI Summary Panel */}
              <div className="bg-gradient-to-br from-indigo-950/40 to-purple-950/40 border border-indigo-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                    ✨ AI Summary
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-semibold">BETA</span>
                  </h2>
                  <button
                    id="ticket-ai-summarize-btn"
                    onClick={handleAiSummarize}
                    disabled={isAiLoading}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    {isAiLoading ? '⏳ Analyzing...' : '✨ Summarize with AI'}
                  </button>
                </div>

                {aiSummary ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{SENTIMENT_CONFIG[aiSummary.sentiment]?.icon}</span>
                      <span className={`text-xs font-bold ${SENTIMENT_CONFIG[aiSummary.sentiment]?.color}`}>
                        {aiSummary.sentiment.toUpperCase()} sentiment
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed italic">{aiSummary.summary}</p>
                    {aiSummary.suggestedSteps?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-400 mb-2">Suggested Steps:</p>
                        <ul className="space-y-1.5">
                          {aiSummary.suggestedSteps.map((step, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                              <span className="text-indigo-400 font-bold shrink-0">{i + 1}.</span>
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-indigo-400/60 italic">
                    Click "Summarize with AI" to generate an intelligent summary and sentiment analysis.
                  </p>
                )}
              </div>

              {/* SLA Logs */}
              {ticket.sla_logs && ticket.sla_logs.length > 0 && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-sm font-bold text-slate-300 mb-3">SLA Event Log</h2>
                  <div className="space-y-2">
                    {ticket.sla_logs.map((log, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          log.event_type === 'BREACH' ? 'bg-red-500' :
                          log.event_type === 'RESPONSE_DUE' ? 'bg-orange-400' : 'bg-yellow-400'
                        }`} />
                        <span className="text-slate-300 font-semibold">{log.event_type}</span>
                        <span className="text-slate-600">
                          {new Date(log.triggered_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: metadata */}
            <div className="space-y-5">
              {/* Details card */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Details</h2>
                <dl className="space-y-3">
                  {[
                    { label: 'Status',        value: ticket.status },
                    { label: 'Priority',      value: ticket.priority },
                    { label: 'Contact Email', value: ticket.contactEmail ?? (ticket as any).contact_email },
                    { label: 'Created',       value: new Date(ticket.createdAt ?? (ticket as any).created_at).toLocaleString() },
                    { label: 'Assigned To',   value: ticket.assignedAgentId ?? 'Unassigned' },
                    { label: 'Linked Item',   value: ticket.linkedWorkItemId ? ticket.linkedWorkItemId.substring(0,8) : '—' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <dt className="text-[10px] text-slate-600 uppercase tracking-wider">{label}</dt>
                      <dd className="text-xs text-slate-300 font-medium mt-0.5">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* SLA bar */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">SLA Status</h2>
                <SlaBar
                  responseAt={ticket.slaResponseAt ?? (ticket as any).sla_response_at}
                  resolveAt={ticket.slaResolveAt ?? (ticket as any).sla_resolve_at}
                />
              </div>

              {/* Link work item */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Link Work Item</h2>
                {showLinkInput ? (
                  <div className="space-y-2">
                    <input
                      id="ticket-link-item-input"
                      value={linkItemId}
                      onChange={(e) => setLinkItemId(e.target.value)}
                      placeholder="Work item UUID..."
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => linkWorkItem.mutate(linkItemId)}
                        disabled={!linkItemId || linkWorkItem.isPending}
                        className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                      >
                        Link
                      </button>
                      <button onClick={() => setShowLinkInput(false)}
                        className="px-3 py-1.5 text-slate-400 hover:text-white text-xs">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    id="ticket-link-item-btn"
                    onClick={() => setShowLinkInput(true)}
                    className="w-full py-2 border border-dashed border-slate-700 hover:border-blue-500/50 rounded-xl text-xs text-slate-500 hover:text-slate-300 transition-all"
                  >
                    + Link to Work Item
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
