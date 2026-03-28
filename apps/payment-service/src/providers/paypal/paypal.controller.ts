import { Controller, Post, Body, Req, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PayPalService } from './paypal.service';
import { CreatePayPalOrderDto } from './dto/create-paypal-order.dto';
import { CreatePayPalSubscriptionDto } from './dto/create-paypal-subscription.dto';

@ApiTags('paypal')
@Controller('paypal')
export class PayPalController {
  constructor(private paypalService: PayPalService) {}

  @Post('orders')
  @ApiOperation({ summary: 'Create PayPal order for one-time payment' })
  async createOrder(@Req() req: any, @Body() dto: CreatePayPalOrderDto) {
    const order = await this.paypalService.createOrder(
      req.user.id,
      dto.plan,
      dto.returnUrl,
      dto.cancelUrl,
    );

    const approveLink = order.links.find((link) => link.rel === 'approve');

    return {
      orderId: order.id,
      approveUrl: approveLink?.href,
      status: order.status,
    };
  }

  @Post('orders/:orderId/capture')
  @ApiOperation({ summary: 'Capture PayPal order after user approval' })
  async captureOrder(@Param('orderId') orderId: string) {
    const result = await this.paypalService.captureOrder(orderId);
    return {
      orderId: result.id,
      status: result.status,
      captureId: result.purchase_units?.[0]?.payments?.captures?.[0]?.id,
    };
  }

  @Post('subscriptions')
  @ApiOperation({ summary: 'Create PayPal subscription' })
  async createSubscription(@Req() req: any, @Body() dto: CreatePayPalSubscriptionDto) {
    const subscription = await this.paypalService.createSubscription(
      req.user.id,
      dto.plan,
      dto.returnUrl,
      dto.cancelUrl,
    );

    const approveLink = subscription.links?.find((link: any) => link.rel === 'approve');

    return {
      subscriptionId: subscription.id,
      approveUrl: approveLink?.href,
      status: subscription.status,
    };
  }

  @Get('subscriptions/:subscriptionId')
  @ApiOperation({ summary: 'Get PayPal subscription details' })
  async getSubscription(@Param('subscriptionId') subscriptionId: string) {
    return this.paypalService.getSubscription(subscriptionId);
  }
}
