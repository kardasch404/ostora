import { Injectable } from '@nestjs/common';
import { JobSource } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JobIndexingService } from '../search/job-indexing.service';

@Injectable()
export class JobDedupService {
  constructor(
    private prisma: PrismaService,
    private jobIndexing: JobIndexingService
  ) {}

  async findDuplicate(externalId: string, source: JobSource) {
    return this.prisma.jobPost.findUnique({
      where: {
        externalId_source: { externalId, source },
      },
    });
  }

  async upsertJob(data: any) {
    const { externalId, source, ...jobData } = data;
    
    const job = await this.prisma.jobPost.upsert({
      where: {
        externalId_source: { externalId, source },
      },
      create: { externalId, source, ...jobData },
      update: jobData,
    });

    // Index to Elasticsearch after upsert
    await this.jobIndexing.indexJob(job.id);

    return job;
  }

  async markDuplicatesInactive(externalId: string, source: JobSource, keepId: string) {
    const updated = await this.prisma.jobPost.updateMany({
      where: {
        externalId,
        source,
        id: { not: keepId },
      },
      data: { isActive: false },
    });

    // Update ES index for inactive jobs
    if (updated.count > 0) {
      const inactiveJobs = await this.prisma.jobPost.findMany({
        where: { externalId, source, id: { not: keepId } },
        select: { id: true },
      });

      for (const job of inactiveJobs) {
        await this.jobIndexing.updateJobIndex(job.id, { isActive: false });
      }
    }
  }
}
