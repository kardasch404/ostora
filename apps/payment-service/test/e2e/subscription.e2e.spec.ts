import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Plan } from '../../src/subscription/plan.enum';
import { PrismaClient } from '@prisma/client';

describe('Subscription E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let testUserId: string;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    prisma = new PrismaClient();

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: `e2e-test-${Date.now()}@ostora.com`,
        firstName: 'E2E',
        lastName: 'Test',
        password: 'hashed_password',
      },
    });
    testUserId = testUser.id;

    // Mock auth token (in real scenario, get from auth service)
    authToken = 'Bearer mock-jwt-token';
  });

  afterAll(async () => {
    await prisma.subscription.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /subscriptions', () => {
    it('should create free subscription', () => {
      return request(app.getHttpServer())
        .post('/subscriptions')
        .set('Authorization', authToken)
        .send({ plan: Plan.FREE })
        .expect(201)
        .expect((res) => {
          expect(res.body.plan).toBe(Plan.FREE);
          expect(res.body.userId).toBe(testUserId);
        });
    });

    it('should reject invalid plan', () => {
      return request(app.getHttpServer())
        .post('/subscriptions')
        .set('Authorization', authToken)
        .send({ plan: 'INVALID_PLAN' })
        .expect(400);
    });

    it('should create premium subscription', () => {
      return request(app.getHttpServer())
        .post('/subscriptions')
        .set('Authorization', authToken)
        .send({ plan: Plan.PREMIUM_MONTHLY })
        .expect(201)
        .expect((res) => {
          expect(res.body.plan).toBe(Plan.PREMIUM_MONTHLY);
          expect(res.body.stripeCustomerId).toBeDefined();
          expect(res.body.stripeSubscriptionId).toBeDefined();
        });
    });
  });

  describe('GET /subscriptions/me', () => {
    it('should get current user subscription', () => {
      return request(app.getHttpServer())
        .get('/subscriptions/me')
        .set('Authorization', authToken)
        .expect(200)
        .expect((res) => {
          expect(res.body.userId).toBe(testUserId);
          expect(res.body.plan).toBeDefined();
        });
    });

    it('should reject unauthorized request', () => {
      return request(app.getHttpServer())
        .get('/subscriptions/me')
        .expect(401);
    });
  });

  describe('DELETE /subscriptions', () => {
    it('should cancel subscription', () => {
      return request(app.getHttpServer())
        .delete('/subscriptions')
        .set('Authorization', authToken)
        .expect(200)
        .expect((res) => {
          expect(res.body.cancelAtPeriodEnd).toBe(true);
        });
    });
  });
});
