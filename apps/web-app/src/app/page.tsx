'use client';
import React, { useState } from 'react';

// ─── Icons (inline SVG to avoid extra deps) ───────────────────────────────────
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
  zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  analytics: 'M18 20V10 M12 20V4 M6 20v-6',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
};

// ─── Types ────────────────────────────────────────────────────────────────────
type View = 'landing' | 'connect' | 'dashboard';

// ─── Landing Page ─────────────────────────────────────────────────────────────
function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  const features = [
    { icon: icons.kanban, title: 'Beautiful Kanban Boards', desc: 'Visual sprint management with drag-and-drop workflows.' },
    { icon: icons.analytics, title: 'Rich Analytics Dashboards', desc: 'Turn raw work items into actionable team insights.' },
    { icon: icons.zap, title: 'Lightning-fast Performance', desc: 'Real-time updates powered by a high-speed backend.' },
    { icon: icons.shield, title: 'Secure Read-only Access', desc: 'PAT-based auth — your credentials never leave your browser.' },
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center max-w-4xl px-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-900/40">
            N
          </div>
          <span className="text-4xl font-black tracking-tight">
            Nex<span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Flow</span>
          </span>
        </div>

        {/* Hero headline */}
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6 text-white">
          Visualize Your Team&apos;s
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x">
            Workflow Like Never Before
          </span>
        </h1>
        <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
          Transform your work items into beautiful, actionable insights.
          The unified command hub that makes your team actually want to check their metrics.
        </p>

        {/* CTA Buttons */}
        <div className="flex items-center justify-center gap-4 mb-16">
          <button
            onClick={onGetStarted}
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-900/40 hover:shadow-blue-900/60 hover:scale-105 active:scale-95"
          >
            Get Started →
          </button>
          <button
            onClick={onGetStarted}
            className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-2xl border border-slate-700 hover:border-slate-600 transition-all"
          >
            Try Demo Mode
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 text-left hover:border-blue-500/40 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center mb-3 group-hover:bg-blue-600/30 transition-colors">
                <Icon d={f.icon} size={18} className="text-blue-400" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="absolute bottom-6 text-xs text-slate-600">© 2025 NexFlow. Built with passion for DevOps teams.</p>
    </div>
  );
}

// ─── Connect / Login Card ─────────────────────────────────────────────────────
function ConnectPage({ onConnect, onDemo }: { onConnect: () => void; onDemo: () => void }) {
  const [org, setOrg] = useState('');
  const [pat, setPat] = useState('');
  const [showPat, setShowPat] = useState(false);

  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden">
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-black text-white">
            N
          </div>
          <span className="text-2xl font-black">
            Nex<span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Flow</span>
          </span>
        </div>

        {/* Card */}
        <div className="glass-card rounded-3xl p-8 glow-blue">
          <h2 className="text-xl font-bold text-white mb-1 text-center">Welcome back</h2>
          <p className="text-slate-400 text-sm text-center mb-8">Connect your workspace to get started</p>

          {/* Organization */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Organization</label>
            <input
              type="text"
              value={org}
              onChange={e => setOrg(e.target.value)}
              placeholder="your-organization"
              className="w-full bg-slate-800/60 border border-slate-700 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-slate-600 mt-1.5 ml-1">Found in: dev.azure.com/<span className="text-slate-500">your-organization</span></p>
          </div>

          {/* PAT */}
          <div className="mb-8">
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Personal Access Token (PAT)</label>
            <div className="relative">
              <input
                type={showPat ? 'text' : 'password'}
                value={pat}
                onChange={e => setPat(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl py-3 px-4 pr-11 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPat(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <Icon d={icons.eye} size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-1.5 ml-1">Create a PAT with <span className="text-blue-400">Work Items (Read)</span> scope</p>
          </div>

          {/* Connect Button */}
          <button
            onClick={onConnect}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 mb-4"
          >
            Connect to NexFlow
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-600">OR</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <button
            onClick={onDemo}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-2xl border border-slate-700 hover:border-slate-600 transition-all text-sm"
          >
            Try Demo Mode
          </button>

          <p className="text-center text-xs text-slate-600 mt-6">
            🔒 Your credentials are stored locally and never sent to our servers.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
const navItems = [
  { icon: icons.dashboard, label: 'Overview', active: true },
  { icon: icons.kanban, label: 'Project Boards' },
  { icon: icons.ticket, label: 'Helpdesk Tickets' },
  { icon: icons.git, label: 'Repo & Pipelines' },
  { icon: icons.book, label: 'Knowledge Base' },
  { icon: icons.analytics, label: 'Analytics' },
];

const stats = [
  { label: 'Open Tickets', value: '24', trend: '+12%', up: true },
  { label: 'SLA At Risk', value: '3', trend: '-2 today', up: false },
  { label: 'Active Sprints', value: '5', trend: 'Healthy', up: true },
  { label: 'Avg. Resolution', value: '4.2h', trend: '-15%', up: true },
];

const kanbanCols = [
  {
    title: 'To Do',
    color: 'text-slate-400',
    dot: 'bg-slate-500',
    cards: [
      { id: 'NF-45', title: 'Implement OAuth2 flow', tag: 'Backend', priority: 'Medium' },
      { id: 'NF-46', title: 'Design onboarding modal', tag: 'Frontend', priority: 'Low' },
    ],
  },
  {
    title: 'In Progress',
    color: 'text-blue-400',
    dot: 'bg-blue-500',
    cards: [
      { id: 'NF-39', title: 'Refactor helpdesk API', tag: 'Backend', priority: 'High' },
      { id: 'NF-41', title: 'Kanban drag-and-drop', tag: 'Frontend', priority: 'High' },
    ],
  },
  {
    title: 'Done',
    color: 'text-green-400',
    dot: 'bg-green-500',
    cards: [
      { id: 'NF-35', title: 'Setup CI/CD pipeline', tag: 'DevOps', priority: 'Critical' },
      { id: 'NF-37', title: 'Database migration v2', tag: 'Backend', priority: 'High' },
    ],
  },
];

const tickets = [
  { id: 'T-102', subject: 'Auth Failure (EU Region)', status: 'Critical', wait: '12m', statusColor: 'text-red-400 bg-red-500/10 border-red-500/20' },
  { id: 'T-98', subject: 'Slow Query on /db endpoint', status: 'High', wait: '45m', statusColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { id: 'T-95', subject: 'Export CSV not working', status: 'Medium', wait: '2h', statusColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
];

const pipelines = [
  { name: 'Production', status: 'Deployed', ok: true },
  { name: 'Staging', status: 'Deployed', ok: true },
  { name: 'Auth-Service', status: 'Building', ok: false },
  { name: 'Analytics-v2', status: 'Deployed', ok: true },
];

const priorityColors: Record<string, string> = {
  Critical: 'text-red-400 bg-red-500/10',
  High: 'text-orange-400 bg-orange-500/10',
  Medium: 'text-yellow-400 bg-yellow-500/10',
  Low: 'text-slate-400 bg-slate-500/10',
};

function Dashboard() {
  const [activeNav, setActiveNav] = useState(0);

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
              onClick={() => setActiveNav(i)}
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
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all text-left">
            <Icon d={icons.settings} size={18} />
            <span className="text-sm font-medium">Settings</span>
          </button>
          {/* User Avatar */}
          <div className="flex items-center gap-3 px-4 py-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-slate-700 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-white">Gokul S</p>
              <p className="text-[10px] text-slate-500">Admin</p>
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
            <span className="text-xs text-slate-500">Last updated: Just now</span>
            <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
              <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full animate-ping" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full" />
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

          {/* Page Title */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black tracking-tight">System Health</h1>
            <div className="flex items-center gap-2 text-xs text-green-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              All systems operational
            </div>
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
            <div className="col-span-8 glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg">Active Sprint — Q2-W18</h2>
                <button className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-all flex items-center gap-1">
                  <Icon d={icons.plus} size={14} /> New Item
                </button>
              </div>
              <div className="grid grid-cols-3 gap-5">
                {kanbanCols.map((col) => (
                  <div key={col.title}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                      <h3 className={`text-xs font-black uppercase tracking-widest ${col.color}`}>{col.title}</h3>
                      <span className="ml-auto text-xs text-slate-600 font-mono">{col.cards.length}</span>
                    </div>
                    <div className="space-y-3">
                      {col.cards.map((card) => (
                        <div key={card.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 hover:bg-slate-800/60 transition-all cursor-grab group">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono text-purple-400">{card.id}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${priorityColors[card.priority]}`}>{card.priority}</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-200 leading-snug mb-2">{card.title}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-700/50 text-slate-400">{card.tag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column */}
            <div className="col-span-4 space-y-5">

              {/* Priority Tickets */}
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm">Priority Tickets</h3>
                  <span className="text-[10px] text-blue-400 font-semibold cursor-pointer hover:text-blue-300">View All →</span>
                </div>
                <div className="space-y-3">
                  {tickets.map((t) => (
                    <div key={t.id} className="p-3 bg-slate-800/40 border border-slate-700/40 rounded-xl hover:border-slate-600 transition-all cursor-pointer">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-mono text-purple-400">{t.id}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${t.statusColor}`}>{t.status}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-200 leading-snug">{t.subject}</p>
                      <p className="text-[10px] text-slate-600 mt-1">Wait: {t.wait}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pipeline Health */}
              <div className="glass-card rounded-2xl p-5">
                <h3 className="font-bold text-sm mb-4">Pipeline Health</h3>
                <div className="space-y-2">
                  {pipelines.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-slate-800/30 rounded-xl">
                      <span className="text-xs font-medium text-slate-300">{p.name}</span>
                      <span className={`flex items-center gap-1.5 text-[10px] font-bold ${
                        p.ok ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.ok ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-pulse'}`} />
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Row: Chart area + AI Copilot */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8 glass-card rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-bold">Recent Ticket Inflow</h3>
                <span className="text-xs text-blue-400 font-semibold cursor-pointer hover:text-blue-300">View All →</span>
              </div>
              <div className="h-44 flex items-center justify-center">
                {/* Inline mini bar chart */}
                <div className="flex items-end gap-2 h-28 px-8">
                  {[4, 7, 5, 9, 6, 12, 8, 10, 7, 14, 11, 9, 6, 13].map((v, i) => (
                    <div
                      key={i}
                      className="w-5 rounded-t-md bg-gradient-to-t from-blue-700 to-blue-400 opacity-80 hover:opacity-100 transition-all cursor-pointer"
                      style={{ height: `${(v / 14) * 100}%` }}
                      title={`${v} tickets`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* AI Copilot */}
            <div className="col-span-4 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-5 shadow-[0_0_50px_-12px_rgba(79,70,229,0.4)]">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="text-2xl">✨</span>
                <h3 className="font-black text-indigo-200 text-base">AI Copilot</h3>
                <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">BETA</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed italic mb-4">
                &quot;High correlation detected between Ticket <strong className="text-indigo-300">T-102</strong> and the failing <strong className="text-indigo-300">Pipeline #772</strong>. Resolution plan ready.&quot;
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Icon d={icons.check} size={13} className="text-green-400 shrink-0" />
                  Root cause identified
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Icon d={icons.check} size={13} className="text-green-400 shrink-0" />
                  Rollback plan generated
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Icon d={icons.check} size={13} className="text-yellow-400 shrink-0" />
                  Awaiting approval
                </div>
              </div>
              <button className="mt-5 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 transition-all rounded-xl font-bold text-sm shadow-lg shadow-indigo-900/30">
                Review &amp; Rollback
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// ─── App Shell (Router) ───────────────────────────────────────────────────────
export default function Home() {
  const [view, setView] = useState<View>('landing');

  if (view === 'landing') return <LandingPage onGetStarted={() => setView('connect')} />;
  if (view === 'connect') return <ConnectPage onConnect={() => setView('dashboard')} onDemo={() => setView('dashboard')} />;
  return <Dashboard />;
}
