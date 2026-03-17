import { Injectable, Logger } from '@nestjs/common';
import { MySQLReaderService } from './mysql-reader.service';
import { PrismaService } from '../prisma/prisma.service';
import { ElasticsearchService } from '../search/elasticsearch.service';
import { JobDedupService } from '../job/job-dedup.service';

@Injectable()
export class JobSyncService {
  private readonly logger = new Logger(JobSyncService.name);

  constructor(
    private mysqlReader: MySQLReaderService,
    private prisma: PrismaService,
    private elasticsearch: ElasticsearchService,
    private dedup: JobDedupService
  ) {}

  async syncAll() {
    this.logger.log('Starting job sync from MySQL to PostgreSQL + Elasticsearch');

    await this.mysqlReader.connect();

    // Sync LinkedIn jobs
    const linkedinJobs = await this.mysqlReader.readLinkedInJobs();
    this.logger.log(`Found ${linkedinJobs.length} LinkedIn jobs`);
    for (const job of linkedinJobs as any[]) {
      await this.syncJob(job, 'LINKEDIN');
    }

    // Sync Stellen jobs
    const stellenJobs = await this.mysqlReader.readStellenJobs();
    this.logger.log(`Found ${stellenJobs.length} Stellen jobs`);
    for (const job of stellenJobs as any[]) {
      await this.syncJob(job, 'STELLEN');
    }

    await this.mysqlReader.disconnect();
    this.logger.log('Job sync completed');
  }

  private async syncJob(job: any, source: string) {
    const company = await this.prisma.company.upsert({
      where: { name: job.company },
      create: {
        name: job.company,
        city: job.city,
        country: job.country,
      },
      update: {},
    });

    const jobPost = await this.dedup.upsertJob({
      externalId: job.id.toString(),
      source,
      title: job.title,
      companyId: company.id,
      location: job.location,
      city: job.city,
      country: job.country,
      salary: job.salary,
      contractType: this.mapContractType(job.contract_type),
      remote: job.remote || false,
      description: job.description,
      requirements: job.requirements,
      url: job.url,
      postedAt: job.posted_at,
      scrapedAt: job.scraped_at || new Date(),
      isActive: true,
    });

    // Index in Elasticsearch
    await this.elasticsearch.indexJob(jobPost.id, {
      title: jobPost.title,
      description: jobPost.description,
      city: jobPost.city,
      country: jobPost.country,
      remote: jobPost.remote,
      contractType: jobPost.contractType,
      postedAt: jobPost.postedAt,
      isActive: jobPost.isActive,
    });
  }

  private mapContractType(type?: string): string | null {
    if (!type) return null;
    const normalized = type.toUpperCase().replace(/[-\s]/g, '_');
    if (['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP', 'TEMPORARY'].includes(normalized)) {
      return normalized;
    }
    return null;
  }
}
