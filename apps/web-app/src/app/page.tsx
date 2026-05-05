import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-purple-500/30 overflow-hidden">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl p-6 flex flex-col">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-10">
            NexFlow
          </div>
          <nav className="space-y-4 flex-1">
            {['Dashboard', 'Boards', 'Tickets', 'Knowledge Base', 'Analytics'].map((item) => (
              <div key={item} className="text-slate-400 hover:text-white cursor-pointer transition-colors px-2 py-1 rounded-md hover:bg-slate-800/50">
                {item}
              </div>
            ))}
          </nav>
          <div className="pt-6 border-t border-slate-800 text-xs text-slate-500">
            System: Healthy
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Unified Command Hub</h1>
            <div className="flex gap-4 items-center">
              <div className="relative">
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                </span>
                <button className="p-2 bg-slate-800 rounded-full">🔔</button>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-slate-800"></div>
            </div>
          </header>

          <div className="grid grid-cols-12 gap-8">
            {/* Left: Engineering Board */}
            <div className="col-span-8 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-semibold text-slate-200">Active Sprint (Q2-W18)</h2>
                <div className="flex gap-2">
                  <button className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-all">+ New Item</button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-6">
                {['To Do', 'In Progress', 'Done'].map((col) => (
                  <div key={col} className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">{col}</h3>
                    <div className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-xl min-h-[150px] animate-pulse">
                      <div className="h-4 bg-slate-700 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Support Insights */}
            <div className="col-span-4 space-y-8">
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-md">
                <h2 className="text-xl font-semibold mb-6 text-slate-200">Priority Tickets</h2>
                <div className="space-y-4">
                  {[
                    { id: 'T-102', subject: 'Auth Failure (EU)', status: 'Critical', time: '12m' },
                    { id: 'T-98', subject: 'Slow Query on /db', status: 'High', time: '45m' }
                  ].map((t) => (
                    <div key={t.id} className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl hover:border-slate-600 transition-all cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-purple-400">{t.id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">{t.status}</span>
                      </div>
                      <div className="text-sm font-medium mb-1">{t.subject}</div>
                      <div className="text-[10px] text-slate-500">Wait time: {t.time}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Copilot Highlight */}
              <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-3xl p-8 shadow-[0_0_50px_-12px_rgba(79,70,229,0.3)]">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">✨</span>
                  <h2 className="text-lg font-bold text-indigo-200">AI Copilot</h2>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed italic">
                  "I've detected a high correlation between Ticket **T-102** and the failing **Pipeline #772**. Resolution plan ready."
                </p>
                <button className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-500 transition-all rounded-xl font-semibold shadow-lg shadow-indigo-600/20">
                  Review & Rollback
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
