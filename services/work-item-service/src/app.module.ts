import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WorkItemController } from './work-item.controller';
import { ProjectsModule } from './projects/projects.module';
import { WorkItemsModule } from './work-items/work-items.module';

@Module({
  imports: [ProjectsModule, WorkItemsModule],
  controllers: [AppController, WorkItemController],
  providers: [AppService],
})
export class AppModule {}
