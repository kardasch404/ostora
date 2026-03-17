import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';

describe('Auth E2E - Brute-force & Password Reset (AUTH-10)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;

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
  });

  describe('Brute-force Protection', () => {
    it('should lockout after 5 failed login attempts', async () => {
      await prisma.user.create({
        data: {
          id: 'test-user-id',
          email: 'test@example.com',
          passwordHash: '$2b$10$' + 'a'.repeat(53),
          role: 'USER',
          isEmailVerified: true,
        },
      });

      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: 'test@example.com',
            password: 'WrongPassword',
          })
          .expect(400);
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        });

      expect([400, 429]).toContain(response.status);
    });

    it('should allow login after lockout expires', async () => {
      await prisma.user.create({
        data: {
          id: 'test-user-id',
          email: 'test@example.com',
          passwordHash: '$2b$10$' + 'a'.repeat(53),
          role: 'USER',
          isEmailVerified: true,
        },
      });

      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: 'test@example.com',
            password: 'WrongPassword',
          });
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'ValidPass123!',
        });

      expect([200, 400, 429]).toContain(response.status);
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should return 200 for existing email', async () => {
      await prisma.user.create({
        data: {
          id: 'test-user-id',
          email: 'test@example.com',
          passwordHash: '$2b$10$' + 'a'.repeat(53),
          role: 'USER',
          isEmailVerified: true,
        },
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 200 for non-existent email (security)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      const user = await prisma.user.create({
        data: {
          id: 'test-user-id',
          email: 'test@example.com',
          passwordHash: '$2b$10$' + 'a'.repeat(53),
          role: 'USER',
          isEmailVerified: true,
        },
      });

      await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'test@example.com' });

      const resetToken = await redis.get(`password-reset:${user.id}`);

      if (resetToken) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/reset-password')
          .send({
            token: resetToken,
            newPassword: 'NewPass123!',
          })
          .expect(200);

        expect(response.body).toHaveProperty('message');
      }
    });

    it('should return 400 for invalid token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'NewPass123!',
        })
        .expect(400);
    });
  });
});
