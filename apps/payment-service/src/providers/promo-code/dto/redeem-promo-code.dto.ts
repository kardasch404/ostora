import { IsString, Length, Matches } from 'class-validator';

export class RedeemPromoCodeDto {
  @IsString()
  @Length(8, 36)
  @Matches(/^[A-Z0-9-]+$/, { message: 'Invalid promo code format' })
  code!: string;
}
