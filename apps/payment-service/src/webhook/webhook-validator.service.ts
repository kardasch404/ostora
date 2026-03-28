import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class WebhookValidatorService {
  constructor(private configService: ConfigService) {}

  validateStripeSignature(payload: Buffer, signature: string): Stripe.Event {
    const stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-11-20.acacia',
    });

    try {
      return stripe.webhooks.constructEvent(
        payload,
        signature,
        this.configService.get('STRIPE_WEBHOOK_SECRET'),
      );
    } catch (err) {
      throw new UnauthorizedException(`Webhook signature verification failed: ${err.message}`);
    }
  }
}
