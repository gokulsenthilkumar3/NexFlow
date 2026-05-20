import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors();

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3005;

  await app.listen(port);
  Logger.log(`Integration Service running on port ${port}`, 'Bootstrap');
}
bootstrap();
