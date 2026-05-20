import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Fetch all categories and build tree in memory. */
  async findAll() {
    const all = await this.prisma.kb_categories.findMany({
      orderBy: { name: 'asc' },
    });

    const map = new Map<string, any>();
    all.forEach((c) => map.set(c.id, { ...c, children: [] }));

    const roots: any[] = [];
    all.forEach((c) => {
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id).children.push(map.get(c.id));
      } else {
        roots.push(map.get(c.id));
      }
    });
    return roots;
  }

  /** Single category by slug with its published articles. */
  async findBySlug(slug: string) {
    const cat = await this.prisma.kb_categories.findUnique({
      where: { slug },
      include: {
        articles: {
          where: { published_at: { not: null } },
          select: { id: true, title: true, slug: true, published_at: true, version: true },
          orderBy: { published_at: 'desc' },
        },
      },
    });
    if (!cat) throw new NotFoundException(`Category "${slug}" not found`);
    return cat;
  }

  async create(dto: { name: string; slug: string; parent_id?: string }) {
    return this.prisma.kb_categories.create({ data: dto });
  }
}
