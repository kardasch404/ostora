import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ElasticsearchService } from '../search/elasticsearch.service';
import { SearchJobsDto } from './dto/search-jobs.dto';
import { JobSearchQuery } from './value-objects/job-search-query.vo';
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
    const cacheKey = 'search:' + this.hashQuery(dto);

    // Check cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Search in Elasticsearch
    const esResult = await this.elasticsearch.search(query);
    const ids = esResult.hits.hits.map((h: any) => h._id);

    // Fetch full data from PostgreSQL
    const jobs = await this.prisma.jobPost.findMany({
      where: { id: { in: ids } },
      include: { company: true },
    });

    // Check favorites
    let favorites = new Set<string>();
    if (userId) {
      const favs = await this.prisma.jobFavorite.findMany({
        where: { userId, jobPostId: { in: ids } },
      });
      favorites = new Set(favs.map((f) => f.jobPostId));
    }

    // Map to response
    const result = {
      data: jobs.map((j) => ({
        id: j.id,
        title: j.title,
        company: {
          id: j.company.id,
          name: j.company.name,
          logoUrl: j.company.logoUrl,
        },
        city: j.city,
        country: j.country,
        salary: j.salary,
        remote: j.remote,
        contractType: j.contractType,
        source: j.source,
        url: j.url,
        postedAt: j.postedAt,
        isFavorited: favorites.has(j.id),
      })),
      total: esResult.hits.total.value,
      page: dto.page || 1,
      limit: dto.limit || 20,
      totalPages: Math.ceil(esResult.hits.total.value / (dto.limit || 20)),
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
}
