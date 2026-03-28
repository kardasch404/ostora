import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Plan, PLAN_PRICES } from '../../subscription/plan.enum';
import { Money } from '../../value-objects/money.vo';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-11-20.acacia',
    });
  }

  async createCustomer(userId: string, email: string, name: string): Promise<string> {
    const customer = await this.stripe.customers.create({
      email,
      name,
      metadata: { userId },
    });
    return customer.id;
  }

  async createPaymentIntent(
    customerId: string,
    amount: Money,
    metadata: Record<string, string>,
  ): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.create({
      customer: customerId,
      amount: amount.toUSD().toCents(),
      currency: 'usd',
      metadata,
      automatic_payment_methods: { enabled: true },
    });
  }

  async createSubscription(
    customerId: string,
    plan: Plan,
    paymentMethodId?: string,
    trialDays?: number,
  ): Promise<Stripe.Subscription> {
    const priceId = this.getPriceId(plan);
    
    const subscriptionData: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: priceId }],
      metadata: { plan },
      expand: ['latest_invoice.payment_intent'],
    };

    if (paymentMethodId) {
      subscriptionData.default_payment_method = paymentMethodId;
    }

    if (trialDays) {
      subscriptionData.trial_period_days = trialDays;
    }

    return this.stripe.subscriptions.create(subscriptionData);
  }

  async cancelSubscription(subscriptionId: string, immediately = false): Promise<Stripe.Subscription> {
    if (immediately) {
      return this.stripe.subscriptions.cancel(subscriptionId);
    }
    return this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  async updateSubscription(subscriptionId: string, newPlan: Plan): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    const newPriceId = this.getPriceId(newPlan);

    return this.stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations',
      metadata: { plan: newPlan },
    });
  }

  async attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    await this.stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    await this.stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
  }

  private getPriceId(plan: Plan): string {
    const priceIds = {
      [Plan.PREMIUM_MONTHLY]: this.configService.get('STRIPE_PRICE_PREMIUM_MONTHLY'),
      [Plan.PREMIUM_ANNUAL]: this.configService.get('STRIPE_PRICE_PREMIUM_ANNUAL'),
      [Plan.B2B_STARTER]: this.configService.get('STRIPE_PRICE_B2B_STARTER'),
      [Plan.B2B_PRO]: this.configService.get('STRIPE_PRICE_B2B_PRO'),
    };

    const priceId = priceIds[plan];
    if (!priceId) {
      throw new BadRequestException(`No Stripe price configured for plan: ${plan}`);
    }
    return priceId;
  }
}
