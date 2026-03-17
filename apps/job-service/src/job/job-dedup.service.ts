import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobDedupService {
  constructor(private prisma: PrismaService) {}

  async findDuplicate(externalId: string, source: string) {
    return this.prisma.jobPost.findUnique({
      where: {
        externalId_source: { externalId, source },
      },
    });
  }

  async upsertJob(data: any) {
    const { externalId, source, ...jobData } = data;
    
    return this.prisma.jobPost.upsert({
      where: {
        externalId_source: { externalId, source },
      },
      create: { externalId, source, ...jobData },
      update: jobData,
    });
  }

  async markDuplicatesInactive(externalId: string, source: string, keepId: string) {
    await this.prisma.jobPost.updateMany({
      where: {
        externalId,
        source,
        id: { not: keepId },
      },
      data: { isActive: false },
    });
  }
}
