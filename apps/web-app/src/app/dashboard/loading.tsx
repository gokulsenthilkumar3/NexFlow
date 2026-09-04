// Dashboard route loading skeleton — shown by Next.js App Router
// while the dashboard page suspends during data fetching.
export default function DashboardLoading() {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar skeleton */}
      <aside className="w-64 shrink-0 border-r border-slate-800 flex flex-col p-4 bg-slate-900/50">
        <div className="w-32 h-8 bg-slate-800 rounded-xl animate-pulse mb-10 mx-3" />
        <div className="space-y-2 flex-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-14 bg-slate-800/40 rounded-xl animate-pulse mt-4" />
      </aside>
      {/* Main skeleton */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="h-16 border-b border-slate-800 bg-slate-900/30 animate-pulse" />
        <div className="flex-1 p-8 space-y-6">
          <div className="h-8 w-48 bg-slate-800 rounded-xl animate-pulse" />
          <div className="grid grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-slate-800/60 rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8 h-96 bg-slate-800/40 rounded-2xl animate-pulse" />
            <div className="col-span-4 space-y-5">
              <div className="h-60 bg-slate-800/40 rounded-2xl animate-pulse" />
              <div className="h-48 bg-slate-800/40 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
