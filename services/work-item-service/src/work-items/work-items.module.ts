import { Module } from '@nestjs/common';
import { WorkItemsService } from './work-items.service';
import { WorkItemsController } from './work-items.controller';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [WorkItemsService, PrismaService],
  controllers: [WorkItemsController]
})
export class WorkItemsModule {}
