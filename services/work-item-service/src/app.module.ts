import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WorkItemController } from './work-item.controller';

@Module({
  imports: [],
  controllers: [AppController, WorkItemController],
  providers: [AppService],
})
export class AppModule {}
