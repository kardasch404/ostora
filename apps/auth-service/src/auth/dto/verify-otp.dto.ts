import { IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Length(6, 6, { message: 'OTP must be 6 digits' })
  code: string;
}
