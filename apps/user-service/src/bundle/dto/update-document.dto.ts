import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationDocumentType } from './upload-document.dto';

export class UpdateDocumentDto {
  @ApiPropertyOptional({ enum: ApplicationDocumentType })
  @IsOptional()
  @IsEnum(ApplicationDocumentType)
  type?: ApplicationDocumentType;

  @ApiPropertyOptional({ example: 'resume.pdf' })
  @IsOptional()
  @IsString()
  filename?: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ example: 102400 })
  @IsOptional()
  @IsInt()
  @Min(1)
  fileSize?: number;
}
