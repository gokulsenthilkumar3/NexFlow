'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTickets, useCreateTicket, Ticket, SLAPriority } from '@/hooks/useTickets';
import { TICKET_KEYS } from '@/hooks/useTickets';
import { useQueryClient } from '@tanstack/react-query';

// ── SLA Countdown ──────────────────────────────────────────────────────────────
function SlaCountdown({ resolveAt }: { resolveAt?: string }) {
  const [remaining, setRemaining] = useState('');
  const [isBreach, setIsBreach] = useState(false);

  const calc = useCallback(() => {
    if (!resolveAt) { setRemaining('—'); return; }
    const diff = new Date(resolveAt).getTime() - Date.now();
    if (diff <= 0) { setIsBreach(true); setRemaining('BREACH'); return; }
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    setRemaining(`${h}h ${m.toString().padStart(2,'0')}m ${s.toString().padStart(2,'0')}s`);
    setIsBreach(diff < 30 * 60_000); // warn if < 30 min
  }, [resolveAt]);

  useEffect(() => { calc(); const id = setInterval(calc, 1000); return () => clearInterval(id); }, [calc]);

  if (!resolveAt) return <span className="text-slate-600 text-[10px]">No SLA</span>;
  return (
    <span className={`text-[10px] font-mono font-bold ${
      remaining === 'BREACH' ? 'text-red-400 animate-pulse' : isBreach ? 'text-orange-400' : 'text-green-400'
    }`}>
      {remaining}
    </span>
  );
}

// ── Priority config ────────────────────────────────────────────────────────────
const PRIORITY_BADGE: Record<string, string> = {
  CRITICAL: 'bg-red-500/15 text-red-300 border-red-500/30',
  HIGH:     'bg-orange-500/15 text-orange-300 border-orange-500/30',
  MEDIUM:   'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  LOW:      'bg-slate-700/50 text-slate-400 border-slate-600',
};

const STATUS_BADGE: Record<string, string> = {
  'Open':        'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'In Progress': 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  'Resolved':    'bg-green-500/15 text-green-300 border-green-500/30',
  'Closed':      'bg-slate-700/50 text-slate-400 border-slate-600',
};

// ── Create Ticket Modal ────────────────────────────────────────────────────────
function CreateTicketModal({ onClose }: { onClose: () => void }) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [priority, setPriority] = useState<SLAPriority>('MEDIUM');
  const create = useCreateTicket();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !email) return;
    await create.mutateAsync({ subject, description, contactEmail: email, priority });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-[480px] shadow-2xl">
        <h2 className="text-lg font-black mb-5">New Ticket</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Subject</label>
            <input autoFocus id="ticket-subject" value={subject} onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of the issue..." />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Contact Email</label>
            <input id="ticket-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="reporter@company.com" />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Priority</label>
            <select id="ticket-priority" value={priority} onChange={(e) => setPriority(e.target.value as SLAPriority)}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              {['CRITICAL','HIGH','MEDIUM','LOW'].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Description (optional)</label>
            <textarea id="ticket-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Additional context..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
          <button type="submit" disabled={create.isPending}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50">
            {create.isPending ? 'Creating...' : 'Create Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Ticket Queue Page ──────────────────────────────────────────────────────────
export default function HelpdeskQueuePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: tickets = [], isLoading } = useTickets();

  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter]     = useState<string>('all');
  const [search, setSearch]                 = useState('');
  const [showCreate, setShowCreate]         = useState(false);

  const filtered = useMemo(() => {
    let list = [...tickets];
    if (priorityFilter !== 'all') list = list.filter((t) => t.priority === priorityFilter);
    if (statusFilter  !== 'all') list = list.filter((t) => t.status === statusFilter);
    if (search) list = list.filter((t) =>
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.contactEmail.toLowerCase().includes(search.toLowerCase()),
    );
    // Sort: CRITICAL first, then by creation date
    const pOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    list.sort((a, b) => (pOrder[a.priority] ?? 3) - (pOrder[b.priority] ?? 3));
    return list;
  }, [tickets, priorityFilter, statusFilter, search]);

  const stats = {
    total: tickets.length,
    critical: tickets.filter((t) => t.priority === 'CRITICAL' && t.status !== 'Closed').length,
    open: tickets.filter((t) => t.status === 'Open').length,
    resolved: tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length,
  };

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
            { label: 'Ticket Queue', href: '/helpdesk/queue', active: true },
            { label: 'SLA Dashboard', href: '/helpdesk/sla' },
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
          <h1 className="text-xl font-black">Ticket Queue</h1>
          <button id="queue-new-ticket-btn" onClick={() => setShowCreate(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
            + New Ticket
          </button>
        </header>

        {/* Stats row */}
        <div className="border-b border-slate-800 px-8 py-4 grid grid-cols-4 gap-4">
          {[
            { label: 'Total Tickets',   value: stats.total,    color: 'text-white' },
            { label: 'Critical',        value: stats.critical, color: 'text-red-400' },
            { label: 'Open',            value: stats.open,     color: 'text-blue-400' },
            { label: 'Resolved/Closed', value: stats.resolved, color: 'text-green-400' },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900/50 rounded-xl p-3 border border-slate-800">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="border-b border-slate-800 px-8 py-3 flex items-center gap-4">
          <input id="queue-search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets or email..."
            className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 w-64" />
          <select id="queue-priority-filter" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="all">All Priorities</option>
            {['CRITICAL','HIGH','MEDIUM','LOW'].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select id="queue-status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="all">All Statuses</option>
            {['Open','In Progress','Resolved','Closed'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="ml-auto text-xs text-slate-500">{filtered.length} tickets</span>
        </div>

        {/* Ticket list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {isLoading ? (
            <div className="text-center text-slate-500 animate-pulse py-12">Loading tickets...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-slate-600 py-12">No tickets match your filters.</div>
          ) : filtered.map((ticket) => (
            <div
              key={ticket.id}
              id={`ticket-card-${ticket.id}`}
              onClick={() => router.push(`/helpdesk/tickets/${ticket.id}`)}
              className="bg-slate-900/50 border border-slate-800 hover:border-slate-600 rounded-xl p-5 cursor-pointer transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-mono text-slate-600 shrink-0">{ticket.id.substring(0,8)}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${PRIORITY_BADGE[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${STATUS_BADGE[ticket.status] ?? ''}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-100 truncate group-hover:text-white transition-colors">
                    {ticket.subject}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">{ticket.contactEmail}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-slate-600 mb-1">SLA Resolve</p>
                  <SlaCountdown resolveAt={ticket.slaResolveAt} />
                  <p className="text-[10px] text-slate-600 mt-1">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreate && <CreateTicketModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
