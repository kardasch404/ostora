import { IsUUID, IsEmail, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendApplicationDto {
  @ApiProperty()
  @IsUUID()
  jobPostId: string;

  @ApiProperty()
  @IsUUID()
  bundleId: string;

  @ApiProperty()
  @IsUUID()
  emailConfigId: string;

  @ApiProperty()
  @IsUUID()
  templateId: string;

  @ApiProperty()
  @IsEmail()
  recipientEmail: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  placeholders?: Record<string, string>;
}
