import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { JobFiltersDto } from './job-filters.dto';

export class SearchJobsDto extends JobFiltersDto {
  @ApiPropertyOptional({ description: 'Search query for title and description' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 20;
}
