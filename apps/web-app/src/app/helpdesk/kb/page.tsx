'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useKbCategories, useKbArticles, useCreateKbArticle, type KbCategory } from '@/hooks/useKb';

// ── Category tree node ────────────────────────────────────────────────────────

function CategoryNode({
  cat,
  selected,
  onSelect,
  depth = 0,
}: {
  cat: KbCategory;
  selected: string | null;
  onSelect: (slug: string | null) => void;
  depth?: number;
}) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = cat.children && cat.children.length > 0;
  const isSelected = selected === cat.slug;

  return (
    <div>
      <button
        onClick={() => {
          onSelect(isSelected ? null : cat.slug);
          if (hasChildren) setOpen((o) => !o);
        }}
        className={`flex w-full items-center gap-1 rounded-lg px-3 py-2 text-sm transition-colors text-left
          ${isSelected
            ? 'bg-violet-500/20 text-violet-300 font-medium'
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        style={{ paddingLeft: `${12 + depth * 12}px` }}
      >
        {hasChildren && (
          <span className="text-xs opacity-60">{open ? '▾' : '▸'}</span>
        )}
        {cat.name}
      </button>
      {open && hasChildren && (
        <div>
          {cat.children!.map((child) => (
            <CategoryNode
              key={child.id}
              cat={child}
              selected={selected}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Create Article Modal ──────────────────────────────────────────────────────

function CreateArticleModal({
  categories,
  onClose,
}: {
  categories: KbCategory[];
  onClose: () => void;
}) {
  const createArticle = useCreateKbArticle();
  const [form, setForm] = useState({
    title: '', slug: '', body: '', category_id: '', published: false,
  });

  const flattenCategories = (cats: KbCategory[], depth = 0): { id: string; name: string; depth: number }[] => {
    return cats.flatMap((c) => [
      { id: c.id, name: c.name, depth },
      ...(c.children ? flattenCategories(c.children, depth + 1) : []),
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createArticle.mutateAsync({
      title: form.title,
      slug: form.slug || form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      body: form.body,
      category_id: form.category_id || undefined,
      published: form.published,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">New KB Article</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
              placeholder="e.g. How to reset your password"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Slug (auto-generated if empty)</label>
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
              placeholder="how-to-reset-your-password"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Category</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
            >
              <option value="">— No category —</option>
              {flattenCategories(categories).map((c) => (
                <option key={c.id} value={c.id}>
                  {'  '.repeat(c.depth)}{c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Body (MDX) *</label>
            <textarea
              required
              rows={8}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none font-mono"
              placeholder="# Article Title&#10;&#10;Start writing your article..."
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={form.published}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              className="accent-violet-500"
            />
            <label htmlFor="published" className="text-sm text-slate-300">Publish immediately</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createArticle.isPending}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors disabled:opacity-50"
            >
              {createArticle.isPending ? 'Creating...' : 'Create Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main KB Page ──────────────────────────────────────────────────────────────

export default function KbPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: categories = [], isLoading: catsLoading } = useKbCategories();
  const { data: articles = [], isLoading: artsLoading } = useKbArticles(search);

  const filteredArticles = selectedCategory
    ? articles.filter((a) => a.category?.slug === selectedCategory)
    : articles;

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Draft';

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-slate-800 bg-slate-900/60 flex flex-col">
        <div className="border-b border-slate-800 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Categories</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors mb-1
              ${!selectedCategory ? 'bg-violet-500/20 text-violet-300 font-medium' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            📚 All Articles
          </button>
          {catsLoading ? (
            <div className="space-y-2 p-2">
              {[1,2,3].map((i) => <div key={i} className="h-6 animate-pulse rounded bg-slate-800" />)}
            </div>
          ) : (
            categories.map((cat) => (
              <CategoryNode
                key={cat.id}
                cat={cat}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
              />
            ))
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-white">Knowledge Base</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
              {selectedCategory ? ` in "${selectedCategory}"` : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles..."
                className="w-64 rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
              />
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors shadow-lg shadow-violet-500/20"
            >
              + New Article
            </button>
          </div>
        </header>

        {/* Articles grid */}
        <main className="flex-1 overflow-y-auto p-6">
          {artsLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-800/50" />
              ))}
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <span className="text-4xl mb-3">📄</span>
              <p className="text-sm">{search ? 'No articles match your search' : 'No articles yet'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredArticles.map((article) => (
                <button
                  key={article.id}
                  onClick={() => router.push(`/helpdesk/kb/${article.slug}`)}
                  className="group relative flex flex-col rounded-xl border border-slate-800 bg-slate-900/50 p-5 text-left transition-all duration-200 hover:border-violet-500/50 hover:bg-slate-900 hover:shadow-lg hover:shadow-violet-500/10"
                >
                  {/* Category badge */}
                  {article.category && (
                    <span className="mb-3 inline-flex w-fit items-center rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-400 border border-violet-500/20">
                      {article.category.name}
                    </span>
                  )}
                  <h3 className="text-sm font-semibold text-white group-hover:text-violet-200 transition-colors line-clamp-2 mb-2">
                    {article.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-3 flex-1">
                    {article.excerpt ?? article.body?.slice(0, 150)}...
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-600">{formatDate(article.published_at)}</span>
                    <span className="text-xs text-slate-700 border border-slate-800 rounded px-1.5 py-0.5">
                      v{article.version}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>

      {showCreateModal && (
        <CreateArticleModal
          categories={categories}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
