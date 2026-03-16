import { IsEmail, IsString, IsOptional } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  totpCode?: string;

  @IsOptional()
  @IsString()
  deviceName?: string;
}
