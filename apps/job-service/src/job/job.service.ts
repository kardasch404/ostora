import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySQLService } from '../mysql/mysql.service';
import { RedisService } from '../redis/redis.service';
import { GetJobsDto } from './dto/get-jobs.dto';
import { createHash } from 'crypto';
import { RowDataPacket } from 'mysql2';

interface StellenJob extends RowDataPacket {
  id: number;
  job_title: string;
  company_name: string;
  location: string;
  country: string;
  category_name: string;
  content: string;
  website: string;
  stelle_url: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly MAX_LIMIT = 100;
  private readonly DEFAULT_LIMIT = 20;

  constructor(
    private readonly mysql: MySQLService,
    private readonly redis: RedisService
  ) {}

  /**
   * Get paginated jobs from MySQL stellen table with filters
   * Uses Redis caching for performance
   */
  async getJobsFromStellen(dto: GetJobsDto) {
    // Input validation
    const page = Math.max(1, dto.page || 1);
    const limit = Math.min(this.MAX_LIMIT, Math.max(1, dto.limit || this.DEFAULT_LIMIT));
    const offset = (page - 1) * limit;

    // Check cache first
    const cacheKey = this.buildCacheKey('jobs', dto);
    const cached = await this.getCachedData(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for key: ${cacheKey}`);
      return cached;
    }

    try {
      // Build query with parameterized statements (SQL injection prevention)
      const { sql, params } = this.buildJobQuery(dto, limit, offset);
      
      // Execute queries in parallel for better performance
      const [jobs, totalCount] = await Promise.all([
        this.mysql.query<StellenJob>(sql, params),
        this.getJobCount(dto)
      ]);

      const result = {
        data: jobs,
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      };

      // Cache the result
      await this.setCachedData(cacheKey, result);

      this.logger.log(`Fetched ${jobs.length} jobs (page ${page}/${result.totalPages})`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch jobs: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch jobs');
    }
  }

  /**
   * Get distinct job categories
   * Cached for better performance
   */
  async getCategories(): Promise<string[]> {
    const cacheKey = 'categories:all';
    const cached = await this.getCachedData<string[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const categories = await this.mysql.query<{ category_name: string }>(
        'SELECT DISTINCT category_name FROM stellen WHERE category_name IS NOT NULL AND category_name != "" ORDER BY category_name ASC'
      );
      
      const result = categories.map(c => c.category_name).filter(Boolean);
      
      // Cache for longer (1 hour) as categories don't change often
      await this.redis.setex(cacheKey, 3600, JSON.stringify(result));
      
      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch categories: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch categories');
    }
  }

  /**
   * Get job by ID
   */
  async findById(id: number) {
    if (!id || id <= 0) {
      throw new BadRequestException('Invalid job ID');
    }

    const cacheKey = `job:${id}`;
    const cached = await this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const job = await this.mysql.queryOne<StellenJob>(
        'SELECT * FROM stellen WHERE id = ?',
        [id]
      );

      if (!job) {
        throw new NotFoundException(`Job with ID ${id} not found`);
      }

      await this.setCachedData(cacheKey, job);
      return job;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch job ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch job');
    }
  }

  /**
   * Get job statistics
   */
  async getStatistics() {
    const cacheKey = 'stats:jobs';
    const cached = await this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const [stats] = await this.mysql.query<any>(
        `SELECT 
          COUNT(*) as total,
          COUNT(DISTINCT company_name) as totalCompanies,
          COUNT(DISTINCT category_name) as totalCategories,
          COUNT(DISTINCT country) as totalCountries
        FROM stellen`
      );

      await this.redis.setex(cacheKey, 600, JSON.stringify(stats));
      return stats;
    } catch (error) {
      this.logger.error(`Failed to fetch statistics: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch statistics');
    }
  }

  /**
   * Build SQL query with filters
   * @private
   */
  private buildJobQuery(dto: GetJobsDto, limit: number, offset: number) {
    let sql = 'SELECT * FROM stellen WHERE 1=1';
    const params: any[] = [];

    // Search filter (job_title OR company_name)
    if (dto.search?.trim()) {
      sql += ' AND (job_title LIKE ? OR company_name LIKE ? OR content LIKE ?)';
      const searchTerm = `%${dto.search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Category filter (exact match)
    if (dto.category?.trim()) {
      sql += ' AND category_name = ?';
      params.push(dto.category.trim());
    }

    // Location filter (partial match)
    if (dto.location?.trim()) {
      sql += ' AND location LIKE ?';
      params.push(`%${dto.location.trim()}%`);
    }

    // Country filter (partial match)
    if (dto.country?.trim()) {
      sql += ' AND country LIKE ?';
      params.push(`%${dto.country.trim()}%`);
    }

    // Order by most recent first
    sql += ' ORDER BY created_at DESC, id DESC';
    
    // Pagination
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return { sql, params };
  }

  /**
   * Get total count of jobs matching filters
   * @private
   */
  private async getJobCount(dto: GetJobsDto): Promise<number> {
    let sql = 'SELECT COUNT(*) as total FROM stellen WHERE 1=1';
    const params: any[] = [];

    if (dto.search?.trim()) {
      sql += ' AND (job_title LIKE ? OR company_name LIKE ? OR content LIKE ?)';
      const searchTerm = `%${dto.search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (dto.category?.trim()) {
      sql += ' AND category_name = ?';
      params.push(dto.category.trim());
    }

    if (dto.location?.trim()) {
      sql += ' AND location LIKE ?';
      params.push(`%${dto.location.trim()}%`);
    }

    if (dto.country?.trim()) {
      sql += ' AND country LIKE ?';
      params.push(`%${dto.country.trim()}%`);
    }

    const result = await this.mysql.queryOne<{ total: number }>(sql, params);
    return result?.total || 0;
  }

  /**
   * Build cache key from DTO
   * @private
   */
  private buildCacheKey(prefix: string, dto: any): string {
    const hash = createHash('md5')
      .update(JSON.stringify(dto))
      .digest('hex')
      .substring(0, 16);
    return `${prefix}:${hash}`;
  }

  /**
   * Get cached data
   * @private
   */
  private async getCachedData<T = any>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      this.logger.warn(`Cache read failed for ${key}: ${error.message}`);
      return null;
    }
  }

  /**
   * Set cached data
   * @private
   */
  private async setCachedData(key: string, data: any): Promise<void> {
    try {
      await this.redis.setex(key, this.CACHE_TTL, JSON.stringify(data));
    } catch (error) {
      this.logger.warn(`Cache write failed for ${key}: ${error.message}`);
    }
  }

  /**
   * Clear cache for jobs
   */
  async clearCache(): Promise<void> {
    try {
      const keys = await this.redis.keys('jobs:*');
      if (keys.length > 0) {
        await Promise.all(keys.map(key => this.redis.del(key)));
        this.logger.log(`Cleared ${keys.length} cache keys`);
      }
    } catch (error) {
      this.logger.error(`Failed to clear cache: ${error.message}`);
    }
  }
}