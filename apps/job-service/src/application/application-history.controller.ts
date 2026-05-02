import { Controller, Get, Post, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationHistoryService } from './application-history.service';
import {
  CreateApplicationHistoryDto,
  ApplicationHistoryResponseDto,
  ApplicationHistoryStatsDto,
} from './dto/application-history.dto';

@ApiTags('application-history')
@Controller('application-history')
@ApiBearerAuth()
export class ApplicationHistoryController {
  constructor(private historyService: ApplicationHistoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create application history record' })
  @ApiResponse({ status: 201, type: ApplicationHistoryResponseDto })
  async create(@Body() dto: CreateApplicationHistoryDto, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    return this.historyService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all application history for user' })
  @ApiResponse({ status: 200, type: [ApplicationHistoryResponseDto] })
  async findAll(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    return this.historyService.findAll(userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get application history statistics' })
  @ApiResponse({ status: 200, type: ApplicationHistoryStatsDto })
  async getStats(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    return this.historyService.getStats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application history by ID' })
  @ApiResponse({ status: 200, type: ApplicationHistoryResponseDto })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    return this.historyService.findOne(id, userId);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all application history for user' })
  @ApiResponse({ status: 200 })
  async deleteAll(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    return this.historyService.deleteAll(userId);
  }
}
