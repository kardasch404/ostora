import { IsEmail, IsString } from 'class-validator';

export class ChangeEmailDto {
  @IsEmail({}, { message: 'Invalid email format' })
  newEmail: string;

  @IsString()
  password: string;
}
