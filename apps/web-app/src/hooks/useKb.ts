'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

export interface KbCategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  children?: KbCategory[];
}

export interface KbArticle {
  id: string;
  title: string;
  slug: string;
  body: string;
  excerpt?: string;
  category_id?: string;
  category?: KbCategory;
  author_id: string;
  published_at?: string;
  version: number;
  created_at: string;
  updated_at?: string;
  _count?: { versions: number };
}

export interface KbArticleVersion {
  id: string;
  article_id: string;
  version_number: number;
  changed_by: string;
  created_at: string;
  diff?: string;
}

// ── Query keys ────────────────────────────────────────────────────────────────

export const KB_KEYS = {
  categories: ['kb', 'categories'] as const,
  articles: (search?: string) => ['kb', 'articles', search ?? ''] as const,
  article: (slug: string) => ['kb', 'article', slug] as const,
  history: (slug: string) => ['kb', 'history', slug] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useKbCategories() {
  return useQuery({
    queryKey: KB_KEYS.categories,
    queryFn: async () => {
      const { data } = await apiClient.get<KbCategory[]>('/api/kb/categories');
      return data;
    },
  });
}

export function useKbArticles(search?: string) {
  return useQuery({
    queryKey: KB_KEYS.articles(search),
    queryFn: async () => {
      if (search?.trim()) {
        const { data } = await apiClient.get<KbArticle[]>('/api/kb/articles/search', {
          params: { q: search },
        });
        return data;
      }
      const { data } = await apiClient.get<KbArticle[]>('/api/kb/articles');
      return data;
    },
  });
}

export function useKbArticle(slug: string) {
  return useQuery({
    queryKey: KB_KEYS.article(slug),
    queryFn: async () => {
      const { data } = await apiClient.get<KbArticle>(`/api/kb/articles/${slug}`);
      return data;
    },
    enabled: Boolean(slug),
  });
}

export function useKbArticleHistory(slug: string) {
  return useQuery({
    queryKey: KB_KEYS.history(slug),
    queryFn: async () => {
      const { data } = await apiClient.get<KbArticleVersion[]>(
        `/api/kb/articles/${slug}/history`,
      );
      return data;
    },
    enabled: Boolean(slug),
  });
}

export function useCreateKbArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: {
      title: string;
      slug: string;
      body: string;
      category_id?: string;
      published?: boolean;
    }) => {
      const { data } = await apiClient.post<KbArticle>('/api/kb/articles', dto);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kb', 'articles'] }),
  });
}

export function useUpdateKbArticle(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<{ title: string; body: string; category_id: string; published: boolean }>) => {
      const { data } = await apiClient.patch<KbArticle>(`/api/kb/articles/${slug}`, dto);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KB_KEYS.article(slug) });
      qc.invalidateQueries({ queryKey: ['kb', 'articles'] });
    },
  });
}

export function useSuggestArticles(ticketId: string) {
  return useMutation({
    mutationFn: async (body: {
      ticket_subject: string;
      ticket_description?: string;
      candidates: { id: string; title: string; slug: string; excerpt: string }[];
    }) => {
      const { data } = await apiClient.post(`/api/tickets/${ticketId}/suggest-articles`, body);
      return data;
    },
  });
}
