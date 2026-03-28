import { Injectable, Logger } from '@nestjs/common';
import { SubscriptionService } from '../../subscription/subscription.service';
import { SubscriptionStatus } from '../../subscription/subscription-status.enum';

@Injectable()
export class PayPalEventHandler {
  private readonly logger = new Logger(PayPalEventHandler.name);

  constructor(private subscriptionService: SubscriptionService) {}

  async handleEvent(event: any): Promise<void> {
    const eventType = event.event_type;

    this.logger.log(`Processing PayPal event: ${eventType}`);

    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await this.handlePaymentCaptureCompleted(event);
        break;

      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await this.handleSubscriptionActivated(event);
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await this.handleSubscriptionCancelled(event);
        break;

      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await this.handleSubscriptionSuspended(event);
        break;

      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await this.handleSubscriptionExpired(event);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REFUNDED':
        await this.handlePaymentFailed(event);
        break;

      default:
        this.logger.warn(`Unhandled PayPal event type: ${eventType}`);
    }
  }

  private async handlePaymentCaptureCompleted(event: any): Promise<void> {
    const resource = event.resource;
    const customId = resource.custom_id || resource.purchase_units?.[0]?.custom_id;

    this.logger.log(`Payment captured for user: ${customId}, amount: ${resource.amount?.value}`);
  }

  private async handleSubscriptionActivated(event: any): Promise<void> {
    const subscription = event.resource;
    const userId = subscription.custom_id;

    this.logger.log(`Subscription activated for user: ${userId}`);

    await this.subscriptionService.updateStatusByPayPalId(
      subscription.id,
      SubscriptionStatus.ACTIVE,
    );
  }

  private async handleSubscriptionCancelled(event: any): Promise<void> {
    const subscription = event.resource;
    const userId = subscription.custom_id;

    this.logger.log(`Subscription cancelled for user: ${userId}`);

    await this.subscriptionService.updateStatusByPayPalId(
      subscription.id,
      SubscriptionStatus.CANCELLED,
    );
  }

  private async handleSubscriptionSuspended(event: any): Promise<void> {
    const subscription = event.resource;
    const userId = subscription.custom_id;

    this.logger.log(`Subscription suspended for user: ${userId}`);

    await this.subscriptionService.updateStatusByPayPalId(
      subscription.id,
      SubscriptionStatus.PAST_DUE,
    );
  }

  private async handleSubscriptionExpired(event: any): Promise<void> {
    const subscription = event.resource;
    const userId = subscription.custom_id;

    this.logger.log(`Subscription expired for user: ${userId}`);

    await this.subscriptionService.updateStatusByPayPalId(
      subscription.id,
      SubscriptionStatus.CANCELLED,
    );
  }

  private async handlePaymentFailed(event: any): Promise<void> {
    const resource = event.resource;
    const customId = resource.custom_id;

    this.logger.error(`Payment failed for user: ${customId}`);
  }
}
