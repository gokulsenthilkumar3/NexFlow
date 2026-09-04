export default function ReportsLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="h-10 w-56 bg-slate-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-slate-900/50 border border-slate-800 rounded-xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-72 bg-slate-900/50 border border-slate-800 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    </div>
  );
}
