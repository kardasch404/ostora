import { IsBoolean, IsOptional, IsObject, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum DigestFrequency {
  INSTANT = 'INSTANT',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
}

export class QuietHoursDto {
  @ApiProperty({ description: 'Start hour (0-23)', example: 22 })
  @IsInt()
  @Min(0)
  @Max(23)
  startHour: number;

  @ApiProperty({ description: 'End hour (0-23)', example: 8 })
  @IsInt()
  @Min(0)
  @Max(23)
  endHour: number;
}

export class NotificationTypesDto {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  AI_TASK_COMPLETED?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  JOB_MATCH?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  PAYMENT_SUCCESS?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  PAYMENT_FAILED?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  APPLICATION_UPDATE?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  TRIAL_EXPIRING?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  SUBSCRIPTION_RENEWED?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  SYSTEM_ALERT?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  JOB_APPLICATION?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  MESSAGE?: boolean;
}

export class UpdatePreferencesDto {
  @ApiProperty({ description: 'Enable in-app notifications', required: false })
  @IsBoolean()
  @IsOptional()
  inAppEnabled?: boolean;

  @ApiProperty({ description: 'Enable push notifications', required: false })
  @IsBoolean()
  @IsOptional()
  pushEnabled?: boolean;

  @ApiProperty({ description: 'Enable email notifications', required: false })
  @IsBoolean()
  @IsOptional()
  emailEnabled?: boolean;

  @ApiProperty({ description: 'Enable weekly digest email', required: false })
  @IsBoolean()
  @IsOptional()
  weeklyDigestEnabled?: boolean;

  @ApiProperty({ enum: DigestFrequency, description: 'Digest frequency', required: false })
  @IsEnum(DigestFrequency)
  @IsOptional()
  digestFrequency?: DigestFrequency;

  @ApiProperty({ type: QuietHoursDto, description: 'Quiet hours for push notifications', required: false })
  @IsObject()
  @IsOptional()
  quietHours?: QuietHoursDto;

  @ApiProperty({ type: NotificationTypesDto, description: 'Per-type notification settings', required: false })
  @IsObject()
  @IsOptional()
  types?: NotificationTypesDto;
}
