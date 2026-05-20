import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const port = parseInt(process.env.PORT ?? '4000', 10);
  const redisHost = process.env.REDIS_HOST ?? 'localhost';
  const redisPort = parseInt(process.env.REDIS_PORT ?? '6379', 10);
  const redisPassword = process.env.REDIS_PASSWORD;

  const redisUrl = redisPassword
    ? `redis://:${redisPassword}@${redisHost}:${redisPort}`
    : `redis://${redisHost}:${redisPort}`;

  // Set up Redis adapter for Socket.io (future horizontal scaling)
  const pubClient = createClient({ url: redisUrl });
  const subClient = pubClient.duplicate();
  await Promise.all([pubClient.connect(), subClient.connect()]);
  const redisAdapter = createAdapter(pubClient, subClient);

  app.useWebSocketAdapter(new IoAdapter(app));
  const server = app.getHttpServer();

  // Attach redis adapter after NestJS starts
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
    credentials: true,
  });

  await app.listen(port);

  // Attach the Redis adapter to the underlying socket.io server
  server.on('listening', () => {
    const io = server['io'];
    if (io) {
      io.adapter(redisAdapter);
    }
  });

  logger.log(`Realtime service running on port ${port}`);
  logger.log(`Redis adapter connected to ${redisHost}:${redisPort}`);
}

bootstrap();
