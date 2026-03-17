import { IsUUID, IsEmail, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplyDto {
  @ApiProperty({ description: 'Bundle ID containing CV and documents' })
  @IsUUID()
  bundleId: string;

  @ApiProperty({ description: 'Email configuration ID for SMTP' })
  @IsUUID()
  emailConfigId: string;

  @ApiProperty({ description: 'Message template ID' })
  @IsUUID()
  templateId: string;

  @ApiProperty({ description: 'Recipient email (HR/Company)' })
  @IsEmail()
  recipientEmail: string;

  @ApiPropertyOptional({ description: 'Custom placeholders for template' })
  @IsOptional()
  @IsObject()
  placeholders?: Record<string, string>;
}
