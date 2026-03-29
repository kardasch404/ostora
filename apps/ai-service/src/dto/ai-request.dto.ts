import { IsString, IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class ChatRequestDto {
  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsEnum(['en', 'fr', 'de'])
  @IsOptional()
  language?: 'en' | 'fr' | 'de';
}

export class FastApplyRequestDto {
  @IsString()
  userId: string;

  @IsString({ each: true })
  jobIds: string[];

  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  concurrency?: number;
}

export class CvAnalysisRequestDto {
  @IsString()
  cvUrl: string;

  @IsString()
  jobDescription: string;

  @IsString()
  @IsOptional()
  userId?: string;
}
