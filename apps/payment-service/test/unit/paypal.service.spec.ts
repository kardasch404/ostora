import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PayPalService } from '../../src/providers/paypal/paypal.service';
import { Plan } from '../../src/subscription/plan.enum';
import { BadRequestException } from '@nestjs/common';

describe('PayPalService Unit Tests', () => {
  let service: PayPalService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayPalService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                PAYPAL_CLIENT_ID: 'test_client_id',
                PAYPAL_CLIENT_SECRET: 'test_client_secret',
                PAYPAL_MODE: 'sandbox',
                PAYPAL_PLAN_PREMIUM_MONTHLY: 'P-premium_monthly',
                PAYPAL_PLAN_PREMIUM_ANNUAL: 'P-premium_annual',
                PAYPAL_PLAN_B2B_STARTER: 'P-b2b_starter',
                PAYPAL_PLAN_B2B_PRO: 'P-b2b_pro',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PayPalService>(PayPalService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPayPalPlanId', () => {
    it('should return correct plan ID for premium monthly', () => {
      const planId = service['getPayPalPlanId'](Plan.PREMIUM_MONTHLY);
      expect(planId).toBe('P-premium_monthly');
    });

    it('should return correct plan ID for B2B Pro', () => {
      const planId = service['getPayPalPlanId'](Plan.B2B_PRO);
      expect(planId).toBe('P-b2b_pro');
    });

    it('should throw error for free plan', () => {
      expect(() => service['getPayPalPlanId'](Plan.FREE)).toThrow(BadRequestException);
    });
  });

  describe('validateWebhookSignature', () => {
    it('should validate webhook signature', () => {
      const isValid = service.validateWebhookSignature(
        'webhook-id',
        'transmission-id',
        'transmission-time',
        'cert-url',
        'signature',
        {},
      );
      expect(isValid).toBe(true);
    });
  });
});
