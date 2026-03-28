import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { SubscriptionStatus } from '../subscription/subscription-status.enum';
import { Plan } from '../subscription/plan.enum';

@Injectable()
export class TrialService {
  private prisma = new PrismaClient();
  private readonly TRIAL_DAYS = 7;

  async canStartTrial(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return false;
    }

    // Check if user has already used trial
    if (user.hasUsedTrial) {
      return false;
    }

    // Check if user has any previous premium subscriptions
    const previousSubscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        plan: {
          in: [Plan.PREMIUM_MONTHLY, Plan.PREMIUM_ANNUAL],
        },
      },
    });

    return !previousSubscription;
  }

  async startTrial(userId: string, plan: Plan): Promise<any> {
    const canStart = await this.canStartTrial(userId);

    if (!canStart) {
      throw new BadRequestException('User has already used their free trial');
    }

    if (plan !== Plan.PREMIUM_MONTHLY && plan !== Plan.PREMIUM_ANNUAL) {
      throw new BadRequestException('Trial only available for Premium plans');
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + this.TRIAL_DAYS * 24 * 60 * 60 * 1000);

    // Create trial subscription
    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        plan,
        status: SubscriptionStatus.TRIALING,
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        trialEnd,
        cancelAtPeriodEnd: false,
      },
    });

    // Mark user as having used trial
    await this.prisma.user.update({
      where: { id: userId },
      data: { hasUsedTrial: true },
    });

    return subscription;
  }

  async checkExpiredTrials(): Promise<void> {
    const now = new Date();

    // Find all expired trials
    const expiredTrials = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.TRIALING,
        trialEnd: {
          lte: now,
        },
      },
      include: {
        user: true,
      },
    });

    for (const subscription of expiredTrials) {
      // Check if user has payment method
      const hasPaymentMethod = subscription.stripeCustomerId || subscription.paypalSubscriptionId;

      if (hasPaymentMethod) {
        // Attempt to charge and activate
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: SubscriptionStatus.ACTIVE,
            currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      } else {
        // Downgrade to free
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: SubscriptionStatus.CANCELLED,
          },
        });

        // Create free subscription
        await this.prisma.subscription.create({
          data: {
            userId: subscription.userId,
            plan: Plan.FREE,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: now,
            currentPeriodEnd: new Date('2099-12-31'),
            cancelAtPeriodEnd: false,
          },
        });
      }
    }
  }

  async getTrialStatus(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const trialSubscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.TRIALING,
      },
    });

    return {
      hasUsedTrial: user?.hasUsedTrial || false,
      canStartTrial: await this.canStartTrial(userId),
      activeTrial: trialSubscription ? {
        plan: trialSubscription.plan,
        trialEnd: trialSubscription.trialEnd,
        daysRemaining: Math.ceil(
          (new Date(trialSubscription.trialEnd).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
        ),
      } : null,
    };
  }
}
