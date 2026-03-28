import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StripeService } from '../../src/providers/stripe/stripe.service';
import { Plan } from '../../src/subscription/plan.enum';
import { BadRequestException } from '@nestjs/common';

describe('StripeService Unit Tests', () => {
  let service: StripeService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                STRIPE_SECRET_KEY: 'sk_test_mock_key',
                STRIPE_PRICE_PREMIUM_MONTHLY: 'price_premium_monthly',
                STRIPE_PRICE_PREMIUM_ANNUAL: 'price_premium_annual',
                STRIPE_PRICE_B2B_STARTER: 'price_b2b_starter',
                STRIPE_PRICE_B2B_PRO: 'price_b2b_pro',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPriceId', () => {
    it('should return correct price ID for premium monthly', () => {
      const priceId = service['getPriceId'](Plan.PREMIUM_MONTHLY);
      expect(priceId).toBe('price_premium_monthly');
    });

    it('should throw error for free plan', () => {
      expect(() => service['getPriceId'](Plan.FREE)).toThrow(BadRequestException);
    });
  });
});
