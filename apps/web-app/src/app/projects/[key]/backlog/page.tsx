'use client';
import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWorkItems, WorkItem, useCreateWorkItem } from '@/hooks/useWorkItems';
import apiClient from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { WORK_ITEM_KEYS } from '@/hooks/useWorkItems';

type SortKey = 'priority' | 'status' | 'title' | 'createdAt';
type SortDir = 'asc' | 'desc';

const STATUS_ORDER: Record<string, number> = {
  NEW: 0, APPROVED: 1, COMMITTED: 2, DONE: 3, REMOVED: 4,
};

const PRIORITY_BADGE: Record<number, string> = {
  1: 'bg-red-500/15 text-red-300 border-red-500/30',
  2: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  3: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  4: 'bg-slate-700/50 text-slate-400 border-slate-600',
};

const STATUS_BADGE: Record<string, string> = {
  NEW:       'bg-slate-700/50 text-slate-300 border-slate-600',
  APPROVED:  'bg-blue-500/15 text-blue-300 border-blue-500/30',
  COMMITTED: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  DONE:      'bg-green-500/15 text-green-300 border-green-500/30',
  REMOVED:   'bg-red-900/20 text-red-400 border-red-800/40',
};

const TYPE_ICON: Record<string, string> = {
  EPIC: '⚡', STORY: '📖', TASK: '✅', BUG: '🐛',
};

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="text-slate-700 ml-1">↕</span>;
  return <span className="text-violet-400 ml-1">{dir === 'asc' ? '↑' : '↓'}</span>;
}

export default function BacklogPage() {
  const params = useParams();
  const router = useRouter();
  const projectKey = params?.key as string;
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useWorkItems(projectKey);
  const createWorkItem = useCreateWorkItem();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('priority');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'EPIC' | 'STORY' | 'TASK' | 'BUG'>('TASK');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    let list = [...items];
    if (search) list = list.filter((i) => i.title.toLowerCase().includes(search.toLowerCase()));
    if (typeFilter !== 'all') list = list.filter((i) => i.type === typeFilter);
    if (statusFilter !== 'all') list = list.filter((i) => i.status === statusFilter);

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'priority')   cmp = a.priority - b.priority;
      if (sortKey === 'status')     cmp = (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0);
      if (sortKey === 'title')      cmp = a.title.localeCompare(b.title);
      if (sortKey === 'createdAt')  cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [items, search, typeFilter, statusFilter, sortKey, sortDir]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await createWorkItem.mutateAsync({ title: newTitle, description: '', type: newType, projectId: projectKey });
    setNewTitle(''); setShowCreate(false);
  };

  const handleStatusChange = async (item: WorkItem, newStatus: string) => {
    try {
      await apiClient.patch(`/api/work-items/${item.id}`, { item_status: newStatus });
      queryClient.invalidateQueries({ queryKey: WORK_ITEM_KEYS.all });
    } catch {
      alert('Invalid status transition');
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-slate-800 flex flex-col p-4 bg-slate-900/50">
        <button onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6 px-2">
          ← Dashboard
        </button>
        <div className="px-2 mb-4">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-1">Project</p>
          <p className="text-sm font-bold text-white">{projectKey}</p>
        </div>
        <nav className="space-y-1">
          {[
            { label: 'Board',   href: `/projects/${projectKey}/board`   },
            { label: 'Backlog', href: `/projects/${projectKey}/backlog`, active: true },
          ].map((item) => (
            <button key={item.label} onClick={() => router.push(item.href)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                item.active ? 'bg-violet-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
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
          <h1 className="text-xl font-black">
            <span className="text-slate-400 font-normal text-sm mr-2">Backlog /</span>
            {projectKey}
          </h1>
          <button id="backlog-create-btn" onClick={() => setShowCreate(true)}
            className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
            + New Item
          </button>
        </header>

        {/* Filters */}
        <div className="border-b border-slate-800 px-8 py-3 flex items-center gap-4">
          <input id="backlog-search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 w-56" />
          <select id="backlog-type-filter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-500">
            <option value="all">All Types</option>
            {['EPIC','STORY','TASK','BUG'].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select id="backlog-status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-500">
            <option value="all">All Statuses</option>
            {['NEW','APPROVED','COMMITTED','DONE','REMOVED'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="ml-auto text-xs text-slate-500">{filtered.length} items</span>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-slate-500 animate-pulse text-sm">Loading backlog...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-900/90 backdrop-blur border-b border-slate-800 z-10">
                <tr>
                  {[
                    { key: 'title',     label: 'Title',    width: '' },
                    { key: 'status',    label: 'Status',   width: 'w-32' },
                    { key: 'priority',  label: 'Priority', width: 'w-24' },
                    { key: 'createdAt', label: 'Created',  width: 'w-36' },
                    { key: null,        label: 'Actions',  width: 'w-36' },
                  ].map(({ key, label, width }) => (
                    <th key={label}
                      className={`px-6 py-3 text-left text-[10px] text-slate-500 font-bold uppercase tracking-wider ${width} ${key ? 'cursor-pointer hover:text-slate-300 select-none' : ''}`}
                      onClick={() => key && handleSort(key as SortKey)}>
                      {label}
                      {key && <SortIcon active={sortKey === key} dir={sortDir} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-600">No items match your filters.</td></tr>
                ) : filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px]">{TYPE_ICON[item.type] ?? '📝'}</span>
                        <span className="font-medium text-slate-200">{item.title}</span>
                        <span className="text-[10px] font-mono text-slate-600 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.id.substring(0, 8)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${STATUS_BADGE[item.status] ?? ''}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${PRIORITY_BADGE[item.priority] ?? PRIORITY_BADGE[4]}`}>
                        P{item.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[11px] text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item, e.target.value)}
                        className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-500">
                        {['NEW','APPROVED','COMMITTED','DONE','REMOVED'].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-[400px]">
            <h2 className="text-lg font-black mb-5">New Backlog Item</h2>
            <div className="space-y-4">
              <input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Item title..."
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
              <select value={newType} onChange={(e) => setNewType(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                {['EPIC','STORY','TASK','BUG'].map((t) => <option key={t} value={t}>{TYPE_ICON[t]} {t}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
              <button type="submit" disabled={createWorkItem.isPending}
                className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50">
                {createWorkItem.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
