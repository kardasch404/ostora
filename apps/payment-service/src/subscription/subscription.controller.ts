import { Controller, Post, Get, Delete, Body, Req, Headers, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { SubscriptionResponse } from './dto/subscription.response';

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) {}

  private resolveUserId(req: any, authorization?: string): string {
    if (req?.user?.id) return req.user.id;
    if (!authorization) {
      throw new BadRequestException('Missing authenticated user context');
    }

    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new BadRequestException('Invalid authorization header');
    }

    try {
      const payloadRaw = token.split('.')[1];
      const payloadJson = Buffer.from(payloadRaw, 'base64url').toString('utf-8');
      const payload = JSON.parse(payloadJson) as Record<string, string>;
      const userId = payload['userId'] || payload['sub'] || payload['id'];
      if (!userId) {
        throw new BadRequestException('User id missing from token');
      }
      return userId;
    } catch {
      throw new BadRequestException('Failed to parse auth token');
    }
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get subscription plans and features' })
  async getPlans() {
    return this.subscriptionService.getAvailablePlans();
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get payment dashboard data for current user' })
  async getPaymentDashboard(
    @Req() req: any,
    @Headers('authorization') authorization?: string,
  ) {
    const userId = this.resolveUserId(req, authorization);
    return this.subscriptionService.getPaymentDashboard(userId);
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Unified checkout for all payment methods' })
  async checkout(
    @Req() req: any,
    @Body() dto: CheckoutDto,
    @Headers('authorization') authorization?: string,
  ) {
    const userId = this.resolveUserId(req, authorization);
    return this.subscriptionService.checkout(userId, dto);
  }

  @Post()
  @ApiOperation({ summary: 'Create or upgrade subscription' })
  async createSubscription(
    @Req() req: any,
    @Body() dto: CreateSubscriptionDto,
    @Headers('authorization') authorization?: string,
  ): Promise<SubscriptionResponse> {
    const userId = this.resolveUserId(req, authorization);
    return this.subscriptionService.createSubscription(userId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user subscription' })
  async getMySubscription(
    @Req() req: any,
    @Headers('authorization') authorization?: string,
  ): Promise<SubscriptionResponse> {
    const userId = this.resolveUserId(req, authorization);
    return this.subscriptionService.getUserSubscription(userId);
  }

  @Delete()
  @ApiOperation({ summary: 'Cancel subscription' })
  async cancelSubscription(
    @Req() req: any,
    @Headers('authorization') authorization?: string,
  ): Promise<SubscriptionResponse> {
    const userId = this.resolveUserId(req, authorization);
    return this.subscriptionService.cancelSubscription(userId);
  }
}
