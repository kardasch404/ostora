import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { SubscriptionService } from '../../subscription/subscription.service';
import { SubscriptionStatus } from '../../subscription/subscription-status.enum';

@Injectable()
export class StripeEventHandler {
  private readonly logger = new Logger(StripeEventHandler.name);

  constructor(private subscriptionService: SubscriptionService) {}

  async handleEvent(event: Stripe.Event): Promise<void> {
    this.logger.log(`Processing Stripe event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.trial_will_end':
        await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      default:
        this.logger.warn(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    this.logger.log(`Payment succeeded: ${paymentIntent.id}`);
    // Handle one-time payment success
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const subscriptionId = invoice.subscription as string;
    if (subscriptionId) {
      await this.subscriptionService.updateStatusByStripeId(subscriptionId, SubscriptionStatus.ACTIVE);
      this.logger.log(`Subscription ${subscriptionId} activated`);
    }
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const subscriptionId = invoice.subscription as string;
    if (subscriptionId) {
      await this.subscriptionService.updateStatusByStripeId(subscriptionId, SubscriptionStatus.PAST_DUE);
      this.logger.warn(`Subscription ${subscriptionId} payment failed`);
    }
  }

  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Subscription created: ${subscription.id}`);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const status = this.mapStripeStatus(subscription.status);
    await this.subscriptionService.updateStatusByStripeId(subscription.id, status);
    this.logger.log(`Subscription ${subscription.id} updated to ${status}`);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    await this.subscriptionService.updateStatusByStripeId(subscription.id, SubscriptionStatus.CANCELLED);
    this.logger.log(`Subscription ${subscription.id} cancelled`);
  }

  private async handleTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Trial ending soon for subscription: ${subscription.id}`);
    // Send notification via Kafka to notification-service
  }

  private mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
    const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
      trialing: SubscriptionStatus.TRIALING,
      active: SubscriptionStatus.ACTIVE,
      past_due: SubscriptionStatus.PAST_DUE,
      canceled: SubscriptionStatus.CANCELLED,
      unpaid: SubscriptionStatus.PAST_DUE,
      incomplete: SubscriptionStatus.PAST_DUE,
      incomplete_expired: SubscriptionStatus.EXPIRED,
      paused: SubscriptionStatus.CANCELLED,
    };
    return statusMap[stripeStatus] || SubscriptionStatus.EXPIRED;
  }
}
