export default function SlaLoading() {
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
        <div className="flex-1 p-8 space-y-6">
          <div className="grid grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />)}
          </div>
          <div className="grid grid-cols-2 gap-6">
            {[1, 2].map((i) => <div key={i} className="h-56 bg-slate-900/50 border border-slate-800 rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </div>
    </div>
  );
}
