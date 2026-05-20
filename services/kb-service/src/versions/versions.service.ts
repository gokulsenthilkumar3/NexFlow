import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as Diff from 'diff';

@Injectable()
export class VersionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getArticleIdBySlug(slug: string): Promise<string> {
    const article = await this.prisma.kb_articles.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!article) throw new NotFoundException(`Article "${slug}" not found`);
    return article.id;
  }

  /** All versions for an article, newest first. */
  async getHistory(slug: string) {
    const articleId = await this.getArticleIdBySlug(slug);
    return this.prisma.article_versions.findMany({
      where: { article_id: articleId },
      orderBy: { version_number: 'desc' },
    });
  }

  /**
   * Get a specific version with a unified diff against the NEXT version
   * (i.e. what changed going from this version to the one after it).
   */
  async getVersionDiff(slug: string, versionNumber: number) {
    const articleId = await this.getArticleIdBySlug(slug);

    const thisVersion = await this.prisma.article_versions.findFirst({
      where: { article_id: articleId, version_number: versionNumber },
    });
    if (!thisVersion) throw new NotFoundException(`Version ${versionNumber} not found`);

    const nextVersion = await this.prisma.article_versions.findFirst({
      where: { article_id: articleId, version_number: versionNumber + 1 },
    });

    let diff: string | null = null;
    if (nextVersion) {
      diff = Diff.createPatch(
        slug,
        thisVersion.body_snapshot,
        nextVersion.body_snapshot,
        `v${versionNumber}`,
        `v${versionNumber + 1}`,
      );
    }

    return {
      version: thisVersion,
      nextVersion: nextVersion ?? null,
      diff,
    };
  }
}
