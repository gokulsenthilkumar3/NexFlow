import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/api';
import { getPortalToken, setPortalToken, setPortalEmail, getPortalEmail, clearPortalToken } from '../lib/auth';

type FlowState = 'enter-email' | 'enter-otp' | 'authenticated';

const STATUS_COLORS: Record<string, string> = {
  Open:       'bg-blue-100 text-blue-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  Resolved:   'bg-green-100 text-green-700',
  Closed:     'bg-slate-200 text-slate-600',
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700',
  HIGH:     'bg-orange-100 text-orange-700',
  MEDIUM:   'bg-yellow-100 text-yellow-700',
  LOW:      'bg-slate-100 text-slate-600',
};

export default function TrackTicketPage() {
  const nav = useNavigate();
  const [flow, setFlow] = useState<FlowState>(getPortalToken() ? 'authenticated' : 'enter-email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Load tickets when authenticated
  useEffect(() => {
    if (flow === 'authenticated') {
      setLoadingTickets(true);
      apiClient.get('/portal/tickets')
        .then(({ data }) => setTickets(Array.isArray(data) ? data : []))
        .catch(() => setTickets([]))
        .finally(() => setLoadingTickets(false));
    }
  }, [flow]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await apiClient.post('/portal/auth/send-otp', { email });
      setPortalEmail(email);
      setFlow('enter-otp');
    } catch { setError('Failed to send code. Please check your email address.'); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await apiClient.post('/portal/auth/verify-otp', { email: getPortalEmail() || email, otp });
      setPortalToken(data.token);
      setPortalEmail(data.email ?? getPortalEmail() ?? email);
      setFlow('authenticated');
    } catch { setError('Invalid or expired code. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleSignOut = () => {
    clearPortalToken();
    setFlow('enter-email');
    setTickets([]);
    setEmail('');
    setOtp('');
  };

  // ── Enter email state ─────────────────────────────────────────────────────

  if (flow === 'enter-email') {
    return (
      <main className="max-w-md mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Track My Tickets</h1>
          <p className="text-sm text-slate-500 mt-2">Enter your email to receive a one-time code</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input
                required type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Code →'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // ── Enter OTP state ───────────────────────────────────────────────────────

  if (flow === 'enter-otp') {
    return (
      <main className="max-w-md mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Enter Your Code</h1>
          <p className="text-sm text-slate-500 mt-2">Code sent to <span className="font-medium text-slate-700">{getPortalEmail() || email}</span></p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">6-Digit Code</label>
              <input
                required type="number" value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6} placeholder="123456"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-center text-2xl font-mono tracking-widest text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit" disabled={loading || otp.length < 6}
              className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            <button type="button" onClick={() => setFlow('enter-email')} className="w-full text-xs text-slate-500 hover:text-slate-700">
              ← Change email
            </button>
          </form>
        </div>
      </main>
    );
  }

  // ── Authenticated state ───────────────────────────────────────────────────

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Tickets</h1>
          <p className="text-sm text-slate-500 mt-0.5">{getPortalEmail()}</p>
        </div>
        <button onClick={handleSignOut} className="text-xs text-slate-500 hover:text-red-600 transition-colors">
          Sign Out
        </button>
      </div>

      {loadingTickets ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-200" />)}
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500 text-sm">No tickets found for this email address.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => nav(`/tickets/${ticket.id}`)}
              className="w-full text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{ticket.subject}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Created {new Date(ticket.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[ticket.priority] ?? PRIORITY_COLORS.LOW}`}>
                    {ticket.priority}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[ticket.status] ?? STATUS_COLORS.Open}`}>
                    {ticket.status}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
