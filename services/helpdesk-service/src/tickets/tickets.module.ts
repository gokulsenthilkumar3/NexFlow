import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { PrismaService } from '../prisma.service';
import { SlaModule } from '../sla/sla.module';
import { MailModule } from '../mail/mail.module';
import { SlaWorker, TICKET_SLA_QUEUE } from '../worker/sla.worker';

@Module({
  imports: [
    SlaModule,
    MailModule,
    BullModule.registerQueue({ name: TICKET_SLA_QUEUE }),
  ],
  controllers: [TicketsController],
  providers: [TicketsService, PrismaService, SlaWorker],
})
export class TicketsModule {}
