import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { FastApplyProgressService } from './fast-apply-progress.service';

@Injectable()
export class FastApplyService {
  private readonly logger = new Logger(FastApplyService.name);

  constructor(
    @InjectQueue('cv-analysis') private cvQueue: Queue,
    @InjectQueue('cover-letter') private coverLetterQueue: Queue,
    @InjectQueue('fast-apply') private fastApplyQueue: Queue,
    private progressService: FastApplyProgressService,
  ) {}

  async processBatch(
    userId: string,
    jobIds: string[],
    cvText: string,
    concurrency: number = 1,
  ): Promise<string> {
    const batchId = `batch-${userId}-${Date.now()}`;
    
    await this.progressService.initBatch(batchId, jobIds.length);

    // Ollama concurrency: 1 at a time (local GPU limit)
    for (const jobId of jobIds) {
      await this.fastApplyQueue.add(
        {
          batchId,
          userId,
          jobId,
          cvText,
          jobDescription: `Job ${jobId}`,
          companyName: 'Company',
        },
        { attempts: 3, backoff: 5000 },
      );
    }

    this.logger.log(`Batch ${batchId} created with ${jobIds.length} jobs, concurrency: ${concurrency}`);
    return batchId;
  }

  async getBatchStatus(batchId: string) {
    return this.progressService.getProgress(batchId);
  }
}
