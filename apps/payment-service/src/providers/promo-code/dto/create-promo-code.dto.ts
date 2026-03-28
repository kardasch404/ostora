import { IsEnum, IsInt, IsOptional, IsString, Min, Max, IsDateString } from 'class-validator';
import { Plan } from '../../../subscription/plan.enum';
import { PromoCodeType } from '../promo-code.enum';

export class CreatePromoCodeDto {
  @IsEnum(Plan)
  plan: Plan;

  @IsInt()
  @Min(1)
  @Max(365)
  durationDays: number;

  @IsEnum(PromoCodeType)
  type: PromoCodeType;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxUses?: number;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  customCode?: string;
}
