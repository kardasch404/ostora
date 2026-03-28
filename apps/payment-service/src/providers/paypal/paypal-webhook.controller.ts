import { Controller, Post, Headers, Body, Logger } from '@nestjs/common';
import { PayPalEventHandler } from './paypal-event-handler';
import { PayPalService } from './paypal.service';

@Controller('webhooks/paypal')
export class PayPalWebhookController {
  private readonly logger = new Logger(PayPalWebhookController.name);

  constructor(
    private paypalService: PayPalService,
    private eventHandler: PayPalEventHandler,
  ) {}

  @Post()
  async handleWebhook(
    @Headers('paypal-transmission-id') transmissionId: string,
    @Headers('paypal-transmission-time') transmissionTime: string,
    @Headers('paypal-transmission-sig') transmissionSig: string,
    @Headers('paypal-cert-url') certUrl: string,
    @Headers('paypal-auth-algo') authAlgo: string,
    @Body() event: any,
  ) {
    this.logger.log(`Received PayPal webhook: ${event.event_type}`);

    // Validate webhook signature
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    const isValid = this.paypalService.validateWebhookSignature(
      webhookId,
      transmissionId,
      transmissionTime,
      certUrl,
      transmissionSig,
      event,
    );

    if (!isValid) {
      this.logger.error('Invalid PayPal webhook signature');
      return { received: false, error: 'Invalid signature' };
    }

    // Handle event
    await this.eventHandler.handleEvent(event);

    return { received: true };
  }
}
