import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ElasticsearchService } from '../search/elasticsearch.service';
import { SearchJobsDto } from './dto/search-jobs.dto';
import { JobSearchQuery } from './value-objects/job-search-query.vo';
import { SalaryRange } from './value-objects/salary-range.vo';
import { createHash } from 'crypto';

@Injectable()
export class JobService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private elasticsearch: ElasticsearchService
  ) {}

  async search(dto: SearchJobsDto, userId?: string) {
    const query = new JobSearchQuery(dto).toESQuery();
    const cacheKey = this.buildSearchCacheKey(dto, userId);

    // Check cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Search in Elasticsearch
    const esResult = await this.elasticsearch.search(query);
    const hits = esResult.hits.hits;
    const ids = hits.map((h: any) => h._id);

    if (ids.length === 0) {
      return {
        data: [],
        total: 0,
        page: dto.page || 1,
        limit: dto.limit || 20,
        totalPages: 0,
      };
    }

    // Batch fetch from PostgreSQL to hydrate full data
    const jobs = await this.prisma.jobPost.findMany({
      where: { id: { in: ids } },
      include: { company: true },
    });

    // Create a map for quick lookup
    const jobMap = new Map(jobs.map((j) => [j.id, j]));

    // Check favorites
    let favoritesSet = new Set<string>();
    if (userId) {
      const favorites = await this.prisma.jobFavorite.findMany({
        where: { userId, jobPostId: { in: ids } },
      });
      favoritesSet = new Set(favorites.map((f) => f.jobPostId));
    }

    // Map to response maintaining ES order and score
    const data = hits
      .map((hit: any) => {
        const job = jobMap.get(hit._id);
        if (!job) return null;

        return {
          id: job.id,
          title: job.title,
          company: {
            id: job.company.id,
            name: job.company.name,
            logoUrl: job.company.logoUrl,
          },
          city: job.city,
          country: job.country,
          salary: this.toSalaryRange(job.salary),
          remote: job.remote,
          contractType: job.contractType ?? null,
          source: job.source,
          url: job.url,
          postedAt: job.postedAt ?? null,
          isFavorited: favoritesSet.has(job.id),
          score: hit._score,
        };
      })
      .filter((j) => j !== null);

    const total = esResult.hits.total.value;
    const result = {
      data,
      total,
      page: dto.page || 1,
      limit: dto.limit || 20,
      totalPages: Math.ceil(total / (dto.limit || 20)),
    };

    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(result));

    return result;
  }

  async findById(id: string, userId?: string) {
    const job = await this.prisma.jobPost.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!job) return null;

    let isFavorited = false;
    if (userId) {
      const fav = await this.prisma.jobFavorite.findUnique({
        where: { userId_jobPostId: { userId, jobPostId: id } },
      });
      isFavorited = !!fav;
    }

    return {
      ...job,
      company: {
        id: job.company.id,
        name: job.company.name,
        logoUrl: job.company.logoUrl,
      },
      isFavorited,
    };
  }

  private hashQuery(dto: SearchJobsDto): string {
    return createHash('sha256').update(JSON.stringify(dto)).digest('hex');
  }

  private buildSearchCacheKey(dto: SearchJobsDto, userId?: string): string {
    const scope = userId ? `user:${userId}` : 'anon';
    return `search:${scope}:${this.hashQuery(dto)}`;
  }

  private toSalaryRange(rawSalary?: string | null): SalaryRange | null {
    if (!rawSalary) {
      return null;
    }

    const numbers = rawSalary.match(/\d+/g);
    if (!numbers || numbers.length === 0) {
      return null;
    }

    const min = Number(numbers[0]);
    const max = numbers.length > 1 ? Number(numbers[1]) : undefined;

    try {
      return new SalaryRange(min, max);
    } catch {
      return null;
    }
  }
}
