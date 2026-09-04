import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Prisma connected to database.');
    } catch (error) {
      console.warn('Prisma connection failed (Docker is likely down). Running in degraded mode.', error.message);
    }
  }
}
