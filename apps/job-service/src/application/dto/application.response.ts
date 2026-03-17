import { ApiProperty } from '@nestjs/swagger';

export enum ApplicationStatus {
  SENT = 'SENT',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
}

export class ApplicationResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  jobPostId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: ApplicationStatus })
  status: ApplicationStatus;

  @ApiProperty({ required: false })
  errorMessage?: string;

  @ApiProperty()
  appliedAt: Date;
}

export class BulkApplicationResponse {
  @ApiProperty()
  totalJobs: number;

  @ApiProperty()
  queued: number;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: [String] })
  jobIds: string[];
}
