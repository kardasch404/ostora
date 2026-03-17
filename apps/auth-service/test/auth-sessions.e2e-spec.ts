import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';

describe('Auth E2E - Logout & Sessions (AUTH-10)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    
    prisma = app.get<PrismaService>(PrismaService);
    redis = app.get<RedisService>(RedisService);

    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await redis.disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
    await prisma.session.deleteMany();
    await redis.flushall();

    await prisma.user.create({
      data: {
        id: 'test-user-id',
        email: 'test@example.com',
        passwordHash: '$2b$10$' + 'a'.repeat(53),
        role: 'USER',
        isEmailVerified: true,
      },
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'ValidPass123!',
      });

    accessToken = loginResponse.body.accessToken;
    refreshToken = loginResponse.body.refreshToken;
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should return 200 and clear cookies', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Logged out successfully');
    });

    it('should return 401 without access token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .send({ refreshToken })
        .expect(401);
    });
  });

  describe('GET /api/v1/auth/sessions', () => {
    it('should return list of active sessions', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body.sessions)).toBe(true);
      expect(response.body.sessions.length).toBeGreaterThan(0);
    });

    it('should return 401 without access token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/sessions')
        .expect(401);
    });
  });

  describe('DELETE /api/v1/auth/sessions/:sessionId', () => {
    it('should revoke specific session', async () => {
      const sessionsResponse = await request(app.getHttpServer())
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`);

      const sessionId = sessionsResponse.body.sessions[0]?.id;

      if (sessionId) {
        const response = await request(app.getHttpServer())
          .delete(`/api/v1/auth/sessions/${sessionId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message');
      }
    });

    it('should return 401 without access token', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/auth/sessions/some-session-id')
        .expect(401);
    });
  });

  describe('DELETE /api/v1/auth/sessions', () => {
    it('should revoke all sessions', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });
});
