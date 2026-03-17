import { ApiProperty } from '@nestjs/swagger';
import { JobResponse } from './job.response';

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
