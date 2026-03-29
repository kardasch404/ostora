import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignService } from './campaign.service';

@ApiTags('Campaign')
@ApiBearerAuth()
@Controller('campaign')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @ApiOperation({ summary: 'Create outreach campaign' })
  async createCampaign(@Body() body: any) {
    return this.campaignService.createCampaign(body);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start campaign' })
  async startCampaign(@Param('id') id: string) {
    return this.campaignService.startCampaign(id);
  }

  @Patch(':id/pause')
  @ApiOperation({ summary: 'Pause campaign' })
  async pauseCampaign(@Param('id') id: string) {
    return this.campaignService.pauseCampaign(id);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get user campaigns' })
  async getCampaigns(@Param('userId') userId: string) {
    return this.campaignService.getCampaigns(userId);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get campaign statistics' })
  async getStats(@Param('id') id: string) {
    return this.campaignService.getCampaignStats(id);
  }
}
