import { Controller, Post, Get, Body, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ApplicationService } from './application.service';
import { ApplyDto } from './dto/apply.dto';
import { BulkApplyDto } from './dto/bulk-apply.dto';
import { ApplicationResponse, BulkApplicationResponse } from './dto/application.response';

@ApiTags('applications')
@Controller('jobs')
export class ApplicationController {
  constructor(private applicationService: ApplicationService) {}

  @Post(':id/apply')
  @ApiOperation({ summary: 'Apply to a single job' })
  @ApiParam({ name: 'id', description: 'Job post ID' })
  @ApiResponse({ status: 201, type: ApplicationResponse })
  async apply(
    @Param('id') jobPostId: string,
    @Body() dto: ApplyDto,
    @Req() req: any
  ) {
    const userId = req.user?.id;
    return this.applicationService.apply(jobPostId, dto, userId);
  }

  @Post('apply-bulk')
  @ApiOperation({ summary: 'Apply to multiple jobs (queue-based)' })
  @ApiResponse({ status: 201, type: BulkApplicationResponse })
  async applyBulk(@Body() dto: BulkApplyDto, @Req() req: any) {
    const userId = req.user?.id;
    return this.applicationService.applyBulk(dto, userId);
  }

  @Get('applications')
  @ApiOperation({ summary: 'Get all user applications' })
  @ApiResponse({ status: 200, type: [ApplicationResponse] })
  async getApplications(@Req() req: any) {
    const userId = req.user?.id;
    return this.applicationService.getApplications(userId);
  }

  @Get('applications/:id')
  @ApiOperation({ summary: 'Get application by ID' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiResponse({ status: 200, type: ApplicationResponse })
  async getApplicationById(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    return this.applicationService.getApplicationById(id, userId);
  }

  @Get('application-history')
  @ApiOperation({ summary: 'Get application history' })
  @ApiResponse({ status: 200 })
  async getApplicationHistory(@Req() req: any) {
    const userId = req.user?.id;
    return this.applicationService.getApplicationHistory(userId);
  }

  @Get('application-history/stats')
  @ApiOperation({ summary: 'Get application history stats' })
  @ApiResponse({ status: 200 })
  async getApplicationHistoryStats(@Req() req: any) {
    const userId = req.user?.id;
    return this.applicationService.getApplicationHistoryStats(userId);
  }

  @Post('application-history')
  @ApiOperation({ summary: 'Create application history record' })
  @ApiResponse({ status: 201 })
  async createApplicationHistory(@Body() dto: any, @Req() req: any) {
    const userId = req.user?.id;
    return this.applicationService.createApplicationHistory(userId, dto);
  }

  @Delete('application-history')
  @ApiOperation({ summary: 'Delete all application history' })
  @ApiResponse({ status: 200 })
  async deleteApplicationHistory(@Req() req: any) {
    const userId = req.user?.id;
    return this.applicationService.deleteApplicationHistory(userId);
  }
}
