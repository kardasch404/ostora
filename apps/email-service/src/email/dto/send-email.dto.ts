import { IsEmail, IsString, IsOptional, IsObject, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendEmailDto {
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
