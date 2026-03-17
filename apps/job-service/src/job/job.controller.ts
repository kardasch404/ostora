import { Controller, Get, Query, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JobService } from './job.service';
import { SearchJobsDto } from './dto/search-jobs.dto';
import { PaginatedJobsResponse, JobResponse } from './dto/job.response';

@ApiTags('jobs')
@Controller('jobs')
export class JobController {
  constructor(private jobService: JobService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search jobs with filters' })
  @ApiResponse({ status: 200, type: PaginatedJobsResponse })
  async search(@Query() dto: SearchJobsDto, @Req() req: any) {
    const userId = req.user?.id;
    return this.jobService.search(dto, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID' })
  @ApiResponse({ status: 200, type: JobResponse })
  async findById(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    return this.jobService.findById(id, userId);
  }
}
