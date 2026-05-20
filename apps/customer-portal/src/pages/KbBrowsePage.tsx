import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

interface KbCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  articleCount?: number;
}

interface KbArticle {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  category?: { name: string; slug: string };
  views: number;
  updatedAt: string;
}

const API = import.meta.env.VITE_HELPDESK_API_URL ?? 'http://localhost:3003';

async function fetchCategories(): Promise<KbCategory[]> {
  const res = await fetch(`${API}/kb/categories`);
  if (!res.ok) throw new Error('Failed to load categories');
  return res.json();
}

async function fetchArticles(categorySlug?: string): Promise<KbArticle[]> {
  const url = categorySlug
    ? `${API}/kb/articles?category=${categorySlug}`
    : `${API}/kb/articles`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load articles');
  return res.json();
}

async function fetchArticleBySlug(slug: string): Promise<KbArticle & { content: string }> {
  const res = await fetch(`${API}/kb/articles/${slug}`);
  if (!res.ok) throw new Error('Article not found');
  return res.json();
}

export default function KbBrowsePage() {
  const { slug } = useParams<{ slug?: string }>();

  const [categories, setCategories] = useState<KbCategory[]>([]);
  const [articles, setArticles] = useState<KbArticle[]>([]);
  const [article, setArticle] = useState<(KbArticle & { content: string }) | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (slug) {
      setLoading(true);
      fetchArticleBySlug(slug)
        .then((a) => { setArticle(a); setLoading(false); })
        .catch((e) => { setError(e.message); setLoading(false); });
    } else {
      setLoading(true);
      fetchArticles(activeCategory)
        .then((a) => { setArticles(a); setLoading(false); })
        .catch((e) => { setError(e.message); setLoading(false); });
    }
  }, [slug, activeCategory]);

  const filtered = search.trim()
    ? articles.filter(
        (a) =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          a.excerpt?.toLowerCase().includes(search.toLowerCase())
      )
    : articles;

  if (slug && article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link
          to="/kb"
          className="text-sm text-indigo-600 hover:underline mb-6 inline-block"
        >
          &larr; Back to Knowledge Base
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{article.title}</h1>
        {article.category && (
          <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
            {article.category.name}
          </span>
        )}
        <p className="text-xs text-gray-400 mt-2 mb-6">
          {article.views} views &middot; Updated{' '}
          {new Date(article.updatedAt).toLocaleDateString()}
        </p>
        <div
          className="prose prose-indigo max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
        <div className="mt-10 flex items-center gap-4 border-t pt-6">
          <p className="text-sm text-gray-600">Was this article helpful?</p>
          <button
            onClick={() => fetch(`${API}/kb/articles/${article.id}/helpful`, { method: 'POST', body: JSON.stringify({ vote: 'yes' }), headers: { 'Content-Type': 'application/json' } })}
            className="px-4 py-1.5 text-sm rounded-full border border-green-500 text-green-600 hover:bg-green-50"
          >
            Yes
          </button>
          <button
            onClick={() => fetch(`${API}/kb/articles/${article.id}/helpful`, { method: 'POST', body: JSON.stringify({ vote: 'no' }), headers: { 'Content-Type': 'application/json' } })}
            className="px-4 py-1.5 text-sm rounded-full border border-red-400 text-red-500 hover:bg-red-50"
          >
            No
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Knowledge Base</h1>
      <p className="text-gray-500 mb-8">Browse articles and guides to find answers quickly.</p>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search articles..."
        className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2 text-sm mb-8 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />

      <div className="flex gap-8">
        <aside className="w-48 flex-shrink-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Categories</p>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => setActiveCategory(undefined)}
                className={`text-sm w-full text-left px-3 py-1.5 rounded-md ${
                  !activeCategory ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                All
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => setActiveCategory(cat.slug)}
                  className={`text-sm w-full text-left px-3 py-1.5 rounded-md ${
                    activeCategory === cat.slug
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex-1">
          {loading && (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {!loading && !error && filtered.length === 0 && (
            <p className="text-gray-500 text-sm py-10 text-center">No articles found.</p>
          )}
          <ul className="space-y-4">
            {filtered.map((art) => (
              <li key={art.id} className="border rounded-xl p-5 hover:shadow-md transition-shadow bg-white">
                <Link
                  to={`/kb/${art.slug}`}
                  className="text-base font-semibold text-indigo-700 hover:underline block mb-1"
                >
                  {art.title}
                </Link>
                {art.excerpt && (
                  <p className="text-sm text-gray-500 line-clamp-2">{art.excerpt}</p>
                )}
                <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                  {art.category && (
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full">{art.category.name}</span>
                  )}
                  <span>{art.views} views</span>
                  <span>Updated {new Date(art.updatedAt).toLocaleDateString()}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
