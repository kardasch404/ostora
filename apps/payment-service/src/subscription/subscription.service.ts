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

type PlanCard = {
  id: Plan;
  name: string;
  priceMad: number;
  cycle: 'forever' | 'month' | 'year';
  badge?: string;
  features: string[];
};

type PaymentDashboard = {
  subscription: SubscriptionResponse;
  status: {
    label: string;
    tone: 'success' | 'warning' | 'danger';
    validUntil: Date;
  };
  paymentDue: {
    amountMad: number;
    dueAt: Date;
  };
  incompleteTransactions: Array<{
    id: string;
    date: Date;
    amount: number;
    currency: string;
    description: string;
    status: string;
    reason: string;
  }>;
  invoices: Array<{
    id: string;
    date: Date;
    amount: number;
    currency: string;
    status: string;
    title: string;
  }>;
  receipts: Array<{
    id: string;
    date: Date;
    amount: number;
    currency: string;
    title: string;
  }>;
};

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

  getAvailablePlans(): PlanCard[] {
    return [
      {
        id: Plan.FREE,
        name: 'Free',
        priceMad: PLAN_PRICES[Plan.FREE].mad,
        cycle: 'forever',
        features: [
          '5 applications/month',
          '1 bundle max',
          '1 email config',
          'Basic job search',
          'No AI features',
          'No networking',
        ],
      },
      {
        id: Plan.PREMIUM_MONTHLY,
        name: 'Premium Monthly',
        priceMad: PLAN_PRICES[Plan.PREMIUM_MONTHLY].mad,
        cycle: 'month',
        badge: '7 days FREE trial',
        features: [
          'Unlimited applications',
          '10 bundles',
          '5 email configs',
          'AI CV analysis',
          'AI cover letter gen',
          'Networking module',
          'Bulk apply',
        ],
      },
      {
        id: Plan.PREMIUM_ANNUAL,
        name: 'Premium Annual',
        priceMad: PLAN_PRICES[Plan.PREMIUM_ANNUAL].mad,
        cycle: 'year',
        badge: 'Save 2 months free',
        features: [
          'Everything in Monthly',
          'Priority AI queue',
          'Advanced analytics',
          'B2B API access',
          'Invoice PDF download',
        ],
      },
      {
        id: Plan.B2B_STARTER,
        name: 'B2B Starter',
        priceMad: PLAN_PRICES[Plan.B2B_STARTER].mad,
        cycle: 'month',
        features: [
          '1000 API calls/day',
          'Company data access',
          'Job market stats',
          'Webhook support',
        ],
      },
      {
        id: Plan.B2B_PRO,
        name: 'B2B Pro',
        priceMad: PLAN_PRICES[Plan.B2B_PRO].mad,
        cycle: 'month',
        features: [
          '10000 API calls/day',
          'RH profile access',
          'Bulk data export',
          'SLA 99.9%',
        ],
      },
    ];
  }

  async getPaymentDashboard(userId: string): Promise<PaymentDashboard> {
    const subscription = await this.getUserSubscription(userId);
    const today = new Date();

    const payments = await this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });

    const incompleteTransactions = payments
      .filter((p: any) => !['SUCCEEDED', 'REFUNDED'].includes(p.status))
      .slice(0, 10)
      .map((p: any) => ({
        id: p.id,
        date: p.createdAt,
        amount: p.amount,
        currency: p.currency,
        description: p.description || `${subscription.plan} subscription`,
        status: p.status,
        reason: p.status === 'PENDING' ? 'Payment initialized' : p.status.toLowerCase(),
      }));

    const invoices = payments.slice(0, 20).map((p: any) => ({
      id: p.id,
      date: p.createdAt,
      amount: p.amount,
      currency: p.currency,
      status: p.status === 'SUCCEEDED' ? 'Paid' : 'Unpaid',
      title: `Invoice ${subscription.plan} #${p.id.slice(0, 8)}`,
    }));

    const receipts = payments
      .filter((p: any) => p.status === 'SUCCEEDED')
      .slice(0, 20)
      .map((p: any) => ({
        id: p.id,
        date: p.createdAt,
        amount: p.amount,
        currency: p.currency,
        title: `Receipt ${subscription.plan} #${p.id.slice(0, 8)}`,
      }));

    const validUntil = subscription.currentPeriodEnd || new Date('2099-12-31');
    const tone =
      subscription.status === SubscriptionStatus.ACTIVE ||
      subscription.status === SubscriptionStatus.TRIALING
        ? 'success'
        : subscription.status === SubscriptionStatus.PAST_DUE
          ? 'warning'
          : 'danger';

    return {
      subscription,
      status: {
        label:
          tone === 'success'
            ? 'Active'
            : tone === 'warning'
              ? 'Past due'
              : 'Inactive',
        tone,
        validUntil,
      },
      paymentDue: {
        amountMad: PLAN_PRICES[subscription.plan].mad,
        dueAt: validUntil > today ? validUntil : today,
      },
      incompleteTransactions,
      invoices,
      receipts,
    };
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
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
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
