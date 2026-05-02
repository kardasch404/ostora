import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum CvLang {
  FR = 'fr',
  DE = 'de',
  EN = 'en',
}

export class GenerateCvDto {
  @ApiProperty({ example: 'modern-cv' })
  @IsString()
  templateId!: string;

  @ApiProperty({ enum: CvLang, example: CvLang.DE })
  @IsEnum(CvLang)
  lang!: CvLang;

  @ApiProperty({ example: '38c269a8-629d-4aa3-888d-bbe70a09b24b' })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ example: 'bundle-uuid' })
  @IsOptional()
  @IsString()
  bundleId?: string;
}
