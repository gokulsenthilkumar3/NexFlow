export default () => ({
  port: parseInt(process.env.PORT || '3005', 10),
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  github: {
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || 'dev_secret',
  },
});
