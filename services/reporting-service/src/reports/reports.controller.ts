import {
  Controller, Get, Post, Param, Query, Body, Res, UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '@nexflow/shared-types';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('trigger')
  trigger(@Body() body: { period?: number }) {
    return this.reportsService.triggerEtl(body.period ?? 30);
  }

  @Get(':type/export')
  async export(
    @Param('type') type: string,
    @Query('period') period: string = '30d',
    @Res() res: Response,
  ) {
    const csv = await this.reportsService.exportCsv(type.toUpperCase(), period);
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${type}-${period}-report.csv"`,
    });
    res.send(csv);
  }

  @Get(':type')
  getReport(
    @Param('type') type: string,
    @Query('period') period: string = '30d',
  ) {
    return this.reportsService.getReport(type.toUpperCase(), period);
  }
}
