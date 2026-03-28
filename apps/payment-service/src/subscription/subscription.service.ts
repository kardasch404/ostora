import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { StripeService } from '../providers/stripe/stripe.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionResponse } from './dto/subscription.response';
import { Plan, PLAN_FEATURES } from './plan.enum';
import { SubscriptionStatus } from './subscription-status.enum';

@Injectable()
export class SubscriptionService {
  private prisma = new PrismaClient();

  constructor(private stripeService: StripeService) {}

  async createSubscription(
    userId: string,
    dto: CreateSubscriptionDto,
  ): Promise<SubscriptionResponse> {
    if (dto.plan === Plan.FREE) {
      return this.createFreeSubscription(userId);
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      stripeCustomerId = await this.stripeService.createCustomer(
        userId,
        user.email,
        `${user.firstName} ${user.lastName}`,
      );
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    const features = PLAN_FEATURES[dto.plan];
    const trialDays = features.trialDays || 0;

    const stripeSubscription = await this.stripeService.createSubscription(
      stripeCustomerId,
      dto.plan,
      dto.paymentMethodId,
      trialDays,
    );

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        plan: dto.plan,
        status: trialDays > 0 ? SubscriptionStatus.TRIALING : SubscriptionStatus.ACTIVE,
        stripeCustomerId,
        stripeSubscriptionId: stripeSubscription.id,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        trialEnd: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : null,
        cancelAtPeriodEnd: false,
      },
    });

    return this.mapToResponse(subscription);
  }

  async cancelSubscription(userId: string, immediately = false): Promise<SubscriptionResponse> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] } },
    });

    if (!subscription) {
      throw new NotFoundException('Active subscription not found');
    }

    if (subscription.stripeSubscriptionId) {
      await this.stripeService.cancelSubscription(subscription.stripeSubscriptionId, immediately);
    }

    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: immediately ? SubscriptionStatus.CANCELLED : subscription.status,
        cancelAtPeriodEnd: !immediately,
      },
    });

    return this.mapToResponse(updated);
  }

  async updateStatusByStripeId(
    stripeSubscriptionId: string,
    status: SubscriptionStatus,
  ): Promise<void> {
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId },
      data: { status },
    });
  }

  async updateStatusByPayPalId(
    paypalSubscriptionId: string,
    status: SubscriptionStatus,
  ): Promise<void> {
    await this.prisma.subscription.updateMany({
      where: { paypalSubscriptionId },
      data: { status },
    });
  }

  async getUserSubscription(userId: string): Promise<SubscriptionResponse> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return this.createFreeSubscription(userId);
    }

    return this.mapToResponse(subscription);
  }

  private async createFreeSubscription(userId: string): Promise<SubscriptionResponse> {
    const existing = await this.prisma.subscription.findFirst({
      where: { userId, plan: Plan.FREE },
    });

    if (existing) return this.mapToResponse(existing);

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        plan: Plan.FREE,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date('2099-12-31'),
        cancelAtPeriodEnd: false,
      },
    });

    return this.mapToResponse(subscription);
  }

  private mapToResponse(subscription: any): SubscriptionResponse {
    return {
      id: subscription.id,
      userId: subscription.userId,
      plan: subscription.plan,
      status: subscription.status,
      stripeCustomerId: subscription.stripeCustomerId,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      trialEnd: subscription.trialEnd,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }
}
