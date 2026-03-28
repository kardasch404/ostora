import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from '../../src/providers/stripe/stripe.service';
import { Plan } from '../../src/subscription/plan.enum';
import { Money } from '../../src/value-objects/money.vo';

describe('Stripe Integration Tests', () => {
  let stripeService: StripeService;
  let testCustomerId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env',
        }),
      ],
      providers: [StripeService],
    }).compile();

    stripeService = module.get<StripeService>(StripeService);
  });

  describe('Customer Management', () => {
    it('should create a Stripe customer', async () => {
      const customer = await stripeService.createCustomer(
        'test-user-123',
        'test@ostora.com',
        'Test User',
      );

      expect(customer).toBeDefined();
      expect(customer).toMatch(/^cus_/);
      testCustomerId = customer;
    });
  });

  describe('Payment Intent', () => {
    it('should create a payment intent', async () => {
      const amount = new Money(5000, 'USD');
      const paymentIntent = await stripeService.createPaymentIntent(
        testCustomerId,
        amount,
        { orderId: 'test-order-123' },
      );

      expect(paymentIntent).toBeDefined();
      expect(paymentIntent.amount).toBe(5000);
      expect(paymentIntent.currency).toBe('usd');
      expect(paymentIntent.customer).toBe(testCustomerId);
    });
  });

  describe('Subscription Management', () => {
    it('should create a subscription with trial', async () => {
      const subscription = await stripeService.createSubscription(
        testCustomerId,
        Plan.PREMIUM_MONTHLY,
        undefined,
        7,
      );

      expect(subscription).toBeDefined();
      expect(subscription.customer).toBe(testCustomerId);
      expect(subscription.status).toBe('trialing');
      expect(subscription.trial_end).toBeDefined();
    });

    it('should cancel subscription at period end', async () => {
      const subscription = await stripeService.createSubscription(
        testCustomerId,
        Plan.PREMIUM_MONTHLY,
      );

      const cancelled = await stripeService.cancelSubscription(subscription.id, false);

      expect(cancelled.cancel_at_period_end).toBe(true);
    });

    it('should cancel subscription immediately', async () => {
      const subscription = await stripeService.createSubscription(
        testCustomerId,
        Plan.PREMIUM_MONTHLY,
      );

      const cancelled = await stripeService.cancelSubscription(subscription.id, true);

      expect(cancelled.status).toBe('canceled');
    });
  });
});
