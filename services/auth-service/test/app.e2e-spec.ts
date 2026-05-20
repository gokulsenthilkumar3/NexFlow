import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth Service (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /auth/health', () => {
    it('returns 200 with status ok', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        service: 'auth-service',
      });
    });
  });

  describe('GET /auth/me', () => {
    it('returns 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('returns 401 when an invalid Bearer token is provided', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });
  });

  describe('POST /auth/verify-token', () => {
    it('returns 401 when no Authorization header is provided', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify-token')
        .expect(401);
    });

    it('returns 401 for a malformed token', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify-token')
        .set('Authorization', 'Bearer not.a.real.clerk.token')
        .expect(401);
    });
  });

  describe('POST /auth/assign-role', () => {
    it('returns 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/auth/assign-role')
        .send({ targetUserId: 'user_123', role: 'AGENT' })
        .expect(401);
    });
  });
});
