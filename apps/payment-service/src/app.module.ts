import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionController } from './subscription/subscription.controller';
import { SubscriptionService } from './subscription/subscription.service';
import { StripeService } from './providers/stripe/stripe.service';
import { StripeWebhookController } from './providers/stripe/stripe-webhook.controller';
import { StripeEventHandler } from './providers/stripe/stripe-event-handler';
import { WebhookValidatorService } from './webhook/webhook-validator.service';
import { HealthController } from './health.controller';
import { PayPalService } from './providers/paypal/paypal.service';
import { PayPalController } from './providers/paypal/paypal.controller';
import { PayPalWebhookController } from './providers/paypal/paypal-webhook.controller';
import { PayPalEventHandler } from './providers/paypal/paypal-event-handler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [
    HealthController,
    SubscriptionController,
    StripeWebhookController,
    PayPalController,
    PayPalWebhookController,
  ],
  providers: [
    SubscriptionService,
    StripeService,
    StripeEventHandler,
    WebhookValidatorService,
    PayPalService,
    PayPalEventHandler,
  ],
  exports: [SubscriptionService],
})
export class AppModule {}
