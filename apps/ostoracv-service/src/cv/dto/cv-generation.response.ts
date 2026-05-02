import { ApiProperty } from '@nestjs/swagger';

export class CvGenerationResponse {
  @ApiProperty()
  downloadUrl!: string;

  @ApiProperty()
  s3Key!: string;

  @ApiProperty()
  generatedAt!: string;

  @ApiProperty()
  templateId!: string;

  @ApiProperty()
  lang!: string;
}
