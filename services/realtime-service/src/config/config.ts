export const config = () => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  cors: {
    origin: process.env.CORS_ORIGIN ?? '*',
  },
});

export type AppConfig = ReturnType<typeof config>;
