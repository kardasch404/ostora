import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
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
import { PromoCodeController } from './providers/promo-code/promo-code.controller';
import { PromoCodeService } from './providers/promo-code/promo-code.service';
import { TrialService } from './trial/trial.service';
import { TrialExpiryCron } from './trial/trial-expiry.cron';
import { InvoiceController } from './invoice/invoice.controller';
import { InvoiceService } from './invoice/invoice.service';
import { InvoicePdfService } from './invoice/invoice-pdf.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [
    HealthController,
    SubscriptionController,
    StripeWebhookController,
    PayPalController,
    PayPalWebhookController,
    PromoCodeController,
    InvoiceController,
  ],
  providers: [
    SubscriptionService,
    StripeService,
    StripeEventHandler,
    WebhookValidatorService,
    PayPalService,
    PayPalEventHandler,
    PromoCodeService,
    TrialService,
    TrialExpiryCron,
    InvoiceService,
    InvoicePdfService,
  ],
  exports: [SubscriptionService],
})
export class AppModule {}
