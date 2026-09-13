'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AppSidebar } from '@/components/AppSidebar';
import { Icon } from '@/components/Icon';

const icons = {
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87',
  clock: 'M12 8v4l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  briefcase: 'M20 7h-3V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z M9 7V5h6v2',
  plus: 'M12 5v14 M5 12h14',
  search: 'M21 21l-4.35-4.35 M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
};

const employees = [
  { name: 'Maya Raman', role: 'Operations Manager', team: 'Operations', status: 'Online', initials: 'MR', tone: 'from-violet-500 to-purple-600' },
  { name: 'Arjun Nair', role: 'People Partner', team: 'People', status: 'In focus', initials: 'AN', tone: 'from-sky-500 to-cyan-600' },
  { name: 'Priya Shah', role: 'Support Lead', team: 'Service', status: 'Online', initials: 'PS', tone: 'from-emerald-500 to-teal-600' },
  { name: 'Kiran Das', role: 'Facilities Coordinator', team: 'Workplace', status: 'Away', initials: 'KD', tone: 'from-amber-500 to-orange-600' },
];

const tabs = ['Directory', 'Attendance', 'Leave', 'Recruitment', 'Payroll'];

export default function PeoplePage() {
  const [activeTab, setActiveTab] = useState('Directory');
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => employees.filter(({ name, role, team }) => `${name} ${role} ${team}`.toLowerCase().includes(query.toLowerCase())), [query]);

  return <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
    <AppSidebar />
    <main className="flex-1 overflow-y-auto scrollbar-hide">
      <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between border-b border-slate-800 bg-slate-950/85 px-5 py-3 backdrop-blur-md sm:px-8">
        <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-400">People operations</p><h1 className="mt-0.5 text-xl font-black sm:text-2xl">Your team, connected to the work.</h1></div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-sm font-bold hover:bg-violet-500"><Icon d={icons.plus} size={16} /> Add employee</button>
      </header>

      <div className="mx-auto max-w-7xl space-y-7 p-5 sm:p-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Total headcount', '142', 'Across 8 teams', icons.users, 'text-violet-300 bg-violet-500/10'],
            ['Present today', '128', '90.1% attendance', icons.clock, 'text-emerald-300 bg-emerald-500/10'],
            ['Open roles', '6', '3 in interview stage', icons.briefcase, 'text-amber-300 bg-amber-500/10'],
            ['Leave requests', '4', 'Awaiting review', icons.clock, 'text-sky-300 bg-sky-500/10'],
          ].map(([label, value, note, icon, tone]) => <article key={label} className="glass-card rounded-2xl p-5"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon d={icon} size={19} /></div><p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><div className="mt-1 flex items-end justify-between gap-3"><strong className="text-3xl font-black">{value}</strong><span className="pb-1 text-right text-[11px] text-slate-400">{note}</span></div></article>)}
        </section>

        <section className="glass-card overflow-hidden rounded-2xl">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-center">
            <div><h2 className="font-bold">People hub</h2><p className="mt-1 text-sm text-slate-400">HRMS workflows are now part of your Nexora workspace.</p></div>
            <div className="relative"><Icon d={icons.search} size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people" className="rounded-xl border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-slate-600 focus:border-violet-500" /></div>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-b border-slate-800 px-4 pt-3">{tabs.map(tab => <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-semibold transition ${activeTab === tab ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-200'}`}>{tab}</button>)}</nav>
          {activeTab === 'Directory' ? <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="px-6 py-4">Employee</th><th className="px-6 py-4">Team</th><th className="px-6 py-4">Availability</th><th className="px-6 py-4 text-right">Actions</th></tr></thead><tbody>{filtered.map(person => <tr key={person.name} className="border-b border-slate-800/70 last:border-0 hover:bg-slate-800/30"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-black ${person.tone}`}>{person.initials}</div><div><p className="font-bold text-slate-100">{person.name}</p><p className="text-xs text-slate-500">{person.role}</p></div></div></td><td className="px-6 py-4 text-slate-300">{person.team}</td><td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${person.status === 'Away' ? 'bg-amber-500/10 text-amber-300' : 'bg-emerald-500/10 text-emerald-300'}`}>{person.status}</span></td><td className="px-6 py-4 text-right"><button className="text-xs font-bold text-violet-300 hover:text-violet-200">View profile</button></td></tr>)}</tbody></table></div> : <div className="p-10 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300"><Icon d={activeTab === 'Recruitment' ? icons.briefcase : icons.clock} size={22} /></div><h3 className="mt-4 font-bold">{activeTab} is connected to Nexora</h3><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">Use this workspace to keep people operations alongside support, projects, assets, and workplace activity.</p><Link href="/dashboard" className="mt-5 inline-block text-sm font-bold text-violet-300 hover:text-violet-200">Return to operations overview</Link></div>}
        </section>
      </div>
    </main>
  </div>;
}
