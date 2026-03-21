import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@ApiTags('Jobs Proxy')
@Controller('jobs')
export class JobProxyController {
  private readonly jobServiceUrl = process.env['JOB_SERVICE_URL'] || 'http://localhost:4720';

  constructor(private readonly httpService: HttpService) {}

  @Get()
  async getJobs(@Query() query: any) {
    const url = `${this.jobServiceUrl}/jobs`;
    const response = await firstValueFrom(
      this.httpService.get(url, { params: query })
    );
    return response.data;
  }

  @Get('categories')
  async getCategories() {
    const url = `${this.jobServiceUrl}/jobs/categories`;
    const response = await firstValueFrom(this.httpService.get(url));
    return response.data;
  }

  @Get(':id')
  async getJobById(@Param('id') id: string) {
    const url = `${this.jobServiceUrl}/jobs/${id}`;
    const response = await firstValueFrom(this.httpService.get(url));
    return response.data;
  }
}
