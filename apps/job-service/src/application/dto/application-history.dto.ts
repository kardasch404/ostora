import { IsString, IsOptional, IsEmail, IsArray, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ApplicationHistoryStatus {
  SENT = 'sent',
  FAILED = 'failed',
}

export class CreateApplicationHistoryDto {
  @ApiProperty()
  @IsString()
  jobId: string;

  @ApiProperty()
  @IsString()
  jobTitle: string;

  @ApiProperty()
  @IsString()
  company: string;

  @ApiProperty()
  @IsEmail()
  senderEmail: string;

  @ApiProperty()
  @IsEmail()
  contactEmail: string;

  @ApiProperty()
  @IsString()
  subject: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty({ enum: ApplicationHistoryStatus })
  @IsEnum(ApplicationHistoryStatus)
  status: ApplicationHistoryStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  templateName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @ApiProperty({ required: false, type: [Object] })
  @IsOptional()
  @IsArray()
  attachments?: Array<{
    id: string;
    filename: string;
    fileSize: number;
    type: string;
    bundleName?: string;
  }>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  errorMessage?: string;
}

export class ApplicationHistoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  jobId: string;

  @ApiProperty()
  jobTitle: string;

  @ApiProperty()
  company: string;

  @ApiProperty()
  senderEmail: string;

  @ApiProperty()
  contactEmail: string;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ enum: ApplicationHistoryStatus })
  status: ApplicationHistoryStatus;

  @ApiProperty()
  sentAt: Date;

  @ApiProperty({ required: false })
  templateName?: string;

  @ApiProperty({ required: false })
  sourceUrl?: string;

  @ApiProperty({ required: false })
  attachments?: any[];

  @ApiProperty({ required: false })
  errorMessage?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ApplicationHistoryStatsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  sent: number;

  @ApiProperty()
  failed: number;

  @ApiProperty()
  emailAccounts: number;

  @ApiProperty()
  companies: number;
}
