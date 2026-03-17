import { IsArray, IsUUID, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ApplyDto } from './apply.dto';

export class BulkApplyJobDto {
  @ApiProperty({ description: 'Job post ID' })
  @IsUUID()
  jobPostId: string;

  @ApiProperty({ description: 'Recipient email for this job' })
  recipientEmail: string;

  @ApiProperty({ description: 'Custom placeholders for this job', required: false })
  placeholders?: Record<string, string>;
}

export class BulkApplyDto {
  @ApiProperty({ description: 'Bundle ID containing CV and documents' })
  @IsUUID()
  bundleId: string;

  @ApiProperty({ description: 'Email configuration ID for SMTP' })
  @IsUUID()
  emailConfigId: string;

  @ApiProperty({ description: 'Message template ID' })
  @IsUUID()
  templateId: string;

  @ApiProperty({ type: [BulkApplyJobDto], description: 'Array of jobs to apply to' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkApplyJobDto)
  jobs: BulkApplyJobDto[];
}
