import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProfileVisibility } from '@prisma/client';

export class ProfileResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  firstName?: string;

  @ApiPropertyOptional()
  lastName?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  bio?: string;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiPropertyOptional()
  birthDate?: Date;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  country?: string;

  @ApiPropertyOptional()
  postalCode?: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  company?: string;

  @ApiPropertyOptional()
  industry?: string;

  @ApiPropertyOptional()
  experienceYears?: number;

  @ApiPropertyOptional()
  salary?: number;

  @ApiPropertyOptional()
  salaryCurrency?: string;

  @ApiPropertyOptional()
  location?: string;

  @ApiPropertyOptional()
  remote?: boolean;

  @ApiPropertyOptional()
  linkedinUrl?: string;

  @ApiPropertyOptional()
  githubUrl?: string;

  @ApiPropertyOptional()
  portfolioUrl?: string;

  @ApiPropertyOptional()
  websiteUrl?: string;

  @ApiProperty({ enum: ProfileVisibility })
  visibility: ProfileVisibility;

  @ApiPropertyOptional()
  jobPreferences?: any;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
