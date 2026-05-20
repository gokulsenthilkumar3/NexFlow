import { Module } from '@nestjs/common';
import { WorkItemsService } from './work-items.service';
import { WorkItemsController } from './work-items.controller';
import { PrismaService } from '../prisma.service';
import { AiUpdatesWorker } from './ai-updates.worker';

@Module({
  providers: [WorkItemsService, PrismaService, AiUpdatesWorker],
  controllers: [WorkItemsController]
})
export class WorkItemsModule {}
