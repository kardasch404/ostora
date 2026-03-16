import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmailEncryption } from './create-email-config.dto';

export class EmailConfigResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  password: string = 'REDACTED';

  @ApiProperty()
  smtpHost: string;

  @ApiProperty()
  smtpPort: number;

  @ApiProperty({ enum: EmailEncryption })
  encryption: EmailEncryption;

  @ApiProperty()
  fromName: string;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  lastTestedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
