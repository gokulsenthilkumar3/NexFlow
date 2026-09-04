'use client';

import { useState } from 'react';
import { useCreateWorkItem } from '@/hooks/useWorkItems';
import { useCreateTicket, SLAPriority } from '@/hooks/useTickets';

type Mode = 'pick' | 'workItem' | 'ticket';

interface QuickCreateModalProps {
  onClose: () => void;
}

const TYPE_OPTIONS = ['EPIC', 'STORY', 'TASK', 'BUG'] as const;
const PRIORITY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: '🔴 Critical' },
  { value: 2, label: '🟠 High' },
  { value: 3, label: '🟡 Medium' },
  { value: 4, label: '⚪ Low' },
];
const SLA_PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;

/**
 * QuickCreateModal — lets users pick between creating a Work Item or a Ticket
 * without navigating away from the dashboard. Triggered by the "+ Quick Create" button.
 */
export function QuickCreateModal({ onClose }: QuickCreateModalProps) {
  const [mode, setMode] = useState<Mode>('pick');

  // Work item state
  const [wiTitle, setWiTitle] = useState('');
  const [wiType, setWiType] = useState<typeof TYPE_OPTIONS[number]>('TASK');
  const [wiPriority, setWiPriority] = useState(3);
  const [wiDescription, setWiDescription] = useState('');
  const createWorkItem = useCreateWorkItem();

  // Ticket state
  const [tSubject, setTSubject] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tPriority, setTPriority] = useState<SLAPriority>('MEDIUM');
  const [tDescription, setTDescription] = useState('');
  const [tErrors, setTErrors] = useState<{ subject?: string; email?: string }>({});
  const createTicket = useCreateTicket();

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleCreateWorkItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wiTitle.trim()) return;
    await createWorkItem.mutateAsync({
      title: wiTitle,
      description: wiDescription,
      type: wiType,
      projectId: 'DEFAULT',
      priority: wiPriority,
    });
    onClose();
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { subject?: string; email?: string } = {};
    if (!tSubject.trim()) errors.subject = 'Subject is required';
    if (!tEmail.trim()) errors.email = 'Email is required';
    else if (!emailRegex.test(tEmail)) errors.email = 'Enter a valid email address';
    if (Object.keys(errors).length) { setTErrors(errors); return; }

    await createTicket.mutateAsync({
      subject: tSubject,
      description: tDescription,
      contactEmail: tEmail,
      priority: tPriority,
    });
    onClose();
  };

  // ── Shared backdrop ──────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-[480px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {mode !== 'pick' && (
              <button
                onClick={() => setMode('pick')}
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                ←
              </button>
            )}
            <h2 className="text-base font-black text-white">
              {mode === 'pick' && 'Quick Create'}
              {mode === 'workItem' && 'New Work Item'}
              {mode === 'ticket' && 'New Ticket'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-lg leading-none transition-colors">×</button>
        </div>

        {/* ── Pick mode ── */}
        {mode === 'pick' && (
          <div className="p-6 grid grid-cols-2 gap-4">
            <button
              onClick={() => setMode('workItem')}
              className="flex flex-col items-center gap-3 p-5 bg-violet-600/10 border border-violet-500/30 rounded-2xl hover:bg-violet-600/20 hover:border-violet-500/50 transition-all group"
            >
              <span className="text-3xl">📋</span>
              <div className="text-center">
                <p className="text-sm font-bold text-white">Work Item</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Epic, Story, Task or Bug</p>
              </div>
            </button>
            <button
              onClick={() => setMode('ticket')}
              className="flex flex-col items-center gap-3 p-5 bg-blue-600/10 border border-blue-500/30 rounded-2xl hover:bg-blue-600/20 hover:border-blue-500/50 transition-all group"
            >
              <span className="text-3xl">🎫</span>
              <div className="text-center">
                <p className="text-sm font-bold text-white">Support Ticket</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Customer helpdesk request</p>
              </div>
            </button>
          </div>
        )}

        {/* ── Work Item form ── */}
        {mode === 'workItem' && (
          <form onSubmit={handleCreateWorkItem} className="p-6 space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Title *</label>
              <input
                autoFocus
                value={wiTitle}
                onChange={(e) => setWiTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Describe the work item..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Type</label>
                <select
                  value={wiType}
                  onChange={(e) => setWiType(e.target.value as typeof TYPE_OPTIONS[number])}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Priority</label>
                <select
                  value={wiPriority}
                  onChange={(e) => setWiPriority(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {PRIORITY_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Description</label>
              <textarea
                value={wiDescription}
                onChange={(e) => setWiDescription(e.target.value)}
                rows={3}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                placeholder="Additional context..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
              <button
                type="submit"
                disabled={createWorkItem.isPending}
                className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              >
                {createWorkItem.isPending ? 'Creating…' : 'Create Item'}
              </button>
            </div>
          </form>
        )}

        {/* ── Ticket form ── */}
        {mode === 'ticket' && (
          <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Subject *</label>
              <input
                autoFocus
                value={tSubject}
                onChange={(e) => { setTSubject(e.target.value); setTErrors((p) => ({ ...p, subject: undefined })); }}
                className={`w-full bg-slate-800 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${tErrors.subject ? 'border-red-500' : 'border-slate-600'}`}
                placeholder="Brief description of the issue..."
              />
              {tErrors.subject && <p className="text-[11px] text-red-400 mt-1">{tErrors.subject}</p>}
            </div>
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Contact Email *</label>
              <input
                type="email"
                value={tEmail}
                onChange={(e) => { setTEmail(e.target.value); setTErrors((p) => ({ ...p, email: undefined })); }}
                className={`w-full bg-slate-800 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${tErrors.email ? 'border-red-500' : 'border-slate-600'}`}
                placeholder="reporter@company.com"
              />
              {tErrors.email && <p className="text-[11px] text-red-400 mt-1">{tErrors.email}</p>}
            </div>
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Priority</label>
              <select
                value={tPriority}
                onChange={(e) => setTPriority(e.target.value as SLAPriority)}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SLA_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Description</label>
              <textarea
                value={tDescription}
                onChange={(e) => setTDescription(e.target.value)}
                rows={3}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Additional context..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
              <button
                type="submit"
                disabled={createTicket.isPending}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              >
                {createTicket.isPending ? 'Creating…' : 'Create Ticket'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
