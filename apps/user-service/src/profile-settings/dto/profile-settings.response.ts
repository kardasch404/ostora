import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobSearchStatus, RemotePreference, ProfileVisibility, EmploymentType } from './update-profile-settings.dto';

export class ProfileSettingsResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: JobSearchStatus })
  jobSearchStatus: JobSearchStatus;

  @ApiPropertyOptional()
  desiredSalary?: number;

  @ApiPropertyOptional()
  desiredSalaryCurrency?: string;

  @ApiPropertyOptional({ enum: EmploymentType })
  desiredContractType?: EmploymentType;

  @ApiProperty()
  desiredLocations: string[];

  @ApiProperty({ enum: RemotePreference })
  remotePreference: RemotePreference;

  @ApiProperty({ enum: ProfileVisibility })
  visibility: ProfileVisibility;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ProfileCompletenessResponse {
  @ApiProperty()
  score: number;

  @ApiProperty()
  percentage: string;

  @ApiProperty()
  missingFields: string[];

  @ApiProperty()
  completedFields: string[];
}
