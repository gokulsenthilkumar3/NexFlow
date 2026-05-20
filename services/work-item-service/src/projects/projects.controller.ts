import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard, RolesGuard } from '@nexflow/shared-types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() body: { name: string; key: string; description?: string }) {
    return this.projectsService.create(body.name, body.key, body.description);
  }

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }
}
