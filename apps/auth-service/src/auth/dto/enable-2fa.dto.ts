import { IsString, Length } from 'class-validator';

export class Enable2FaDto {
  @IsString()
  @Length(6, 6, { message: 'OTP must be 6 digits' })
  code: string;
}
