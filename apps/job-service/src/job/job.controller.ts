import { Controller, Get, Query, Param, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JobService } from './job.service';
import { GetJobsDto } from './dto/get-jobs.dto';
import { PaginatedStellenJobsDto } from './dto/stellen-job.dto';

@ApiTags('jobs')
@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get paginated jobs from MySQL stellen database',
    description: 'Fetches jobs with optional filters: search, category, location, country. Results are cached for 5 minutes.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Jobs retrieved successfully',
    type: PaginatedStellenJobsDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid parameters' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in job title, company name, or content' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by category name' })
  @ApiQuery({ name: 'location', required: false, type: String, description: 'Filter by location' })
  @ApiQuery({ name: 'country', required: false, type: String, description: 'Filter by country' })
  async getJobs(@Query() query: GetJobsDto) {
    return this.jobService.getJobsFromStellen(query);
  }

  @Get('categories')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get all job categories',
    description: 'Returns distinct list of job categories. Cached for 1 hour.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Categories retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  })
  async getCategories() {
    const categories = await this.jobService.getCategories();
    return { data: categories };
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get job statistics',
    description: 'Returns overall statistics: total jobs, companies, categories, countries'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistics retrieved successfully'
  })
  async getStatistics() {
    return this.jobService.getStatistics();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get job by ID',
    description: 'Fetches a single job by its ID. Cached for 5 minutes.'
  })
  @ApiParam({ name: 'id', type: Number, description: 'Job ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Job retrieved successfully'
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiResponse({ status: 400, description: 'Invalid job ID' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.jobService.findById(id);
  }
}