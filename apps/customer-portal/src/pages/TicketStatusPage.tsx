import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../lib/api';

const STEPS = ['Open', 'In Progress', 'Resolved', 'Closed'];

const STEP_INDEX: Record<string, number> = {
  Open: 0, 'In Progress': 1, Resolved: 2, Closed: 3,
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700',
  HIGH:     'bg-orange-100 text-orange-700',
  MEDIUM:   'bg-yellow-100 text-yellow-700',
  LOW:      'bg-slate-100 text-slate-600',
};

export default function TicketStatusPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    apiClient.get(`/portal/tickets/${id}/status`)
      .then(({ data }) => setTicket(data))
      .catch(() => setError('Could not load ticket. Please check the ID or sign in.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200" />)}
        </div>
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-12 text-center">
        <p className="text-red-600 text-sm">{error || 'Ticket not found'}</p>
        <button onClick={() => nav('/track')} className="mt-4 text-sm text-blue-600 underline">
          ← Back to My Tickets
        </button>
      </main>
    );
  }

  const currentStep = STEP_INDEX[ticket.status] ?? 0;
  const history: { status: string; timestamp: string; note?: string }[] =
    ticket.statusHistory ?? [{ status: 'Open', timestamp: ticket.created_at }];

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      {/* Back link */}
      <button onClick={() => nav('/track')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
        ← Back to My Tickets
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <h1 className="text-xl font-bold text-slate-900 leading-snug">{ticket.subject}</h1>
        <span className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${PRIORITY_COLORS[ticket.priority] ?? PRIORITY_COLORS.LOW}`}>
          {ticket.priority}
        </span>
      </div>

      {/* Progress stepper */}
      <div className="mb-8">
        <div className="flex items-center">
          {STEPS.map((step, idx) => {
            const isCurrent = idx === currentStep;
            const isPast    = idx < currentStep;
            return (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                {/* Circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                      ${isCurrent ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : isPast ? 'border-green-500 bg-green-500 text-white'
                        : 'border-slate-300 bg-white text-slate-400'
                      }`}
                  >
                    {isPast ? '✓' : idx + 1}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium whitespace-nowrap
                      ${isCurrent ? 'text-blue-600' : isPast ? 'text-green-600' : 'text-slate-400'}`}
                  >
                    {step}
                  </span>
                </div>
                {/* Connector */}
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 -mt-5 ${idx < currentStep ? 'bg-green-500' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status history */}
      {history.length > 0 && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-700">Status History</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-xs text-slate-500">
                <th className="px-5 py-2.5 text-left font-medium">Status</th>
                <th className="px-5 py-2.5 text-left font-medium">Timestamp</th>
                <th className="px-5 py-2.5 text-left font-medium">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((h, i) => (
                <tr key={i}>
                  <td className="px-5 py-3 font-medium text-slate-800">{h.status}</td>
                  <td className="px-5 py-3 text-slate-500">
                    {new Date(h.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{h.note ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Metadata card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Details</h2>
        <div className="space-y-2 text-sm">
          {[
            ['Email', ticket.contact_email ?? '—'],
            ['Priority', ticket.priority],
            ['Created', new Date(ticket.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })],
            ['Ticket ID', ticket.id],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <span className="text-slate-500">{label}</span>
              <span className="text-slate-800 font-medium text-right font-mono text-xs">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
