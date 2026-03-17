import { IsEnum, IsOptional, IsInt, IsString, IsArray, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum JobSearchStatus {
  ACTIVE = 'ACTIVE',
  PASSIVE = 'PASSIVE',
  NOT_LOOKING = 'NOT_LOOKING',
}

export enum RemotePreference {
  REMOTE_ONLY = 'REMOTE_ONLY',
  HYBRID = 'HYBRID',
  ONSITE = 'ONSITE',
  NO_PREFERENCE = 'NO_PREFERENCE',
}

export enum ProfileVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  RECRUITERS_ONLY = 'RECRUITERS_ONLY',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  FREELANCE = 'FREELANCE',
  INTERNSHIP = 'INTERNSHIP',
  SELF_EMPLOYED = 'SELF_EMPLOYED',
}

export class UpdateProfileSettingsDto {
  @ApiPropertyOptional({ enum: JobSearchStatus, example: JobSearchStatus.ACTIVE })
  @IsOptional()
  @IsEnum(JobSearchStatus)
  jobSearchStatus?: JobSearchStatus;

  @ApiPropertyOptional({ example: 80000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  desiredSalary?: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  desiredSalaryCurrency?: string;

  @ApiPropertyOptional({ enum: EmploymentType, example: EmploymentType.FULL_TIME })
  @IsOptional()
  @IsEnum(EmploymentType)
  desiredContractType?: EmploymentType;

  @ApiPropertyOptional({ example: ['Berlin', 'Munich', 'Hamburg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  desiredLocations?: string[];

  @ApiPropertyOptional({ enum: RemotePreference, example: RemotePreference.HYBRID })
  @IsOptional()
  @IsEnum(RemotePreference)
  remotePreference?: RemotePreference;

  @ApiPropertyOptional({ enum: ProfileVisibility, example: ProfileVisibility.PUBLIC })
  @IsOptional()
  @IsEnum(ProfileVisibility)
  visibility?: ProfileVisibility;
}
