import { IsOptional, IsString, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ContractType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  FREELANCE = 'FREELANCE',
  INTERNSHIP = 'INTERNSHIP',
  TEMPORARY = 'TEMPORARY',
}

export class JobFiltersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  remote?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  salaryMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  salaryMax?: number;

  @ApiPropertyOptional({ enum: ContractType })
  @IsOptional()
  @IsEnum(ContractType)
  contractType?: ContractType;
}
