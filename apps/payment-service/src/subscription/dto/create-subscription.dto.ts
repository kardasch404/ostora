import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Plan } from '../plan.enum';

export class CreateSubscriptionDto {
  @IsEnum(Plan)
  plan!: Plan;

  @IsString()
  @IsOptional()
  promoCode?: string;

  @IsString()
  @IsOptional()
  paymentMethodId?: string;
}
