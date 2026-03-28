import { Controller, Post, Get, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PromoCodeService } from './promo-code.service';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { RedeemPromoCodeDto } from './dto/redeem-promo-code.dto';
import { PromoCodeType, PromoCodeStatus } from './promo-code.enum';
import { Plan } from '../../subscription/plan.enum';

@ApiTags('promo-codes')
@Controller('promo-codes')
@ApiBearerAuth()
export class PromoCodeController {
  constructor(private promoCodeService: PromoCodeService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate promo code (Admin only)' })
  async generatePromoCode(@Req() req: any, @Body() dto: CreatePromoCodeDto) {
    return this.promoCodeService.generatePromoCode(dto, req.user.id);
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Redeem promo code' })
  async redeemPromoCode(@Req() req: any, @Body() dto: RedeemPromoCodeDto) {
    return this.promoCodeService.redeemPromoCode(req.user.id, dto);
  }

  @Get('validate/:code')
  @ApiOperation({ summary: 'Validate promo code' })
  async validatePromoCode(@Param('code') code: string) {
    const isValid = await this.promoCodeService.validatePromoCode(code);
    return { valid: isValid };
  }

  @Get('list')
  @ApiOperation({ summary: 'List promo codes (Admin only)' })
  @ApiQuery({ name: 'type', enum: PromoCodeType, required: false })
  @ApiQuery({ name: 'status', enum: PromoCodeStatus, required: false })
  @ApiQuery({ name: 'plan', enum: Plan, required: false })
  async listPromoCodes(
    @Req() req: any,
    @Query('type') type?: PromoCodeType,
    @Query('status') status?: PromoCodeStatus,
    @Query('plan') plan?: Plan,
  ) {
    return this.promoCodeService.listPromoCodes(req.user.id, { type, status, plan });
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get promo code details (Admin only)' })
  async getPromoCode(@Param('code') code: string) {
    return this.promoCodeService.getPromoCode(code);
  }

  @Get(':code/stats')
  @ApiOperation({ summary: 'Get promo code usage statistics (Admin only)' })
  async getUsageStats(@Param('code') code: string) {
    return this.promoCodeService.getUsageStats(code);
  }

  @Delete(':code')
  @ApiOperation({ summary: 'Deactivate promo code (Admin only)' })
  async deactivatePromoCode(@Req() req: any, @Param('code') code: string) {
    return this.promoCodeService.deactivatePromoCode(code, req.user.id);
  }
}
