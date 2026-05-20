import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { EtlModule } from '../etl/etl.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [EtlModule],
  controllers: [ReportsController],
  providers: [ReportsService, PrismaService],
})
export class ReportsModule {}
