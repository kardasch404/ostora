import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Plan } from '../../src/subscription/plan.enum';
import { PromoCodeType } from '../../src/promo-code/promo-code.enum';

describe('PromoCode E2E Tests', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let testCode: string;

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

    adminToken = 'Bearer mock-admin-token';
    userToken = 'Bearer mock-user-token';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /promo-codes/generate', () => {
    it('should generate promo code', () => {
      return request(app.getHttpServer())
        .post('/promo-codes/generate')
        .set('Authorization', adminToken)
        .send({
          plan: Plan.PREMIUM_MONTHLY,
          durationDays: 30,
          type: PromoCodeType.GIFT,
          maxUses: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.code).toBeDefined();
          expect(res.body.plan).toBe(Plan.PREMIUM_MONTHLY);
          expect(res.body.durationDays).toBe(30);
          testCode = res.body.code;
        });
    });

    it('should reject invalid plan', () => {
      return request(app.getHttpServer())
        .post('/promo-codes/generate')
        .set('Authorization', adminToken)
        .send({
          plan: 'INVALID_PLAN',
          durationDays: 30,
          type: PromoCodeType.GIFT,
        })
        .expect(400);
    });

    it('should reject invalid duration', () => {
      return request(app.getHttpServer())
        .post('/promo-codes/generate')
        .set('Authorization', adminToken)
        .send({
          plan: Plan.PREMIUM_MONTHLY,
          durationDays: 500,
          type: PromoCodeType.GIFT,
        })
        .expect(400);
    });
  });

  describe('GET /promo-codes/validate/:code', () => {
    it('should validate existing code', () => {
      return request(app.getHttpServer())
        .get(`/promo-codes/validate/${testCode}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.valid).toBe(true);
        });
    });

    it('should return false for invalid code', () => {
      return request(app.getHttpServer())
        .get('/promo-codes/validate/INVALID-CODE')
        .expect(200)
        .expect((res) => {
          expect(res.body.valid).toBe(false);
        });
    });
  });

  describe('POST /promo-codes/redeem', () => {
    it('should redeem valid code', () => {
      return request(app.getHttpServer())
        .post('/promo-codes/redeem')
        .set('Authorization', userToken)
        .send({ code: testCode })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.subscription).toBeDefined();
        });
    });

    it('should reject invalid code format', () => {
      return request(app.getHttpServer())
        .post('/promo-codes/redeem')
        .set('Authorization', userToken)
        .send({ code: 'invalid code!' })
        .expect(400);
    });
  });

  describe('GET /promo-codes/list', () => {
    it('should list promo codes', () => {
      return request(app.getHttpServer())
        .get('/promo-codes/list')
        .set('Authorization', adminToken)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should filter by type', () => {
      return request(app.getHttpServer())
        .get('/promo-codes/list?type=GIFT')
        .set('Authorization', adminToken)
        .expect(200);
    });
  });

  describe('GET /promo-codes/:code/stats', () => {
    it('should get usage statistics', () => {
      return request(app.getHttpServer())
        .get(`/promo-codes/${testCode}/stats`)
        .set('Authorization', adminToken)
        .expect(200)
        .expect((res) => {
          expect(res.body.code).toBe(testCode);
          expect(res.body.usedCount).toBeDefined();
          expect(res.body.remainingUses).toBeDefined();
        });
    });
  });

  describe('DELETE /promo-codes/:code', () => {
    it('should deactivate promo code', () => {
      return request(app.getHttpServer())
        .delete(`/promo-codes/${testCode}`)
        .set('Authorization', adminToken)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('DISABLED');
        });
    });
  });
});
