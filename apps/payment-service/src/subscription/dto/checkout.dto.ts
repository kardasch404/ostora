import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { Plan } from '../plan.enum';

export enum PaymentProvider {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  PROMO_CODE = 'PROMO_CODE',
}

export class CheckoutDto {
  @IsEnum(Plan)
  plan: Plan;

  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @IsString()
  @IsOptional()
  promoCode?: string;

  @IsString()
  @IsOptional()
  paymentMethodId?: string;

  @IsUrl()
  @IsOptional()
  returnUrl?: string;

  @IsUrl()
  @IsOptional()
  cancelUrl?: string;
}
