import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LinkedInService } from './linkedin.service';

@ApiTags('LinkedIn')
@ApiBearerAuth()
@Controller('linkedin')
export class LinkedInController {
  constructor(private readonly linkedInService: LinkedInService) {}

  @Post('connect')
  @ApiOperation({ summary: 'Connect LinkedIn profile' })
  async connectProfile(@Body() body: { userId: string; linkedInUrl: string }) {
    return this.linkedInService.connectProfile(body.userId, body.linkedInUrl);
  }

  @Post('send-request')
  @ApiOperation({ summary: 'Send connection request' })
  async sendRequest(
    @Body() body: { userId: string; targetProfileUrl: string; message?: string },
  ) {
    return this.linkedInService.sendConnectionRequest(
      body.userId,
      body.targetProfileUrl,
      body.message,
    );
  }

  @Get(':userId/connections')
  @ApiOperation({ summary: 'Get user connections' })
  async getConnections(@Param('userId') userId: string) {
    return this.linkedInService.getConnections(userId);
  }

  @Post('auto-connect')
  @ApiOperation({ summary: 'Auto-connect with filters' })
  async autoConnect(@Body() body: { userId: string; filters: any }) {
    return this.linkedInService.autoConnect(body.userId, body.filters);
  }
}
