import {
  Controller, Get, Post, Body, Patch, Param, Query, UseGuards,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard, ProjectScopeGuard } from '@nexflow/shared-types';

@UseGuards(JwtAuthGuard, ProjectScopeGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  create(@Body() body: any) {
    return this.ticketsService.create(body);
  }

  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('priority') priority?: string,
    @Query('status') status?: string,
  ) {
    return this.ticketsService.findAll(projectId, priority, status);
  }

  /**
   * Must be declared BEFORE :id route to avoid Express matching 'sla-dashboard' as an id param.
   */
  @Get('sla-dashboard')
  slaDashboard() {
    return this.ticketsService.getSlaDashboard();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.ticketsService.update(id, body);
  }

  /**
   * Inbound-email webhook — no JWT guard (called by email provider).
   * Override guards at method level by applying no additional guard.
   */
  @Post('inbound-email')
  inboundEmail(@Body() body: { from: string; subject: string; body: string }) {
    return this.ticketsService.createFromEmail(body);
  }
}
