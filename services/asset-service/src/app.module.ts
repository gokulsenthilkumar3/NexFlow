import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AssetsModule } from './assets/assets.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AssetsModule,
    AuditModule,
  ],
})
export class AppModule {}
