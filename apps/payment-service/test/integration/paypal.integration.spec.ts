import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PayPalService } from '../../src/providers/paypal/paypal.service';
import { Plan } from '../../src/subscription/plan.enum';

describe('PayPal Integration Tests', () => {
  let paypalService: PayPalService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env',
        }),
      ],
      providers: [PayPalService],
    }).compile();

    paypalService = module.get<PayPalService>(PayPalService);
  });

  describe('Order Management', () => {
    it('should create a PayPal order', async () => {
      const order = await paypalService.createOrder(
        'test-user-123',
        Plan.PREMIUM_MONTHLY,
        'https://ostora.com/success',
        'https://ostora.com/cancel',
      );

      expect(order).toBeDefined();
      expect(order.id).toBeDefined();
      expect(order.status).toBe('CREATED');
      expect(order.links).toBeDefined();
      
      const approveLink = order.links.find(link => link.rel === 'approve');
      expect(approveLink).toBeDefined();
    });
  });

  describe('Subscription Management', () => {
    it('should create a PayPal subscription', async () => {
      const subscription = await paypalService.createSubscription(
        'test-user-123',
        Plan.PREMIUM_MONTHLY,
        'https://ostora.com/success',
        'https://ostora.com/cancel',
      );

      expect(subscription).toBeDefined();
      expect(subscription.id).toBeDefined();
      expect(subscription.status).toBeDefined();
    });
  });
});
