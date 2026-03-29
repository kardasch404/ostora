import { ApiProperty } from '@nestjs/swagger';
import { DigestFrequency, QuietHoursDto, NotificationTypesDto } from './update-preferences.dto';

export class PreferencesResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  inAppEnabled: boolean;

  @ApiProperty()
  pushEnabled: boolean;

  @ApiProperty()
  emailEnabled: boolean;

  @ApiProperty()
  weeklyDigestEnabled: boolean;

  @ApiProperty({ enum: DigestFrequency })
  digestFrequency: DigestFrequency;

  @ApiProperty({ type: QuietHoursDto, nullable: true })
  quietHours: QuietHoursDto | null;

  @ApiProperty({ type: NotificationTypesDto })
  types: NotificationTypesDto;

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date;
}
