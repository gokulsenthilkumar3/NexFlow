import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { WorkItemsService } from './work-items.service';
import { JwtAuthGuard, ProjectScopeGuard } from '@nexflow/shared-types';

@UseGuards(JwtAuthGuard, ProjectScopeGuard)
@Controller('work-items')
export class WorkItemsController {
  constructor(private readonly workItemsService: WorkItemsService) {}

  @Post()
  create(@Body() body: any) {
    return this.workItemsService.create(body);
  }

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    return this.workItemsService.findAll(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workItemsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.workItemsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workItemsService.remove(id);
  }

  @Post(':id/link-ticket')
  linkTicket(@Param('id') id: string, @Body('ticketId') ticketId: string) {
    return this.workItemsService.linkTicket(id, ticketId);
  }
}
