import { ApiProperty } from '@nestjs/swagger';

export enum EmailStatus {
  SENT = 'SENT',
  FAILED = 'FAILED',
  RETRY = 'RETRY',
}

export enum EmailProvider {
  SMTP = 'SMTP',
  SES = 'SES',
}

export class EmailLogResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  to: string;

  @ApiProperty()
  subject: string;

  @ApiProperty({ enum: EmailStatus })
  status: EmailStatus;

  @ApiProperty({ enum: EmailProvider })
  provider: EmailProvider;

  @ApiProperty({ required: false })
  errorMessage?: string;

  @ApiProperty()
  sentAt: Date;
}
