import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionService } from '../../src/subscription/subscription.service';
import { StripeService } from '../../src/providers/stripe/stripe.service';
import { Plan } from '../../src/subscription/plan.enum';
import { SubscriptionStatus } from '../../src/subscription/subscription-status.enum';
import { PrismaClient } from '@prisma/client';

describe('Subscription Service Integration Tests', () => {
  let subscriptionService: SubscriptionService;
  let prisma: PrismaClient;
  let testUserId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env',
        }),
      ],
      providers: [SubscriptionService, StripeService],
    }).compile();

    subscriptionService = module.get<SubscriptionService>(SubscriptionService);
    prisma = new PrismaClient();

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@ostora.com`,
        firstName: 'Test',
        lastName: 'User',
        password: 'hashed_password',
      },
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.subscription.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  describe('Free Subscription', () => {
    it('should create free subscription', async () => {
      const subscription = await subscriptionService.createSubscription(testUserId, {
        plan: Plan.FREE,
      });

      expect(subscription).toBeDefined();
      expect(subscription.plan).toBe(Plan.FREE);
      expect(subscription.status).toBe(SubscriptionStatus.ACTIVE);
      expect(subscription.stripeCustomerId).toBeNull();
    });

    it('should get user subscription', async () => {
      const subscription = await subscriptionService.getUserSubscription(testUserId);

      expect(subscription).toBeDefined();
      expect(subscription.userId).toBe(testUserId);
    });
  });

  describe('Premium Subscription', () => {
    it('should create premium subscription with trial', async () => {
      const subscription = await subscriptionService.createSubscription(testUserId, {
        plan: Plan.PREMIUM_MONTHLY,
      });

      expect(subscription).toBeDefined();
      expect(subscription.plan).toBe(Plan.PREMIUM_MONTHLY);
      expect(subscription.status).toBe(SubscriptionStatus.TRIALING);
      expect(subscription.trialEnd).toBeDefined();
      expect(subscription.stripeCustomerId).toBeDefined();
      expect(subscription.stripeSubscriptionId).toBeDefined();
    });
  });

  describe('Subscription Cancellation', () => {
    it('should cancel subscription at period end', async () => {
      const cancelled = await subscriptionService.cancelSubscription(testUserId, false);

      expect(cancelled).toBeDefined();
      expect(cancelled.cancelAtPeriodEnd).toBe(true);
    });

    it('should cancel subscription immediately', async () => {
      const cancelled = await subscriptionService.cancelSubscription(testUserId, true);

      expect(cancelled).toBeDefined();
      expect(cancelled.status).toBe(SubscriptionStatus.CANCELLED);
    });
  });
});
