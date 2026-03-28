import { Controller, Post, Get, Delete, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { SubscriptionResponse } from './dto/subscription.response';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Unified checkout for all payment methods' })
  async checkout(@Req() req: any, @Body() dto: CheckoutDto) {
    return this.subscriptionService.checkout(req.user.id, dto);
  }

  @Post()
  @ApiOperation({ summary: 'Create or upgrade subscription' })
  async createSubscription(
    @Req() req: any,
    @Body() dto: CreateSubscriptionDto,
  ): Promise<SubscriptionResponse> {
    return this.subscriptionService.createSubscription(req.user.id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user subscription' })
  async getMySubscription(@Req() req: any): Promise<SubscriptionResponse> {
    return this.subscriptionService.getUserSubscription(req.user.id);
  }

  @Delete()
  @ApiOperation({ summary: 'Cancel subscription' })
  async cancelSubscription(@Req() req: any): Promise<SubscriptionResponse> {
    return this.subscriptionService.cancelSubscription(req.user.id);
  }
}
