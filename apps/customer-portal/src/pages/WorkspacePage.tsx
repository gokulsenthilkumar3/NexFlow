import { Link } from 'react-router-dom';

const modules = [
  ['People', 'HR, attendance, recruitment, payroll and team records.', 'bg-violet-100 text-violet-700'],
  ['Workplace', 'Facilities, visitor flows, maintenance and compliance.', 'bg-emerald-100 text-emerald-700'],
  ['Assets', 'Inventory, checkouts, lifecycle health and audit history.', 'bg-amber-100 text-amber-700'],
  ['Service desk', 'Tickets, SLAs, knowledge, incident updates and support.', 'bg-sky-100 text-sky-700'],
];

export default function WorkspacePage() {
  return <main className="max-w-6xl mx-auto px-6 py-10">
    <div className="rounded-3xl bg-slate-950 p-8 sm:p-12 text-white overflow-hidden relative">
      <div className="relative z-10 max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">Nexora workspace</p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight">Your whole office, in sync.</h1>
        <p className="mt-5 text-slate-300 text-lg leading-relaxed">A unified command centre for the teams who keep the workplace productive, resilient, and ready for what is next.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/submit" className="rounded-xl bg-blue-500 px-5 py-3 font-semibold hover:bg-blue-400">Create support request</Link>
          <Link to="/kb" className="rounded-xl border border-slate-600 px-5 py-3 font-semibold hover:bg-slate-800">Browse knowledge</Link>
        </div>
      </div>
      <div className="absolute -right-14 -bottom-24 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
    </div>

    <section className="mt-10">
      <div className="flex items-end justify-between gap-4 mb-5"><div><p className="text-sm font-semibold text-blue-600">CONNECTED MODULES</p><h2 className="text-2xl font-bold text-slate-900 mt-1">Everything your operations team touches</h2></div><span className="text-sm text-slate-500">One account. One source of truth.</span></div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {modules.map(([title, description, tone]) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:-translate-y-1 hover:shadow-md transition">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${tone}`}>{title[0]}</div>
          <h3 className="mt-5 font-bold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
        </article>)}
      </div>
    </section>

    <section className="grid gap-5 mt-10 md:grid-cols-3">
      {['12 open requests', '98.6% asset availability', '4 maintenance tasks today'].map((metric, index) => <div className="rounded-2xl bg-slate-100 p-6" key={metric}><p className="text-sm text-slate-500">{['Service pulse', 'Operations pulse', 'Today'][index]}</p><p className="mt-2 text-xl font-bold text-slate-900">{metric}</p></div>)}
    </section>
  </main>;
}
