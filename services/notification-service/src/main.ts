import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  app.enableCors(); // Adjust as needed
  
  const port = parseInt(process.env.PORT ?? '3004', 10);
  await app.listen(port);
  
  logger.log(`Notification Service running on port ${port}`);
}
bootstrap();
