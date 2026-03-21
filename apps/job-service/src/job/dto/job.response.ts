import { ApiProperty } from '@nestjs/swagger';
import { SalaryRange } from '../value-objects/salary-range.vo';

export enum ContractType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  FREELANCE = 'FREELANCE',
  INTERNSHIP = 'INTERNSHIP',
  TEMPORARY = 'TEMPORARY'
}

export enum JobSource {
  LINKEDIN = 'LINKEDIN',
  INDEED = 'INDEED',
  STELLEN = 'STELLEN',
  OTHER = 'OTHER'
}

export class CompanyMiniResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  logoUrl?: string;
}

export class JobResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  company: CompanyMiniResponse;

  @ApiProperty({ required: false })
  city?: string;

  @ApiProperty({ required: false })
  country?: string;

  @ApiProperty({ required: false })
  salary: SalaryRange | null;

  @ApiProperty()
  remote: boolean;

  @ApiProperty({ enum: ContractType, required: false, nullable: true })
  contractType: ContractType | null;

  @ApiProperty({ enum: JobSource })
  source: JobSource;

  @ApiProperty()
  url: string;

  @ApiProperty({ required: false, nullable: true })
  postedAt: Date | null;

  @ApiProperty()
  isFavorited: boolean;

  @ApiProperty({ required: false })
  score?: number;
}
