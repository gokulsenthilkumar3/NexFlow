import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  /** List all published articles with category name. */
  async findAll() {
    return this.prisma.kb_articles.findMany({
      where: { published_at: { not: null } },
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: { published_at: 'desc' },
    });
  }

  /**
   * Full-text search using PostgreSQL tsvector.
   * Requires the generated search_vector column to exist (see schema.prisma note).
   * Falls back to case-insensitive LIKE if the column doesn't exist yet.
   */
  async search(q: string, includeUnpublished = false): Promise<any[]> {
    if (!q?.trim()) return [];
    try {
      const rows: any[] = await this.prisma.$queryRaw`
        SELECT
          id, title, slug,
          LEFT(body, 200) AS excerpt,
          category_id,
          published_at
        FROM kb_articles
        WHERE search_vector @@ plainto_tsquery('english', ${q})
          ${includeUnpublished ? this.prisma.$queryRaw`AND 1=1` : this.prisma.$queryRaw`AND published_at IS NOT NULL`}
        ORDER BY ts_rank(search_vector, plainto_tsquery('english', ${q})) DESC
        LIMIT 10
      `;
      return rows;
    } catch {
      // Fallback: tsvector column not yet created — use ILIKE
      return this.prisma.kb_articles.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { body: { contains: q, mode: 'insensitive' } },
          ],
          ...(includeUnpublished ? {} : { published_at: { not: null } }),
        },
        select: { id: true, title: true, slug: true, body: true, category_id: true, published_at: true },
        take: 10,
      });
    }
  }

  /** Single article by slug — throws 404 if not found. */
  async findBySlug(slug: string) {
    const article = await this.prisma.kb_articles.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { versions: true } },
      },
    });
    if (!article) throw new NotFoundException(`Article "${slug}" not found`);
    return article;
  }

  /** Create article and snapshot body as version 1. */
  async create(dto: {
    title: string;
    slug: string;
    body: string;
    category_id?: string;
    author_id: string;
    published?: boolean;
  }) {
    const article = await this.prisma.kb_articles.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        body: dto.body,
        category_id: dto.category_id ?? null,
        author_id: dto.author_id,
        published_at: dto.published ? new Date() : null,
        version: 1,
      },
    });

    // Snapshot initial body as version 1
    await this.prisma.article_versions.create({
      data: {
        article_id: article.id,
        body_snapshot: dto.body,
        version_number: 1,
        changed_by: dto.author_id,
      },
    });

    return article;
  }

  /** Update article — save current body as version snapshot first. */
  async update(slug: string, dto: Partial<{
    title: string;
    body: string;
    category_id: string;
    published: boolean;
  }>, userId: string) {
    const current = await this.findBySlug(slug);

    // If body changed, snapshot the old version
    if (dto.body && dto.body !== current.body) {
      const nextVersion = current.version + 1;
      await this.prisma.article_versions.create({
        data: {
          article_id: current.id,
          body_snapshot: current.body,
          version_number: current.version,
          changed_by: userId,
        },
      });
      return this.prisma.kb_articles.update({
        where: { slug },
        data: {
          ...(dto.title ? { title: dto.title } : {}),
          body: dto.body,
          version: nextVersion,
          ...(dto.category_id !== undefined ? { category_id: dto.category_id } : {}),
          ...(dto.published !== undefined ? { published_at: dto.published ? new Date() : null } : {}),
        },
      });
    }

    // No body change — just update metadata
    return this.prisma.kb_articles.update({
      where: { slug },
      data: {
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.category_id !== undefined ? { category_id: dto.category_id } : {}),
        ...(dto.published !== undefined ? { published_at: dto.published ? new Date() : null } : {}),
      },
    });
  }

  /** Soft-delete: set published_at = null. */
  async softDelete(slug: string) {
    await this.findBySlug(slug); // 404 if missing
    return this.prisma.kb_articles.update({
      where: { slug },
      data: { published_at: null },
    });
  }
}
