import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjectsModule } from './projects/projects.module';
import { WorkItemsModule } from './work-items/work-items.module';

@Module({
  imports: [ProjectsModule, WorkItemsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

