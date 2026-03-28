import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Plan } from '../../src/subscription/plan.enum';

describe('PayPal E2E Tests', () => {
  let app: INestApplication;
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

    authToken = 'Bearer mock-jwt-token';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /paypal/orders', () => {
    it('should create PayPal order', () => {
      return request(app.getHttpServer())
        .post('/paypal/orders')
        .set('Authorization', authToken)
        .send({
          plan: Plan.PREMIUM_MONTHLY,
          returnUrl: 'https://ostora.com/success',
          cancelUrl: 'https://ostora.com/cancel',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.orderId).toBeDefined();
          expect(res.body.approveUrl).toBeDefined();
          expect(res.body.status).toBe('CREATED');
        });
    });

    it('should reject invalid plan', () => {
      return request(app.getHttpServer())
        .post('/paypal/orders')
        .set('Authorization', authToken)
        .send({
          plan: 'INVALID_PLAN',
          returnUrl: 'https://ostora.com/success',
          cancelUrl: 'https://ostora.com/cancel',
        })
        .expect(400);
    });

    it('should reject invalid URL', () => {
      return request(app.getHttpServer())
        .post('/paypal/orders')
        .set('Authorization', authToken)
        .send({
          plan: Plan.PREMIUM_MONTHLY,
          returnUrl: 'not-a-url',
          cancelUrl: 'https://ostora.com/cancel',
        })
        .expect(400);
    });
  });

  describe('POST /paypal/subscriptions', () => {
    it('should create PayPal subscription', () => {
      return request(app.getHttpServer())
        .post('/paypal/subscriptions')
        .set('Authorization', authToken)
        .send({
          plan: Plan.PREMIUM_MONTHLY,
          returnUrl: 'https://ostora.com/success',
          cancelUrl: 'https://ostora.com/cancel',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.subscriptionId).toBeDefined();
          expect(res.body.approveUrl).toBeDefined();
        });
    });
  });

  describe('POST /webhooks/paypal', () => {
    it('should handle webhook event', () => {
      return request(app.getHttpServer())
        .post('/webhooks/paypal')
        .set('paypal-transmission-id', 'test-id')
        .set('paypal-transmission-time', '2024-01-01T00:00:00Z')
        .set('paypal-transmission-sig', 'test-sig')
        .set('paypal-cert-url', 'https://api.paypal.com/cert')
        .set('paypal-auth-algo', 'SHA256withRSA')
        .send({
          event_type: 'PAYMENT.CAPTURE.COMPLETED',
          resource: {
            id: 'test-capture-id',
            amount: { value: '5.00' },
            custom_id: 'test-user-123',
          },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.received).toBe(true);
        });
    });
  });
});
