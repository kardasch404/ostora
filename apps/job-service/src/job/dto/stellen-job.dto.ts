import { ApiProperty } from '@nestjs/swagger';

export class StellenJobDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  job_title: string;

  @ApiProperty()
  company_name: string;

  @ApiProperty()
  location: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  category_name: string;

  @ApiProperty()
  category_url: string;

  @ApiProperty()
  website: string;

  @ApiProperty({ required: false })
  stelle_url?: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class PaginatedStellenJobsDto {
  @ApiProperty({ type: [StellenJobDto] })
  data: StellenJobDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
