import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { WorkItemType, WorkItemStatus } from '@nexflow/shared-types';

@Controller('work-items')
export class WorkItemController {
  
  @Post()
  async create(@Body() createDto: any) {
    // Mock implementation for now
    return {
      id: Math.random().toString(36).substring(7),
      ...createDto,
      status: 'QUEUED_FOR_TRIAGE',
      createdAt: new Date()
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return {
      id,
      title: 'Mock Work Item',
      description: 'AI Triage in progress...',
      status: WorkItemStatus.NEW,
      type: WorkItemType.BUG
    };
  }
}
