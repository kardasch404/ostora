import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export enum CoverLetterLang {
  FR = 'fr',
  DE = 'de',
  EN = 'en',
}

export enum CoverLetterMode {
  TEMPLATE_ONLY = 'template-only',
  AI_ASSISTED = 'ai-assisted',
}

export class GenerateCoverLetterDto {
  @ApiProperty({ enum: CoverLetterMode, default: CoverLetterMode.TEMPLATE_ONLY })
  @IsEnum(CoverLetterMode)
  mode!: CoverLetterMode;

  @ApiProperty({ enum: CoverLetterLang, example: CoverLetterLang.DE })
  @IsEnum(CoverLetterLang)
  lang!: CoverLetterLang;

  @ApiProperty({ example: '38c269a8-629d-4aa3-888d-bbe70a09b24b' })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ example: 'Backend Engineer' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobTitle?: string;

  @ApiPropertyOptional({ example: 'Comply World' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  companyName?: string;

  @ApiPropertyOptional({ example: 'confident' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  tone?: string;

  @ApiPropertyOptional({ example: 'bundle-uuid' })
  @IsOptional()
  @IsString()
  bundleId?: string;

  @ApiPropertyOptional({ example: 'Optional custom body text.' })
  @IsOptional()
  @IsString()
  customText?: string;
}
