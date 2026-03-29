import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OutreachService } from './outreach.service';

@ApiTags('Outreach')
@ApiBearerAuth()
@Controller('outreach')
export class OutreachController {
  constructor(private readonly outreachService: OutreachService) {}

  @Post()
  @ApiOperation({ summary: 'Create outreach message' })
  async createOutreach(@Body() body: any) {
    return this.outreachService.createOutreach(body);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send outreach message' })
  async sendOutreach(@Param('id') id: string) {
    return this.outreachService.sendOutreach(id);
  }

  @Get(':userId/history')
  @ApiOperation({ summary: 'Get outreach history' })
  async getHistory(@Param('userId') userId: string) {
    return this.outreachService.getOutreachHistory(userId);
  }

  @Post(':id/response')
  @ApiOperation({ summary: 'Track outreach response' })
  async trackResponse(@Param('id') id: string, @Body() body: { response: string }) {
    return this.outreachService.trackResponse(id, body.response);
  }

  @Get(':userId/stats')
  @ApiOperation({ summary: 'Get outreach statistics' })
  async getStats(@Param('userId') userId: string) {
    return this.outreachService.getOutreachStats(userId);
  }
}
