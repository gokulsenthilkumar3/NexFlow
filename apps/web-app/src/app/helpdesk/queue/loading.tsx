export default function QueueLoading() {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <aside className="w-56 shrink-0 border-r border-slate-800 p-4 bg-slate-900/50">
        <div className="h-6 w-28 bg-slate-800 rounded-lg animate-pulse mb-6" />
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-9 bg-slate-800/60 rounded-lg animate-pulse" />)}
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b border-slate-800 bg-slate-900/30 animate-pulse" />
        <div className="border-b border-slate-800 px-8 py-4 grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-slate-800/40 rounded-xl animate-pulse" />)}
        </div>
        <div className="flex-1 p-6 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-900/50 border border-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
