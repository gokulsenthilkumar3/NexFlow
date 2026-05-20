import { Module } from '@nestjs/common';
import { EtlService } from './etl.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [EtlService, PrismaService],
  exports: [EtlService],
})
export class EtlModule {}
