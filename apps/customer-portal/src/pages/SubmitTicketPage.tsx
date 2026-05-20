import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/api';

interface KbSuggestion {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
}

export default function SubmitTicketPage() {
  const nav = useNavigate();
  const [deflected, setDeflected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<KbSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', email: '', priority: 'LOW' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced KB search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim() || searchQuery.length < 3) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const { data } = await apiClient.get<KbSuggestion[]>('/portal/kb/search', { params: { q: searchQuery } });
        setSuggestions(Array.isArray(data) ? data.slice(0, 3) : []);
      } catch { setSuggestions([]); } finally { setLoadingSuggestions(false); }
    }, 500);
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await apiClient.post('/portal/tickets', form);
      setSubmitted(data);
    } catch (err) {
      alert('Failed to submit ticket. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (submitted) {
    return (
      <main className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="rounded-2xl bg-green-50 border border-green-200 p-8">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-green-800 mb-2">Ticket Submitted!</h2>
          <p className="text-sm text-green-700 mb-4">Your ticket ID is:</p>
          <code className="block text-sm font-mono bg-white rounded-lg p-3 border border-green-200 text-green-900 mb-6">
            {submitted.id}
          </code>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => nav('/track')}
              className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Track My Ticket
            </button>
            <button
              onClick={() => { setSubmitted(null); setForm({ subject: '', description: '', email: '', priority: 'LOW' }); }}
              className="w-full rounded-xl border border-slate-300 px-6 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Submit Another
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Submit a Support Ticket</h1>
      <p className="text-sm text-slate-500 mb-8">Describe your issue below. We'll search for related articles first.</p>

      {/* KB deflection */}
      <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <label className="block text-sm font-medium text-blue-800 mb-2">
          🔍 What issue are you experiencing?
        </label>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="e.g. Can't login to my account..."
          className="w-full rounded-xl border border-blue-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        {loadingSuggestions && <p className="text-xs text-blue-600 mt-2">Searching articles...</p>}
        {suggestions.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium text-blue-700">We found some related articles:</p>
            {suggestions.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-blue-200 bg-white p-3 flex items-start justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{s.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{s.excerpt}</p>
                </div>
                <button
                  onClick={() => setDeflected(true)}
                  className="flex-shrink-0 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-800 hover:bg-green-200 transition-colors"
                >
                  This helped!
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deflection message */}
      {deflected ? (
        <div className="rounded-2xl bg-green-50 border border-green-200 p-6 text-center">
          <p className="text-2xl mb-2">🎉</p>
          <h3 className="text-base font-semibold text-green-800">Great, glad that helped!</h3>
          <p className="text-sm text-green-600 mt-1">No ticket needed. You're all set.</p>
          <button
            onClick={() => { setDeflected(false); setSuggestions([]); setSearchQuery(''); }}
            className="mt-4 text-xs text-green-700 underline"
          >
            Still need help? Submit a ticket
          </button>
        </div>
      ) : (
        // Ticket form
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject *</label>
            <input
              required
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="Brief summary of your issue"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Please describe your issue in detail..."
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address *</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="LOW">Low — not urgent</option>
              <option value="MEDIUM">Medium — needs attention</option>
              <option value="HIGH">High — impacting work</option>
              <option value="CRITICAL">Critical — blocking</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </form>
      )}
    </main>
  );
}
