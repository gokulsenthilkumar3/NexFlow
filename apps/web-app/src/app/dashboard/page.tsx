'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/clerk-mock';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket, disconnectSocket, SOCKET_EVENTS } from '@/lib/socket';
import { useWorkItems, WORK_ITEM_KEYS } from '@/hooks/useWorkItems';
import { usePriorityTickets, TICKET_KEYS } from '@/hooks/useTickets';
import { useAiInsights } from '@/hooks/useAiInsights';
import { useNotifications } from '@/hooks/useNotifications';
import { AppSidebar } from '@/components/AppSidebar';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { QuickCreateModal } from '@/components/QuickCreateModal';
import { Icon } from '@/components/Icon';

// ─── Icons ────────────────────────────────────────────────────────────────────
const icons = {
  search: 'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  bell:   'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0',
  plus:   'M12 5v14 M5 12h14',
};

const priorityColors: Record<number | string, string> = {
  CRITICAL: 'text-red-400 bg-red-500/10 border-red-500/20',
  HIGH:     'text-orange-400 bg-orange-500/10 border-orange-500/20',
  MEDIUM:   'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  LOW:      'text-slate-400 bg-slate-500/10 border-slate-500/20',
  1: 'text-red-400 bg-red-500/10',
  2: 'text-orange-400 bg-orange-500/10',
  3: 'text-yellow-400 bg-yellow-500/10',
  4: 'text-slate-400 bg-slate-500/10',
};

export default function Dashboard() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { notifications, unreadCount, registerSocketListener, markAllRead } = useNotifications();

  const { data: workItems, isLoading: isLoadingWorkItems } = useWorkItems();
  const { data: priorityTickets, isLoading: isLoadingTickets } = usePriorityTickets();
  const { data: aiInsights, isLoading: isLoadingAi } = useAiInsights();

  const [search, setSearch] = useState('');
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // ── Socket init with error handling ────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function initSocket() {
      try {
        const token = await getToken();
        if (!mounted) return;
        const socket = getSocket(token);
        socket.on(SOCKET_EVENTS.WORK_ITEM_UPDATED, () => {
          queryClient.invalidateQueries({ queryKey: WORK_ITEM_KEYS.all });
        });
        socket.on(SOCKET_EVENTS.TICKET_UPDATED, () => {
          queryClient.invalidateQueries({ queryKey: TICKET_KEYS.all });
        });
        // Feed notifications into the hook instead of console.log
        registerSocketListener(socket);
      } catch (err) {
        console.error('[NexFlow] Socket init failed:', err);
        // In production, surface this via a toast or error state
      }
    }

    initSocket();
    return () => {
      mounted = false;
      disconnectSocket();
    };
  }, [getToken, queryClient, registerSocketListener]);

  // ── Memoized derived data ───────────────────────────────────────────────────
  const kanbanCols = useMemo(() => [
    {
      title: 'To Do',
      color: 'text-slate-400',
      dot: 'bg-slate-500',
      cards: workItems?.filter(
        (w) =>
          (w.status === 'NEW' || w.status === 'APPROVED') &&
          (!search || w.title.toLowerCase().includes(search.toLowerCase())),
      ) || [],
    },
    {
      title: 'In Progress',
      color: 'text-blue-400',
      dot: 'bg-blue-500',
      cards: workItems?.filter(
        (w) =>
          w.status === 'COMMITTED' &&
          (!search || w.title.toLowerCase().includes(search.toLowerCase())),
      ) || [],
    },
    {
      title: 'Done',
      color: 'text-green-400',
      dot: 'bg-green-500',
      cards: workItems?.filter(
        (w) =>
          w.status === 'DONE' &&
          (!search || w.title.toLowerCase().includes(search.toLowerCase())),
      ) || [],
    },
  ], [workItems, search]);

  const stats = useMemo(() => [
    { label: 'Open Tickets',       value: priorityTickets?.length || 0,      trend: 'Live',   up: false },
    { label: 'Active Work Items',  value: kanbanCols[1].cards.length,         trend: 'Live',   up: true  },
    { label: 'Completed Work',     value: kanbanCols[2].cards.length,         trend: 'Live',   up: true  },
    { label: 'AI Insights',        value: aiInsights?.insights.length || 0,   trend: 'Active', up: true  },
  ], [priorityTickets, kanbanCols, aiInsights]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <AppSidebar />

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 shrink-0 border-b border-slate-800 flex items-center justify-between gap-3 px-4 sm:px-8 bg-slate-900/30 backdrop-blur-md">
          {/* Search — now functional */}
          <div className="relative w-48 sm:w-80">
            <Icon d={icons.search} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="dashboard-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter work items by title..."
              className="w-full bg-slate-800/50 border border-slate-700 rounded-full py-2 pl-9 pr-4 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20 text-[10px] font-bold text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live Sync
            </div>

            {/* Bell with notification badge */}
            <div className="relative">
              <button
                id="dashboard-notifications-btn"
                onClick={() => { setShowNotifications((v) => !v); markAllRead(); }}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
              >
                <Icon d={icons.bell} size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-10 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-40 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <p className="text-xs font-bold text-white">Notifications</p>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-500 hover:text-white text-sm">×</button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 p-4 text-center">No notifications yet</p>
                    ) : notifications.slice(0, 10).map((n) => (
                      <div key={n.id} className="px-4 py-3 border-b border-slate-800/50 last:border-0">
                        <p className="text-xs text-slate-300">{n.message}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">{n.timestamp.toLocaleTimeString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Create button — now wired up */}
            <button
              id="dashboard-quick-create-btn"
              onClick={() => setShowQuickCreate(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all shadow-lg shadow-blue-900/20"
            >
              <Icon d={icons.plus} size={16} />
              Quick Create
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 sm:p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black tracking-tight">System Health</h1>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {stats.map((s) => (
              <div key={s.label} className="glass-card rounded-2xl p-5 hover:border-slate-600 transition-all group">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">{s.label}</p>
                <div className="flex items-end justify-between">
                  <span className="text-4xl font-black">{s.value}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    s.up ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                  }`}>
                    {s.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Kanban mini-view */}
            <div className="col-span-12 xl:col-span-8 glass-card rounded-2xl p-6 flex flex-col min-h-[400px]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg">Active Sprint — Real-time Work Items</h2>
                {search && (
                  <span className="text-[11px] text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">
                    Filtering: "{search}"
                  </span>
                )}
              </div>
              {isLoadingWorkItems ? (
                <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 flex-1">
                  {kanbanCols.map((col) => (
                    <div key={col.title} className="flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                        <h3 className={`text-xs font-black uppercase tracking-widest ${col.color}`}>{col.title}</h3>
                        <span className="ml-auto text-xs text-slate-600 font-mono">{col.cards.length}</span>
                      </div>
                      <div className="space-y-3 flex-1">
                        {col.cards.map((card) => (
                          <div
                            key={card.id}
                            className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 hover:bg-slate-800/60 transition-all cursor-pointer group"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-mono text-purple-400">{card.id.substring(0, 8)}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${priorityColors[card.priority]}`}>
                                P{card.priority}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-200 leading-snug mb-2">{card.title}</p>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-700/50 text-slate-400">{card.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="col-span-12 xl:col-span-4 space-y-5">
              {/* Priority tickets */}
              <div className="glass-card rounded-2xl p-5 min-h-[250px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm">Priority Tickets</h3>
                </div>
                {isLoadingTickets ? <LoadingSpinner /> : (
                  <div className="space-y-3">
                    {priorityTickets?.length === 0 ? (
                      <p className="text-xs text-slate-500">No active priority tickets.</p>
                    ) : priorityTickets?.map((t) => (
                      <div
                        key={t.id}
                        className="p-3 bg-slate-800/40 border border-slate-700/40 rounded-xl hover:border-slate-600 transition-all cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-mono text-purple-400">{t.id.substring(0, 8)}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${priorityColors[t.priority]}`}>
                            {t.priority}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-200 leading-snug">{t.subject}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Copilot */}
              <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-5 shadow-[0_0_50px_-12px_rgba(79,70,229,0.4)] min-h-[200px]">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="text-2xl">✨</span>
                  <h3 className="font-black text-indigo-200 text-base">AI Copilot</h3>
                  <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">BETA</span>
                </div>
                {isLoadingAi ? <LoadingSpinner /> : (
                  <>
                    <p className="text-xs text-slate-300 leading-relaxed italic mb-4">
                      {aiInsights?.insights?.[0]?.message || 'All clear. No anomalies detected currently.'}
                    </p>
                    {aiInsights?.insights?.[0]?.actionLabel && (
                      <button className="mt-5 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 transition-all rounded-xl font-bold text-sm shadow-lg shadow-indigo-900/30">
                        {aiInsights.insights[0].actionLabel}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {showQuickCreate && <QuickCreateModal onClose={() => setShowQuickCreate(false)} />}
    </div>
  );
}
