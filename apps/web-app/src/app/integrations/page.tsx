'use client';

import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/AppSidebar';

const integrations = [
  { name: 'GitHub', description: 'Repositories, pull requests, checks, and deployments.', icon: '◉', color: 'border-slate-700' },
  { name: 'GitLab', description: 'Projects, merge requests, pipelines, and environments.', icon: '◆', color: 'border-orange-500/30' },
];

export default function IntegrationsPage() {
  const router = useRouter();
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="mx-auto max-w-5xl">
          <button onClick={() => router.push('/dashboard')} className="mb-6 text-sm text-slate-400 hover:text-white">← Dashboard</button>
          <div className="mb-8">
            <h1 className="text-3xl font-black">Repo &amp; Pipelines</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">Connect your source-control provider to bring pull requests, checks, deployments, and incident context into NexFlow.</p>
          </div>
          <section aria-labelledby="providers-heading">
            <h2 id="providers-heading" className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">Source control providers</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {integrations.map((integration) => (
                <article key={integration.name} className={`rounded-2xl border ${integration.color} bg-slate-900/60 p-5`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-xl">{integration.icon}</span>
                      <div><h3 className="font-bold">{integration.name}</h3><p className="mt-1 text-xs text-slate-500">Not connected</p></div>
                    </div>
                    <button type="button" disabled title="Provider connection is not configured yet" className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-500">Coming soon</button>
                  </div>
                  <p className="mt-5 text-sm leading-relaxed text-slate-400">{integration.description}</p>
                </article>
              ))}
            </div>
          </section>
          <section className="mt-8 rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-2xl">⌘</div>
            <h2 className="font-bold">Pipeline activity will appear here</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">Once a provider is connected, this view will show recent builds, failures, deployments, and links to affected tickets.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
