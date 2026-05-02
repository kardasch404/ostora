import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export enum CoverLetterLanguage {
  EN = 'en',
  FR = 'fr',
  DE = 'de',
}

export class GenerateCoverLetterDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ example: 'Backend Engineer' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  jobTitle?: string;

  @ApiProperty({ example: 'Comply World GmbH' })
  @IsString()
  @MaxLength(200)
  companyName!: string;

  @ApiProperty({ example: 'We are looking for a backend engineer...' })
  @IsString()
  jobDescription!: string;

  @ApiPropertyOptional({ example: 'CV text or summary' })
  @IsOptional()
  @IsString()
  cvText?: string;

  @ApiPropertyOptional({ enum: CoverLetterLanguage, default: CoverLetterLanguage.EN })
  @IsOptional()
  @IsEnum(CoverLetterLanguage)
  language?: CoverLetterLanguage;

  @ApiPropertyOptional({ example: 'confident' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  tone?: string;

  @ApiPropertyOptional({ example: 'bundle-uuid' })
  @IsOptional()
  @IsString()
  bundleId?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  renderPdf?: boolean;
}
