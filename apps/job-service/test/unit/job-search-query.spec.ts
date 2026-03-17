import { JobSearchQuery } from '../../src/job/value-objects/job-search-query.vo';
import { SearchJobsDto } from '../../src/job/dto/search-jobs.dto';

describe('JobSearchQuery', () => {
  describe('toESQuery', () => {
    it('should build query with full-text search', () => {
      const dto: SearchJobsDto = {
        q: 'javascript developer',
        page: 1,
        limit: 20,
      };

      const query = new JobSearchQuery(dto);
      const esQuery = query.toESQuery() as any;

      expect(esQuery.query.bool.must).toHaveLength(1);
      expect(esQuery.query.bool.must[0].multi_match.query).toBe('javascript developer');
      expect(esQuery.query.bool.must[0].multi_match.fields).toContain('title^3');
      expect(esQuery.query.bool.must[0].multi_match.fields).toContain('description^1');
    });

    it('should build query with city filter', () => {
      const dto: SearchJobsDto = {
        city: 'Berlin',
        page: 1,
        limit: 20,
      };

      const query = new JobSearchQuery(dto);
      const esQuery = query.toESQuery() as any;

      expect(esQuery.query.bool.filter).toContainEqual({
        term: { city: 'Berlin' },
      });
    });

    it('should build query with remote filter', () => {
      const dto: SearchJobsDto = {
        remote: true,
        page: 1,
        limit: 20,
      };

      const query = new JobSearchQuery(dto);
      const esQuery = query.toESQuery() as any;

      expect(esQuery.query.bool.filter).toContainEqual({
        term: { remote: true },
      });
    });

    it('should build query with salary range', () => {
      const dto: SearchJobsDto = {
        salaryMin: 50000,
        salaryMax: 80000,
        page: 1,
        limit: 20,
      };

      const query = new JobSearchQuery(dto);
      const esQuery = query.toESQuery() as any;

      const salaryFilter = esQuery.query.bool.filter.find(
        (f: any) => f.range && f.range.salaryMin
      );

      expect(salaryFilter).toBeDefined();
      expect(salaryFilter.range.salaryMin.gte).toBe(50000);
      expect(salaryFilter.range.salaryMin.lte).toBe(80000);
    });

    it('should always filter for active jobs', () => {
      const dto: SearchJobsDto = {
        page: 1,
        limit: 20,
      };

      const query = new JobSearchQuery(dto);
      const esQuery = query.toESQuery() as any;

      expect(esQuery.query.bool.filter).toContainEqual({
        term: { isActive: true },
      });
    });

    it('should apply pagination correctly', () => {
      const dto: SearchJobsDto = {
        page: 3,
        limit: 10,
      };

      const query = new JobSearchQuery(dto);
      const esQuery = query.toESQuery() as any;

      expect(esQuery.from).toBe(20); // (3-1) * 10
      expect(esQuery.size).toBe(10);
    });

    it('should include score and date sorting', () => {
      const dto: SearchJobsDto = {
        page: 1,
        limit: 20,
      };

      const query = new JobSearchQuery(dto);
      const esQuery = query.toESQuery() as any;

      expect(esQuery.sort).toEqual([
        { _score: { order: 'desc' } },
        { postedAt: { order: 'desc' } },
      ]);
    });

    it('should boost exact phrase matches', () => {
      const dto: SearchJobsDto = {
        q: 'senior developer',
        page: 1,
        limit: 20,
      };

      const query = new JobSearchQuery(dto);
      const esQuery = query.toESQuery() as any;

      expect(esQuery.query.bool.should).toBeDefined();
      expect(esQuery.query.bool.should[0].match_phrase.title.query).toBe('senior developer');
      expect(esQuery.query.bool.should[0].match_phrase.title.boost).toBe(5);
    });
  });
});
