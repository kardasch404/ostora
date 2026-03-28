import { Controller, Post, Headers, RawBodyRequest, Req, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { WebhookValidatorService } from '../../webhook/webhook-validator.service';
import { StripeEventHandler } from './stripe-event-handler';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(
    private webhookValidator: WebhookValidatorService,
    private eventHandler: StripeEventHandler,
  ) {}

  @Post()
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    if (!req.rawBody) {
      throw new UnauthorizedException('Missing raw request body for Stripe webhook verification');
    }

    const event = this.webhookValidator.validateStripeSignature(req.rawBody, signature);
    await this.eventHandler.handleEvent(event);
    return { received: true };
  }
}
