'use client';
import React, { useEffect, useState } from 'react';
import { UserButton, useUser, useAuth } from '@clerk/nextjs';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getSocket, disconnectSocket, SOCKET_EVENTS } from '@/lib/socket';
import { useWorkItems, WORK_ITEM_KEYS } from '@/hooks/useWorkItems';
import { usePriorityTickets, TICKET_KEYS } from '@/hooks/useTickets';
import { useAiInsights } from '@/hooks/useAiInsights';

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 20, className = '' }: { d: string; size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

const icons = {
  dashboard: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  kanban: 'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18',
  ticket: 'M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6 M14 2v6h6',
  git: 'M6 3v12 M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 9a9 9 0 0 1-9 9',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  search: 'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0',
  plus: 'M12 5v14 M5 12h14',
  check: 'M20 6L9 17l-5-5',
  analytics: 'M18 20V10 M12 20V4 M6 20v-6',
  loader: 'M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83',
};

const navItems = [
  { icon: icons.dashboard, label: 'Overview',         href: '/dashboard',       active: true },
  { icon: icons.kanban,    label: 'Project Boards',   href: '/projects/DEFAULT/board' },
  { icon: icons.ticket,    label: 'Helpdesk Tickets', href: '/helpdesk/queue' },
  { icon: icons.git,       label: 'Repo & Pipelines', href: '#' },
  { icon: icons.book,      label: 'Knowledge Base',   href: '#' },
  { icon: icons.analytics, label: 'Analytics',        href: '/helpdesk/sla' },
];

const priorityColors: Record<number | string, string> = {
  CRITICAL: 'text-red-400 bg-red-500/10 border-red-500/20',
  HIGH: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  MEDIUM: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  LOW: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  1: 'text-red-400 bg-red-500/10',
  2: 'text-orange-400 bg-orange-500/10',
  3: 'text-yellow-400 bg-yellow-500/10',
  4: 'text-slate-400 bg-slate-500/10',
};

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState(0);
  const router = useRouter();
  
  // ── Auth & Data Hooks ──
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: workItems, isLoading: isLoadingWorkItems } = useWorkItems();
  const { data: priorityTickets, isLoading: isLoadingTickets } = usePriorityTickets();
  const { data: aiInsights, isLoading: isLoadingAi } = useAiInsights();

  // ── Socket.io Setup ──
  useEffect(() => {
    let mounted = true;

    async function initSocket() {
      const token = await getToken();
      if (!mounted) return;
      
      const socket = getSocket(token);

      // Listen for WebSocket events and invalidate queries to refetch instantly
      socket.on(SOCKET_EVENTS.WORK_ITEM_UPDATED, () => {
        queryClient.invalidateQueries({ queryKey: WORK_ITEM_KEYS.all });
      });

      socket.on(SOCKET_EVENTS.TICKET_UPDATED, () => {
        queryClient.invalidateQueries({ queryKey: TICKET_KEYS.all });
      });
      
      socket.on(SOCKET_EVENTS.NOTIFICATION, (data) => {
        console.log("New Notification Received:", data);
        // You could trigger a toast notification here
      });
    }

    initSocket();

    return () => {
      mounted = false;
      disconnectSocket();
    };
  }, [getToken, queryClient]);

  // ── Derived Data ──
  // Group work items into columns for Kanban
  const kanbanCols = [
    { title: 'To Do', color: 'text-slate-400', dot: 'bg-slate-500', cards: workItems?.filter(w => w.status === 'NEW' || w.status === 'APPROVED') || [] },
    { title: 'In Progress', color: 'text-blue-400', dot: 'bg-blue-500', cards: workItems?.filter(w => w.status === 'COMMITTED') || [] },
    { title: 'Done', color: 'text-green-400', dot: 'bg-green-500', cards: workItems?.filter(w => w.status === 'DONE') || [] },
  ];

  const stats = [
    { label: 'Open Tickets', value: priorityTickets?.length || 0, trend: 'Live', up: false },
    { label: 'Active Work Items', value: kanbanCols[1].cards.length, trend: 'Live', up: true },
    { label: 'Completed Work', value: kanbanCols[2].cards.length, trend: 'Live', up: true },
    { label: 'AI Insights', value: aiInsights?.insights.length || 0, trend: 'Active', up: true },
  ];

  const LoadingSpinner = () => (
    <div className="flex justify-center py-6">
      <Icon d={icons.loader} className="animate-spin text-slate-500" size={24} />
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-64 shrink-0 border-r border-slate-800 flex flex-col p-4 bg-slate-900/50 backdrop-blur-xl">
        <div className="flex items-center gap-2.5 px-3 mb-10">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-lg shadow-blue-900/30">
            N
          </div>
          <span className="text-xl font-black">
            Nex<span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Flow</span>
          </span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                setActiveNav(i);
                if (item.href && item.href !== '#') router.push(item.href);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all text-left ${
                activeNav === i
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon d={item.icon} size={18} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}

        </nav>

        <div className="mt-auto pt-4 border-t border-slate-800 space-y-1">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/40">
            <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: 'w-8 h-8' } }} />
            <div className="flex flex-col overflow-hidden">
              {isUserLoaded ? (
                <>
                  <p className="text-xs font-semibold text-white truncate">{user?.firstName || user?.emailAddresses[0]?.emailAddress}</p>
                  <p className="text-[10px] text-slate-500">Authenticated</p>
                </>
              ) : (
                <div className="w-20 h-3 bg-slate-700 animate-pulse rounded" />
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="h-16 shrink-0 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/30 backdrop-blur-md">
          <div className="relative w-80">
            <Icon d={icons.search} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search projects, tickets..."
              className="w-full bg-slate-800/50 border border-slate-700 rounded-full py-2 pl-9 pr-4 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20 text-[10px] font-bold text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live Sync
            </div>
            <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
              <Icon d={icons.bell} size={18} />
            </button>
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all shadow-lg shadow-blue-900/20">
              <Icon d={icons.plus} size={16} />
              Quick Create
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-8 space-y-8">
          
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black tracking-tight">System Health</h1>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-5">
            {stats.map((s, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 hover:border-slate-600 transition-all group">
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

          {/* Middle Row: Kanban + Side panels */}
          <div className="grid grid-cols-12 gap-6">

            {/* Kanban */}
            <div className="col-span-8 glass-card rounded-2xl p-6 flex flex-col min-h-[400px]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg">Active Sprint — Real-time Work Items</h2>
              </div>
              
              {isLoadingWorkItems ? (
                <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
              ) : (
                <div className="grid grid-cols-3 gap-5 flex-1">
                  {kanbanCols.map((col) => (
                    <div key={col.title} className="flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                        <h3 className={`text-xs font-black uppercase tracking-widest ${col.color}`}>{col.title}</h3>
                        <span className="ml-auto text-xs text-slate-600 font-mono">{col.cards.length}</span>
                      </div>
                      <div className="space-y-3 flex-1">
                        {col.cards.map((card) => (
                          <div key={card.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 hover:bg-slate-800/60 transition-all cursor-pointer group">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-mono text-purple-400">{card.id.substring(0,8)}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${priorityColors[card.priority]}`}>P{card.priority}</span>
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

            {/* Right Column */}
            <div className="col-span-4 space-y-5">
              {/* Priority Tickets */}
              <div className="glass-card rounded-2xl p-5 min-h-[250px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm">Priority Tickets</h3>
                </div>
                {isLoadingTickets ? <LoadingSpinner /> : (
                  <div className="space-y-3">
                    {priorityTickets?.length === 0 ? (
                      <p className="text-xs text-slate-500">No active priority tickets.</p>
                    ) : priorityTickets?.map((t) => (
                      <div key={t.id} className="p-3 bg-slate-800/40 border border-slate-700/40 rounded-xl hover:border-slate-600 transition-all cursor-pointer">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-mono text-purple-400">{t.id.substring(0,8)}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${priorityColors[t.priority]}`}>{t.priority}</span>
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
                      {aiInsights?.insights?.[0]?.message || "All clear. No anomalies detected currently."}
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
    </div>
  );
}
