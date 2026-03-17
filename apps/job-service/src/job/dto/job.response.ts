import { ApiProperty } from '@nestjs/swagger';

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
  salary?: string;

  @ApiProperty()
  remote: boolean;

  @ApiProperty({ required: false })
  contractType?: string;

  @ApiProperty()
  source: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  postedAt?: Date;

  @ApiProperty()
  isFavorited: boolean;
}

export class PaginatedJobsResponse {
  @ApiProperty({ type: [JobResponse] })
  data: JobResponse[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
