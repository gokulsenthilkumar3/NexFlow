'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKbArticle, useKbArticleHistory, useUpdateKbArticle } from '@/hooks/useKb';

// ── Simple markdown renderer (no external deps) ────────────────────────────────

function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-white mt-5 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold text-white mt-6 mb-2 border-b border-slate-800 pb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-white mt-4 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-slate-300 italic">$1</em>')
    .replace(/`(.+?)`/g, '<code class="rounded bg-slate-800 px-1.5 py-0.5 text-sm font-mono text-violet-300">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-slate-300 list-disc">$1</li>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-violet-500 pl-4 text-slate-400 italic my-3">$1</blockquote>')
    .replace(/\n\n/g, '</p><p class="text-slate-300 leading-relaxed mb-3">')
    .replace(/\n/g, '<br/>');
}

export default function KbArticlePage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { slug } = params;
  const [showHistory, setShowHistory] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: article, isLoading } = useKbArticle(slug);
  const { data: history = [] } = useKbArticleHistory(slug);
  const updateArticle = useUpdateKbArticle(slug);

  const handleEdit = () => {
    setEditBody(article?.body ?? '');
    setEditing(true);
  };

  const handleSave = async () => {
    await updateArticle.mutateAsync({ body: editBody });
    setEditing(false);
  };

  const handleSuggestToCustomer = () => {
    const url = `${window.location.origin.replace('3000', '5173')}/kb/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {[1,2,3].map((i) => <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-800/50" />)}
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Article not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Back link */}
        <button
          onClick={() => router.push('/helpdesk/kb')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-6"
        >
          ← Back to Knowledge Base
        </button>

        <div className="flex gap-8">
          {/* Article body — left */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-6">
              {article.category && (
                <span className="mb-2 inline-flex items-center rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-400 border border-violet-500/20">
                  {article.category.name}
                </span>
              )}
              <h1 className="text-2xl font-bold text-white mt-2">{article.title}</h1>
              <p className="text-xs text-slate-500 mt-1">
                Version {article.version} · Published{' '}
                {article.published_at
                  ? new Date(article.published_at).toLocaleDateString('en-US', { dateStyle: 'medium' })
                  : 'Draft'}
              </p>
            </div>

            {/* Edit or rendered body */}
            {editing ? (
              <div className="space-y-3">
                <textarea
                  rows={20}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-4 font-mono text-sm text-slate-200 focus:border-violet-500 focus:outline-none"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={updateArticle.isPending}
                    className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors disabled:opacity-50"
                  >
                    {updateArticle.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="prose prose-invert max-w-none rounded-xl border border-slate-800 bg-slate-900/40 p-6"
                dangerouslySetInnerHTML={{
                  __html: `<p class="text-slate-300 leading-relaxed mb-3">${renderMarkdown(article.body)}</p>`,
                }}
              />
            )}

            {/* Version history */}
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
              <button
                onClick={() => setShowHistory((h) => !h)}
                className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
              >
                <span>📋 Version History ({history.length} versions)</span>
                <span className="text-slate-500">{showHistory ? '▲' : '▼'}</span>
              </button>
              {showHistory && (
                <div className="border-t border-slate-800 divide-y divide-slate-800">
                  {history.length === 0 ? (
                    <p className="px-5 py-3 text-xs text-slate-500">No history yet</p>
                  ) : (
                    history.map((v) => (
                      <div key={v.id} className="px-5 py-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-300">
                            Version {v.version_number}
                          </span>
                          <span className="text-xs text-slate-600">
                            {new Date(v.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          by {v.changed_by}
                        </p>
                        {(v as any).diff && (
                          <pre className="mt-2 rounded bg-slate-950 p-3 text-xs font-mono text-slate-400 overflow-x-auto max-h-48">
                            {(v as any).diff}
                          </pre>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar — right */}
          <aside className="w-56 flex-shrink-0 space-y-4">
            {/* Actions */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Actions</h3>
              <button
                onClick={handleEdit}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:text-white hover:border-violet-500 transition-colors"
              >
                ✏️ Edit Article
              </button>
              <button
                onClick={handleSuggestToCustomer}
                className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors
                  ${copied
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'bg-violet-600 text-white hover:bg-violet-500'
                  }`}
              >
                {copied ? '✓ URL Copied!' : '📤 Suggest to Customer'}
              </button>
            </div>

            {/* Metadata */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Metadata</h3>
              <div>
                <p className="text-xs text-slate-500">Status</p>
                <span className={`text-xs font-medium ${article.published_at ? 'text-green-400' : 'text-amber-400'}`}>
                  {article.published_at ? '● Published' : '○ Draft'}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500">Slug</p>
                <p className="text-xs text-slate-400 font-mono break-all">{article.slug}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Version</p>
                <p className="text-xs text-slate-300">v{article.version}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Last Updated</p>
                <p className="text-xs text-slate-300">
                  {article.updated_at
                    ? new Date(article.updated_at).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
