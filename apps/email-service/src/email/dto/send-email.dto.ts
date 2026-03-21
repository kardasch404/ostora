import { IsEmail, IsString, IsOptional, IsObject, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiPropertyOptional({
    description: 'Optional SMTP override for user-specific sender account',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  smtpConfig?: {
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    smtpUser: string;
    smtpPassword: string;
    fromEmail?: string;
    fromName?: string;
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  from?: string;

  @ApiProperty()
  @IsEmail()
  to: string;

  @ApiProperty()
  @IsString()
  subject: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plainText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  placeholders?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  attachments?: string[];
}
