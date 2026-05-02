import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import axios from 'axios';

@ApiTags('Jobs Proxy')
@Controller({ path: 'jobs', version: '1' })
export class JobProxyController {
  private readonly jobServiceUrl = process.env['JOB_SERVICE_URL'] || 'http://localhost:4720';
  private readonly timeout = 30000;

  constructor(private readonly httpService: HttpService) {}

  @Get()
  async getJobs(@Query() query: any) {
    return this.getWithFallback('/jobs', { params: query });
  }

  @Get('categories')
  async getCategories() {
    return this.getWithFallback('/jobs/categories');
  }

  @Post('apply-bulk')
  async applyBulk(@Body() body: any, @Headers('authorization') auth: string) {
    return this.postWithFallback('/jobs/apply-bulk', body, auth);
  }

  @Get('applications')
  async getApplications(@Headers('authorization') auth: string) {
    return this.getWithFallback('/jobs/applications', { headers: { authorization: auth } });
  }

  @Get(':id')
  async getJobById(@Param('id') id: string) {
    return this.getWithFallback(`/jobs/${id}`);
  }

  private buildVersionedUrl(path: string): string {
    return `${this.jobServiceUrl}/api/v1${path}`;
  }

  private buildLegacyUrl(path: string): string {
    return `${this.jobServiceUrl}${path}`;
  }

  private async getWithFallback(path: string, config?: any) {
    const mergedConfig = { ...config, timeout: this.timeout };
    try {
      const response = await firstValueFrom(
        this.httpService.get(this.buildVersionedUrl(path), mergedConfig),
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        const response = await firstValueFrom(
          this.httpService.get(this.buildLegacyUrl(path), mergedConfig),
        );
        return response.data;
      }
      throw error;
    }
  }

  private async postWithFallback(path: string, body: any, auth?: string) {
    const config = auth ? { headers: { authorization: auth }, timeout: this.timeout } : { timeout: this.timeout };

    try {
      const response = await firstValueFrom(
        this.httpService.post(this.buildVersionedUrl(path), body, config),
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        const response = await firstValueFrom(
          this.httpService.post(this.buildLegacyUrl(path), body, config),
        );
        return response.data;
      }
      throw error;
    }
  }
}
