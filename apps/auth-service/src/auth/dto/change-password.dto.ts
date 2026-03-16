import { IsString, MinLength, Matches } from 'class-validator';
import { Match } from '../decorators/match.decorator';

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, {
    message: 'Password must contain uppercase, lowercase, number, and special character',
  })
  newPassword: string;

  @IsString()
  @Match('newPassword', { message: 'Passwords do not match' })
  confirmPassword: string;
}
