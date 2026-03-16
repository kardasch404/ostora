import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ApplicationDocumentType {
  CV = 'CV',
  COVER_LETTER = 'COVER_LETTER',
  PORTFOLIO = 'PORTFOLIO',
  OTHER = 'OTHER',
}

export class UploadDocumentDto {
  @ApiProperty({ enum: ApplicationDocumentType, example: ApplicationDocumentType.CV })
  @IsNotEmpty()
  @IsEnum(ApplicationDocumentType)
  type: ApplicationDocumentType;
}
