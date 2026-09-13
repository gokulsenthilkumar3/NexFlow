import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';
@Module({ imports: [ConfigModule.forRoot({ isGlobal: true })], controllers: [OperationsController], providers: [OperationsService] })
export class AppModule {}
