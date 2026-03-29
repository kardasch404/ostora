import { IsString, IsArray, IsOptional, ArrayMaxSize, ArrayMinSize } from 'class-validator';

export class FastApplyRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsString({ each: true })
  jobIds: string[];

  @IsString()
  bundleId: string;

  @IsString()
  emailConfigId: string;

  @IsString()
  templateId: string;

  @IsString()
  @IsOptional()
  userId?: string;
}

export class FastApplyProgressDto {
  batchId: string;
  total: number;
  done: number;
  failed: number;
  status: 'processing' | 'completed' | 'failed';
  currentJob?: string;
}
