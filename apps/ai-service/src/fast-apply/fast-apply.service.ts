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
    private progressService: FastApplyProgressService,
  ) {}

  async processBatch(
    userId: string,
    jobIds: string[],
    cvText: string,
    concurrency: number = 5,
  ): Promise<string> {
    const batchId = `batch-${userId}-${Date.now()}`;
    
    await this.progressService.initBatch(batchId, jobIds.length);

    for (const jobId of jobIds) {
      await this.cvQueue.add(
        {
          userId,
          cvText,
          jobDescription: `Job ${jobId}`, // TODO: Fetch from job-service
          batchId,
        },
        { attempts: 3, backoff: 5000 },
      );

      await this.coverLetterQueue.add(
        {
          userId,
          cvText,
          jobDescription: `Job ${jobId}`,
          companyName: 'Company',
          batchId,
        },
        { attempts: 3, backoff: 5000 },
      );
    }

    this.logger.log(`Batch ${batchId} created with ${jobIds.length} jobs`);
    return batchId;
  }

  async getBatchStatus(batchId: string) {
    return this.progressService.getProgress(batchId);
  }
}
