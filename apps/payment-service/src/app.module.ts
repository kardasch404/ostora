import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionController } from './subscription/subscription.controller';
import { SubscriptionService } from './subscription/subscription.service';
import { StripeService } from './providers/stripe/stripe.service';
import { StripeWebhookController } from './providers/stripe/stripe-webhook.controller';
import { StripeEventHandler } from './providers/stripe/stripe-event-handler';
import { WebhookValidatorService } from './webhook/webhook-validator.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [SubscriptionController, StripeWebhookController],
  providers: [
    SubscriptionService,
    StripeService,
    StripeEventHandler,
    WebhookValidatorService,
  ],
  exports: [SubscriptionService],
})
export class AppModule {}
