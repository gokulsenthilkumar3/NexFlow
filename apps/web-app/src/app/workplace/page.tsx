import Link from 'next/link';
import { AppSidebar } from '@/components/AppSidebar';
const modules = [
  ['Assets', 'Inventory, QR tags, custody, lifecycle and support links.', '/assets'],
  ['Maintenance', 'Schedule work, manage repairs and track asset health.', '/workplace/maintenance'],
  ['Facilities', 'Sites, meeting rooms, desks and workspace bookings.', '/workplace/facilities'],
  ['Visitors', 'Register visits and prepare workplace hosts.', '/workplace/visitors'],
  ['Procurement', 'Vendors, purchase requests and approval flow.', '/workplace/procurement'],
  ['Fleet', 'Vehicle availability, assignments and maintenance.', '/workplace/fleet'],
  ['Compliance', 'Audits, policies and ownership evidence.', '/workplace/compliance'],
  ['Operations analytics', 'Asset, facilities and workforce reporting.', '/workplace/analytics'],
];
export default function WorkplacePage() { return <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100"><AppSidebar /><main className="flex-1 overflow-y-auto scrollbar-hide p-6 sm:p-10"><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-400">Workplace operations</p><h1 className="mt-2 text-4xl font-black">Everything your office needs, connected.</h1><p className="mt-3 max-w-2xl text-slate-400">Nexora combines the HRMS office modules with assets, helpdesk context, and the team who uses them.</p><div className="mt-9 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{modules.map(([name, description, href], i) => <Link key={name} href={href} className="glass-card group rounded-2xl p-5 transition hover:-translate-y-1 hover:border-emerald-500/40"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-sm font-black text-emerald-300">{String(i + 1).padStart(2, '0')}</div><h2 className="mt-5 font-bold">{name}</h2><p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p><span className="mt-5 block text-xs font-bold text-emerald-300">Open module →</span></Link>)}</div></main></div>; }
