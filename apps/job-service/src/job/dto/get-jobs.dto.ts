import { IsOptional, IsString, IsInt, Min, Max, IsNotEmpty } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetJobsDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value === '' ? undefined : value)
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value === '' ? undefined : value)
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by location' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value === '' ? undefined : value)
  location?: string;

  @ApiPropertyOptional({ description: 'Filter by country' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value === '' ? undefined : value)
  country?: string;

  @ApiPropertyOptional({ description: 'Filter by employment type' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value === '' ? undefined : value)
  employmentType?: string;

  @ApiPropertyOptional({ description: 'Filter by company name' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value === '' ? undefined : value)
  company?: string;

  @ApiPropertyOptional({ description: 'Filter by start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value === '' ? undefined : value)
  startDateFrom?: string;
}