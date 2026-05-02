import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySQLService } from '../mysql/mysql.service';
import { RedisService } from '../redis/redis.service';
import { GetJobsDto } from './dto/get-jobs.dto';
import { createHash } from 'crypto';
import { RowDataPacket } from 'mysql2';

interface StellenJob extends RowDataPacket {
  id: number;
  job_title: string;
  job_url: string;
  company_name: string;
  company_logo_url: string;
  company_profile_url: string;
  company_website_url: string;
  company_description: string;
  category_name: string;
  category_slug: string;
  city: string;
  postal_code: string;
  full_address: string;
  contact_name: string;
  contact_position: string;
  contact_email: string;
  contact_phone: string;
  contact_image_url: string;
  contacts: string;
  employment_type: string;
  salary: string;
  start_date: string;
  raw_html: string;
  extracted_text: string;
  source_name: string;
  source_url: string;
  status: string;
  quality_score: string;
  country: string;
  language: string;
  posted_at: Date;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

// Columns safe to return in list (no heavy raw_html / extracted_text)
const LIST_COLUMNS = [
  'id', 'job_title', 'job_url', 'company_name', 'company_logo_url',
  'company_profile_url', 'company_website_url', 'company_description',
  'category_name', 'category_slug', 'city', 'postal_code', 'full_address',
  'contact_name', 'contact_position', 'contact_email', 'contact_phone',
  'contact_image_url', 'contacts', 'employment_type', 'salary', 'start_date',
  'source_name', 'status', 'quality_score', 'country', 'language',
  'posted_at', 'expires_at', 'created_at',
].join(', ');

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
   * Get categories as hierarchy: parent slugs -> children job titles
   * Built dynamically from DB data using keyword matching. Cached 1 hour.
   */
  async getCategoriesHierarchy(): Promise<{ slug: string; label: string; children: string[] }[]> {
    const cacheKey = 'categories:hierarchy';
    const cached = await this.getCachedData<{ slug: string; label: string; children: string[] }[]>(cacheKey);
    if (cached) return cached;

    const rows = await this.mysql.query<{ category_name: string }>(
      'SELECT DISTINCT category_name FROM stellen WHERE category_name IS NOT NULL AND category_name != "" ORDER BY category_name ASC'
    );
    const all = rows.map(r => r.category_name).filter(Boolean);

    // Parent slugs are lowercase kebab-case already present in the data
    const parentSlugs = all.filter(c => /^[a-z][a-z0-9-]+$/.test(c));
    const children   = all.filter(c => !/^[a-z][a-z0-9-]+$/.test(c));

    // Keyword map: slug -> keywords to match against child category names
    const keywordMap: Record<string, string[]> = {
      'it-und-edv':                       ['informatik', 'software', 'it-', 'edv', 'digital', 'computer', 'programmier', 'webdesign', 'data analyst', 'informationselektroniker', 'it-systemelektroniker'],
      'gesundheit-pflege-und-medizin':    ['pflege', 'arzt', 'medizin', 'kranken', 'gesundheit', 'therapeut', 'physiother', 'ergother', 'logop', 'notfall', 'rettungs', 'mta', 'pta', 'mfa', 'hebamm', 'zahntechn', 'apothek', 'podolog', 'orthop'],
      'handwerk-und-produktion':          ['mechaniker', 'schwei', 'tischler', 'zimmerer', 'maurer', 'elektriker', 'installateur', 'klempner', 'maler', 'lackierer', 'anlagenmechaniker', 'werkzeug', 'zerspanungs', 'konstruktions', 'industriemechaniker'],
      'kaufmaennisches-buero-und-verwaltung': ['kauffrau', 'kaufmann', 'kaufm', 'verwaltung', 'sachbearbeiter', 'buchhalter', 'steuerfach'],
      'finanzen-versicherungen-und-recht': ['finanzberater', 'versicherungsfach', 'steuerberater', 'rechtsanwalt', 'notar', 'wirtschaftspr', 'finanzb'],
      'logistik-und-verkehr':             ['logistik', 'fahrer', 'transport', 'spedition', 'lokf', 'busfahrer', 'schifffahrt', 'schiffsmechaniker', 'nautisch', 'zoll', 'zugbegleiter'],
      'medien-und-gestaltung':            ['designer', 'mediengest', 'grafik', 'journalist', 'lektor', 'game ', 'content creator', 'influencer', 'social media', 'medienkauf', 'medientechnolog'],
      'hotel-und-gastronomie':            ['hotel', 'koch', 'gastro', 'konditor', 'restaur', 'tourismuskauf', 'veranstaltungskauf'],
      'sozialwesen':                      ['sozial', 'erzieher', 'heilp', 'heilerziehung', 'schulbegleiter', 'betreuungsassistent'],
      'bauwesen-und-immobilien':          ['immobilien', 'architekt', 'vermessungs', 'tiefbau', 'hochbau', 'stuckateur', 'trockenbau', 'gleisbauer', 'rohrleitungs', 'spezialtiefbau'],
      'umwelt-landwirtschaft-und-tiere':  ['umwelt', 'landwirt', 'tierpfleger', 'tierwirt', 'tierarzt', 'tiermedizin', 'g\u00e4rtner', 'f\u00f6rster', 'winzer', 'agrar', 'pflanzentechnolog'],
      'freizeit-und-tourismus':           ['freizeit', 'fitnesstr', 'sportassistent', 'sport- und fitness', 'tourismus'],
      'schutz-und-sicherheit':            ['polizist', 'feuerwehr', 'soldat', 'detektiv', 'personensch', 'servicekraft f\u00fcr schutz', 'ordnungsamt'],
      'lebensmittel':                     ['lebensmittel', 's\u00fc\u00dfwarentechnolog', 'milchtechnolog', 'weintechnolog', 'verfahrenstechnologe in der m\u00fchlen'],
      'naturwissenschaft-und-forschung':  ['chemisch-technisch', 'biologisch-technisch', 'physiklaborant', 'lacklaborant', 'milchwirtschaftliche', 'mikrotechnolog'],
      'sprachen':                         ['\u00fcbersetzer', 'dolmetscher', 'fremdsprachen', 'europ\u00e4sekret'],
      'mechatronik':                      ['mechatroniker'],
      'metall':                           ['metallbauer', 'metallbildner', 'schmied', 'gie\u00dfereimechaniker', 'stanz- und umform'],
      'elektroik':                        ['elektrotechniker', 'industrieelektriker', 'informationstechnische'],
      'technik':                          ['techniker', 'bautechniker', 'kraftfahrzeugtechniker', 'maschinentechniker', 'medizintechniker', 'umweltschutztechniker'],
      'kultur':                           ['restaurator', 'maskenbildner', 'synchronsprecher', 'musikfachh'],
      'glas-holz-papier-und-farbe':       ['glas', 'holz', 'papier', 'tatortreiniger'],
      'systemrelevant':                   ['systemrelevant'],
      'handwerk':                         ['goldschmied', 'uhrmacher', 'schneider', 'schuster', 'seiler', 'sattler', 'parkettleger', 'raumausstatter'],
    };

    const childToParent = new Map<string, string>();
    for (const child of children) {
      const lower = child.toLowerCase();
      let matched = 'general';
      for (const slug of parentSlugs) {
        const kws = keywordMap[slug] ?? [];
        if (kws.some(kw => lower.includes(kw))) {
          matched = slug;
          break;
        }
      }
      childToParent.set(child, matched);
    }

    const hierarchy = parentSlugs
      .map(slug => ({
        slug,
        label: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        children: children.filter(c => childToParent.get(c) === slug),
      }))
      .filter(h => h.children.length > 0);

    const unmapped = children.filter(c => childToParent.get(c) === 'general');
    if (unmapped.length > 0) {
      hierarchy.push({ slug: 'general', label: 'General', children: unmapped });
    }

    await this.redis.setex(cacheKey, 3600, JSON.stringify(hierarchy));
    return hierarchy;
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
    if (cached) return cached;

    try {
      // SELECT * to include raw_html and all detail fields
      const job = await this.mysql.queryOne<StellenJob>(
        'SELECT * FROM stellen WHERE id = ?',
        [id]
      );

      if (!job) throw new NotFoundException(`Job with ID ${id} not found`);

      await this.setCachedData(cacheKey, job);
      return job;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
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
    let sql = `SELECT ${LIST_COLUMNS} FROM stellen WHERE 1=1`;
    const params: any[] = [];

    // Only apply search if non-empty (prevents LIKE %% full-table scan)
    if (dto.search?.trim()) {
      sql += ' AND (job_title LIKE ? OR company_name LIKE ?)';
      const s = `%${dto.search.trim()}%`;
      params.push(s, s);
    }

    if (dto.company?.trim()) {
      sql += ' AND company_name LIKE ?';
      params.push(`%${dto.company.trim()}%`);
    }

    if (dto.category?.trim()) {
      sql += ' AND category_name = ?';
      params.push(dto.category.trim());
    }

    if (dto.location?.trim()) {
      sql += ' AND (city LIKE ? OR full_address LIKE ?)';
      const l = `%${dto.location.trim()}%`;
      params.push(l, l);
    }

    if (dto.country?.trim()) {
      sql += ' AND country LIKE ?';
      params.push(`%${dto.country.trim()}%`);
    }

    if (dto.employmentType?.trim()) {
      sql += ' AND employment_type = ?';
      params.push(dto.employmentType.trim());
    }

    if (dto.startDateFrom?.trim()) {
      sql += ' AND start_date >= ?';
      params.push(dto.startDateFrom.trim());
    }

    sql += ' ORDER BY posted_at DESC, id DESC LIMIT ? OFFSET ?';
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
      sql += ' AND (job_title LIKE ? OR company_name LIKE ?)';
      const s = `%${dto.search.trim()}%`;
      params.push(s, s);
    }

    if (dto.company?.trim()) {
      sql += ' AND company_name LIKE ?';
      params.push(`%${dto.company.trim()}%`);
    }

    if (dto.category?.trim()) {
      sql += ' AND category_name = ?';
      params.push(dto.category.trim());
    }

    if (dto.location?.trim()) {
      sql += ' AND (city LIKE ? OR full_address LIKE ?)';
      const l = `%${dto.location.trim()}%`;
      params.push(l, l);
    }

    if (dto.country?.trim()) {
      sql += ' AND country LIKE ?';
      params.push(`%${dto.country.trim()}%`);
    }

    if (dto.employmentType?.trim()) {
      sql += ' AND employment_type = ?';
      params.push(dto.employmentType.trim());
    }

    if (dto.startDateFrom?.trim()) {
      sql += ' AND start_date >= ?';
      params.push(dto.startDateFrom.trim());
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