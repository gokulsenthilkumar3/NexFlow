export const config = () => ({
  port: parseInt(process.env.PORT ?? '3004', 10),
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  smtp: {
    host: process.env.SMTP_HOST ?? 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.SMTP_FROM ?? 'NexFlow <noreply@nexflow.dev>',
  },
  realtimeServiceUrl: process.env.REALTIME_SERVICE_URL ?? 'http://localhost:4000',
});
