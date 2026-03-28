import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { Plan } from '../../subscription/plan.enum';
import { Money } from '../../value-objects/money.vo';

describe('StripeService', () => {
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
                STRIPE_SECRET_KEY: 'sk_test_mock',
                STRIPE_PRICE_PREMIUM_MONTHLY: 'price_mock_monthly',
                STRIPE_PRICE_PREMIUM_ANNUAL: 'price_mock_annual',
                STRIPE_PRICE_B2B_STARTER: 'price_mock_starter',
                STRIPE_PRICE_B2B_PRO: 'price_mock_pro',
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

  describe('Money Value Object', () => {
    it('should convert MAD to USD', () => {
      const money = new Money(49, 'MAD');
      const usd = money.toUSD();
      expect(usd.amount).toBe(5);
      expect(usd.currency).toBe('USD');
    });

    it('should convert to cents', () => {
      const money = new Money(49, 'MAD');
      expect(money.toCents()).toBe(4900);
    });

    it('should throw error for negative amount', () => {
      expect(() => new Money(-10, 'USD')).toThrow('Amount cannot be negative');
    });
  });
});
