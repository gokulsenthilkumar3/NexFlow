import { useNavigate } from 'react-router-dom';

// ── Inline SVG icons ──────────────────────────────────────────────────────────

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
  </svg>
);

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const BookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

// ── Feature card ──────────────────────────────────────────────────────────────

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow duration-200">
      <div className="mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}

// ── Landing Page ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  const nav = useNavigate();
  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-slate-900 mb-4 tracking-tight">
          Get Help, <span className="text-blue-600">Fast.</span>
        </h1>
        <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto leading-relaxed">
          Submit support tickets, track their progress in real-time, and browse our knowledge base — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => nav('/submit')}
            className="rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
          >
            Submit a Ticket
          </button>
          <button
            onClick={() => nav('/track')}
            className="rounded-xl border-2 border-slate-300 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-colors"
          >
            Track My Ticket
          </button>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <FeatureCard
          icon={<ClockIcon />}
          title="Fast Response"
          desc="Our team responds within minutes for critical issues, not days."
        />
        <FeatureCard
          icon={<BellIcon />}
          title="Real-time Updates"
          desc="Get notified the moment your ticket status changes."
        />
        <FeatureCard
          icon={<BookIcon />}
          title="Knowledge Base"
          desc="Browse hundreds of articles to solve common issues instantly."
        />
      </div>
    </main>
  );
}
