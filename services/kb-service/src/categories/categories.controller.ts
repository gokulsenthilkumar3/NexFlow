import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '@nexflow/shared-types';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('public')
  findAllPublic() {
    return this.categoriesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: { name: string; slug: string; parent_id?: string }) {
    return this.categoriesService.create(body);
  }
}
