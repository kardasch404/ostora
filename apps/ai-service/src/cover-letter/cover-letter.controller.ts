import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CoverLetterQueue } from '../queues/cover-letter.queue';
import { GenerateCoverLetterDto } from './dto/generate-cover-letter.dto';

@ApiTags('AI - Cover Letter')
@Controller('ai')
export class CoverLetterController {
  constructor(private readonly coverLetterQueue: CoverLetterQueue) {}

  @Post('cover-letter')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate AI cover letter (async, returns job ID)' })
  async generateCoverLetter(@Body() dto: GenerateCoverLetterDto) {
    const job = await this.coverLetterQueue.addJob({
      userId: dto.userId,
      cvText: dto.cvText,
      jobDescription: dto.jobDescription,
      companyName: dto.companyName,
      jobTitle: dto.jobTitle,
      language: dto.language || 'en',
      tone: dto.tone,
      bundleId: dto.bundleId,
      renderPdf: dto.renderPdf !== false,
    });

    return {
      jobId: job.id,
      status: 'processing',
      message: 'Cover letter generation started. Check /ai/cover-letter/status/:jobId for status.',
      estimatedTime: '10-30 seconds',
    };
  }

  @Get('cover-letter/status/:jobId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check cover letter generation status' })
  async getCoverLetterStatus(@Param('jobId') jobId: string) {
    const job = await this.coverLetterQueue.getJob(jobId);

    if (!job) {
      return { status: 'not_found', message: 'Job not found' };
    }

    const state = await job.getState();
    const progress = job.progress();

    if (state === 'completed') {
      const result = job.returnvalue;
      return {
        status: 'completed',
        result: {
          coverLetterText: result.coverLetterText,
          wordCount: result.wordCount,
          pdf: result.pdf,
          timestamp: result.timestamp,
        },
      };
    }

    if (state === 'failed') {
      return {
        status: 'failed',
        error: job.failedReason,
      };
    }

    return {
      status: state,
      progress,
      message: 'Cover letter is being generated...',
    };
  }
}
