import {
  Controller, Get, Post, Patch, Delete,
  Param, Query, Body, Req, UseGuards,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { JwtAuthGuard } from '@nexflow/shared-types';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  // ── Public endpoints (no auth — for customer portal) ───────────────────────

  @Get('public/search')
  searchPublic(@Query('q') q: string) {
    return this.articlesService.search(q, false);
  }

  // ── Authenticated endpoints ─────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.articlesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  search(@Query('q') q: string) {
    return this.articlesService.search(q, false);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.articlesService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: any, @Req() req: any) {
    return this.articlesService.create({
      ...body,
      author_id: body.author_id ?? req.user?.sub ?? 'system',
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':slug')
  update(@Param('slug') slug: string, @Body() body: any, @Req() req: any) {
    return this.articlesService.update(slug, body, req.user?.sub ?? 'system');
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':slug')
  softDelete(@Param('slug') slug: string) {
    return this.articlesService.softDelete(slug);
  }
}
