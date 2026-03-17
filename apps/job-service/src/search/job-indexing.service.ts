import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '../search/elasticsearch.service';
import { PrismaService } from '../prisma/prisma.service';

export interface JobIndexData {
  id: string;
  title: string;
  company: string;
  companyId: string;
  city?: string;
  country?: string;
  location?: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  contractType?: string;
  remote: boolean;
  description: string;
  requirements?: string;
  tags?: string[];
  source: string;
  externalId: string;
  url: string;
  postedAt?: Date;
  scrapedAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class JobIndexingService {
  private readonly logger = new Logger(JobIndexingService.name);

  constructor(
    private elasticsearch: ElasticsearchService,
    private prisma: PrismaService
  ) {}

  async indexJob(jobId: string) {
    try {
      const job = await this.prisma.jobPost.findUnique({
        where: { id: jobId },
        include: { company: true },
      });

      if (!job) {
        this.logger.warn(`Job not found: ${jobId}`);
        return;
      }

      const indexData = this.transformJobForIndex(job);
      await this.elasticsearch.indexJob(job.id, indexData);
      this.logger.log(`Job indexed: ${jobId}`);
    } catch (error) {
      this.logger.error(`Failed to index job: ${jobId}`, error);
      throw error;
    }
  }

  async updateJobIndex(jobId: string, updates: Partial<JobIndexData>) {
    try {
      await this.elasticsearch.updateJob(jobId, updates);
      this.logger.log(`Job index updated: ${jobId}`);
    } catch (error) {
      this.logger.error(`Failed to update job index: ${jobId}`, error);
      throw error;
    }
  }

  async deleteJobIndex(jobId: string) {
    try {
      await this.elasticsearch.deleteJob(jobId);
      this.logger.log(`Job index deleted: ${jobId}`);
    } catch (error) {
      this.logger.error(`Failed to delete job index: ${jobId}`, error);
      throw error;
    }
  }

  async bulkIndexJobs(jobIds: string[]) {
    try {
      const jobs = await this.prisma.jobPost.findMany({
        where: { id: { in: jobIds } },
        include: { company: true },
      });

      const indexData = jobs.map((job) => ({
        id: job.id,
        data: this.transformJobForIndex(job),
      }));

      await this.elasticsearch.bulkIndex(indexData);
      this.logger.log(`Bulk indexed ${jobs.length} jobs`);
    } catch (error) {
      this.logger.error('Bulk indexing failed', error);
      throw error;
    }
  }

  async reindexAll() {
    this.logger.log('Starting full reindex...');
    
    const batchSize = 100;
    let skip = 0;
    let total = 0;

    while (true) {
      const jobs = await this.prisma.jobPost.findMany({
        where: { isActive: true },
        include: { company: true },
        take: batchSize,
        skip,
      });

      if (jobs.length === 0) break;

      const indexData = jobs.map((job) => ({
        id: job.id,
        data: this.transformJobForIndex(job),
      }));

      await this.elasticsearch.bulkIndex(indexData);
      
      total += jobs.length;
      skip += batchSize;
      
      this.logger.log(`Reindexed ${total} jobs...`);
    }

    this.logger.log(`Full reindex completed: ${total} jobs`);
  }

  private transformJobForIndex(job: any): JobIndexData {
    // Extract salary numbers if available
    let salaryMin: number | undefined;
    let salaryMax: number | undefined;
    
    if (job.salary) {
      const salaryMatch = job.salary.match(/(\d+)/g);
      if (salaryMatch) {
        salaryMin = parseInt(salaryMatch[0]);
        salaryMax = salaryMatch[1] ? parseInt(salaryMatch[1]) : salaryMin;
      }
    }

    // Extract tags from title and description
    const tags = this.extractTags(job.title, job.description);

    return {
      id: job.id,
      title: job.title,
      company: job.company.name,
      companyId: job.companyId,
      city: job.city,
      country: job.country,
      location: job.location,
      salary: job.salary,
      salaryMin,
      salaryMax,
      contractType: job.contractType,
      remote: job.remote,
      description: job.description,
      requirements: job.requirements,
      tags,
      source: job.source,
      externalId: job.externalId,
      url: job.url,
      postedAt: job.postedAt,
      scrapedAt: job.scrapedAt,
      isActive: job.isActive,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  private extractTags(title: string, description: string): string[] {
    const text = `${title} ${description}`.toLowerCase();
    const commonTags = [
      'javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue',
      'node', 'nodejs', 'nestjs', 'express', 'django', 'flask', 'spring',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'devops', 'ci/cd',
      'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
      'senior', 'junior', 'lead', 'architect', 'manager', 'developer',
      'frontend', 'backend', 'fullstack', 'full-stack', 'mobile', 'ios', 'android',
    ];

    return commonTags.filter((tag) => text.includes(tag));
  }
}
