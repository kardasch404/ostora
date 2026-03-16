import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationDocumentType } from './upload-document.dto';

export class BundleResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  documentCount?: number;
}

export class DocumentResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  bundleId: string;

  @ApiProperty({ enum: ApplicationDocumentType })
  type: ApplicationDocumentType;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  s3Key: string;

  @ApiProperty()
  s3Url: string;

  @ApiProperty()
  fileSize: number;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PresignedUrlResponse {
  @ApiProperty()
  uploadUrl: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  expiresIn: number;
}

export class DownloadUrlResponse {
  @ApiProperty()
  downloadUrl: string;

  @ApiProperty()
  expiresIn: number;
}
