import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { FastApplyService } from './fast-apply.service';
import { FastApplyRequestDto } from '../dto/ai-request.dto';

@Controller('ai/fast-apply')
export class FastApplyController {
  constructor(private fastApplyService: FastApplyService) {}

  @Post()
  async startFastApply(@Body() dto: FastApplyRequestDto) {
    const batchId = await this.fastApplyService.processBatch(
      dto.userId,
      dto.jobIds,
      'CV text placeholder', // TODO: Fetch from user-service
      dto.concurrency || 5,
    );

    return {
      batchId,
      jobCount: dto.jobIds.length,
      status: 'processing',
    };
  }

  @Get(':batchId')
  async getBatchStatus(@Param('batchId') batchId: string) {
    const progress = await this.fastApplyService.getBatchStatus(batchId);
    
    if (!progress) {
      return { error: 'Batch not found' };
    }

    return progress;
  }
}
