import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { StripeService } from '../providers/stripe/stripe.service';
import { PayPalService } from '../providers/paypal/paypal.service';
import { PromoCodeService } from '../providers/promo-code/promo-code.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CheckoutDto, PaymentProvider } from './dto/checkout.dto';
import { SubscriptionResponse } from './dto/subscription.response';
import { Plan, PLAN_FEATURES, PLAN_PRICES } from './plan.enum';
import { SubscriptionStatus } from './subscription-status.enum';
import { Money } from '../value-objects/money.vo';

@Injectable()
export class SubscriptionService {
  private prisma = new PrismaClient() as any;

  constructor(
    private stripeService: StripeService,
    private paypalService: PayPalService,
    private promoCodeService: PromoCodeService,
  ) {}

  async checkout(userId: string, dto: CheckoutDto): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    let discount = 0;
    let promoCode = null;

    // Apply promo code if provided
    if (dto.promoCode) {
      promoCode = await this.promoCodeService.getPromoCode(dto.promoCode);
      // Calculate discount (simplified - extend based on your needs)
      discount = 0; // TODO: Implement discount logic
    }

    void promoCode;

    const planPrice = PLAN_PRICES[dto.plan];
    const finalAmount = new Money(planPrice.mad - discount, 'MAD');

    // Handle different payment providers
    switch (dto.provider) {
      case PaymentProvider.STRIPE:
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

        const paymentIntent = await this.stripeService.createPaymentIntent(
          stripeCustomerId,
          finalAmount,
          { plan: dto.plan, userId },
        );

        return {
          provider: 'STRIPE',
          clientSecret: paymentIntent.client_secret,
          amount: finalAmount.toMAD().amount,
        };

      case PaymentProvider.PAYPAL:
        const order = await this.paypalService.createOrder(
          userId,
          dto.plan,
          dto.returnUrl || 'https://ostora.com/success',
          dto.cancelUrl || 'https://ostora.com/cancel',
        );

        const approveLink = order.links.find(link => link.rel === 'approve');

        return {
          provider: 'PAYPAL',
          orderId: order.id,
          approvalUrl: approveLink?.href,
        };

      case PaymentProvider.PROMO_CODE:
        if (!dto.promoCode) {
          throw new BadRequestException('Promo code required for this payment method');
        }

        const redemption = await this.promoCodeService.redeemPromoCode(userId, {
          code: dto.promoCode,
        });

        return {
          provider: 'PROMO_CODE',
          success: true,
          subscription: redemption.subscription,
        };

      default:
        throw new BadRequestException('Invalid payment provider');
    }
  }

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

    const features = PLAN_FEATURES[dto.plan] as { trialDays?: number };
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
