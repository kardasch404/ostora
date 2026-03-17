import { IsString, IsUUID } from 'class-validator';

export class VerifyEmailChangeDto {
  @IsString()
  @IsUUID('4')
  token: string;
}
