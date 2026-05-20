import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [AuthController],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AuthModule {}
