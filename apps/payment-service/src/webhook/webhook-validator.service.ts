import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class WebhookValidatorService {
  constructor(private configService: ConfigService) {}

  validateStripeSignature(payload: Buffer, signature: string): Stripe.Event {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!secretKey || !webhookSecret) {
      throw new UnauthorizedException('Stripe webhook secrets are not configured');
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });

    try {
      return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown webhook verification error';
      throw new UnauthorizedException(`Webhook signature verification failed: ${message}`);
    }
  }
}
