import { IsEnum, IsUrl } from 'class-validator';
import { Plan } from '../../../subscription/plan.enum';

export class CreatePayPalSubscriptionDto {
  @IsEnum(Plan)
  plan: Plan;

  @IsUrl()
  returnUrl: string;

  @IsUrl()
  cancelUrl: string;
}
