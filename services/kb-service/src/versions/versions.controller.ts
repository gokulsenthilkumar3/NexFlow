import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { VersionsService } from './versions.service';
import { JwtAuthGuard } from '@nexflow/shared-types';

@UseGuards(JwtAuthGuard)
@Controller('articles')
export class VersionsController {
  constructor(private readonly versionsService: VersionsService) {}

  @Get(':slug/history')
  getHistory(@Param('slug') slug: string) {
    return this.versionsService.getHistory(slug);
  }

  @Get(':slug/history/:versionNumber')
  getVersionDiff(
    @Param('slug') slug: string,
    @Param('versionNumber') versionNumber: string,
  ) {
    return this.versionsService.getVersionDiff(slug, parseInt(versionNumber, 10));
  }
}
