import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { CvService } from './cv.service';
import { CvGenerationResponse } from './dto/cv-generation.response';

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

@ApiTags('OstorCV')
@Controller('ostoracv')
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Post('generate-cv')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate CV PDF from HTML template' })
  async generateCv(
    @Body() dto: GenerateCvDto,
    @Headers('authorization') authorization?: string,
  ): Promise<CvGenerationResponse> {
    return this.cvService.generateCv(dto, authorization);
  }
}
