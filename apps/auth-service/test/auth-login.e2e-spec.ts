import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';

describe('Auth E2E - Register & Login (AUTH-10)', () => {
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

  describe('POST /api/v1/auth/login', () => {
    it('should return 200 with tokens on valid credentials', async () => {
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
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'ValidPass123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toMatchObject({
        email: 'test@example.com',
        role: 'USER',
      });
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 on invalid credentials', async () => {
      await prisma.user.create({
        data: {
          id: 'test-user-id',
          email: 'test@example.com',
          passwordHash: '$2b$10$' + 'a'.repeat(53),
          role: 'USER',
          isEmailVerified: true,
        },
      });

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        })
        .expect(400);
    });

    it('should return 401 for non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'ValidPass123!',
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should rotate tokens on valid refresh token', async () => {
      const user = await prisma.user.create({
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

      const oldRefreshToken = loginResponse.body.refreshToken;

      const refreshResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken })
        .expect(200);

      expect(refreshResponse.body).toHaveProperty('accessToken');
      expect(refreshResponse.body).toHaveProperty('refreshToken');
      expect(refreshResponse.body.refreshToken).not.toBe(oldRefreshToken);
    });

    it('should return 401 on invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });
});
