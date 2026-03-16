import { IsString, IsUUID } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @IsUUID('4')
  token: string;
}
