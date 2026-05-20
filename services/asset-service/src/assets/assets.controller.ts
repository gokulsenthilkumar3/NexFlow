import {
  Controller, Get, Post, Patch, Param, Query, Body, Req, UseGuards,
} from '@nestjs/common';
import { AssetsService } from './assets.service';
import { JwtAuthGuard } from '@nexflow/shared-types';

@UseGuards(JwtAuthGuard)
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.assetsService.findAll({ status, category, search });
  }

  // Must be declared before :id to avoid Express matching 'by-ticket' as an id
  @Get('by-ticket/:ticketId')
  findByTicket(@Param('ticketId') ticketId: string) {
    return this.assetsService.findByTicket(ticketId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @Post()
  create(@Body() body: any, @Req() req: any) {
    return this.assetsService.create(body, req.user?.sub ?? 'system');
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.assetsService.update(id, body, req.user?.sub ?? 'system');
  }

  @Post(':id/assign')
  assign(
    @Param('id') id: string,
    @Body() body: { userId: string; assignedBy: string; notes?: string },
  ) {
    return this.assetsService.assign(id, body);
  }

  @Post(':id/return')
  return(@Param('id') id: string, @Req() req: any) {
    return this.assetsService.return(id, req.user?.sub ?? 'system');
  }

  @Post(':id/maintenance')
  maintenance(@Param('id') id: string, @Req() req: any) {
    return this.assetsService.markMaintenance(id, req.user?.sub ?? 'system');
  }

  @Post(':id/retire')
  retire(@Param('id') id: string, @Req() req: any) {
    return this.assetsService.retire(id, req.user?.sub ?? 'system');
  }

  @Post(':id/link-ticket/:ticketId')
  linkTicket(
    @Param('id') id: string,
    @Param('ticketId') ticketId: string,
    @Req() req: any,
  ) {
    return this.assetsService.linkTicket(id, ticketId, req.user?.sub ?? 'system');
  }
}
