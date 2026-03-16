import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RenderTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rhName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rhFirstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rhLastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  senderName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  senderFirstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  senderLastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  senderEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  senderPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  senderSignature?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobSalary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  applicationDate?: string;
}
