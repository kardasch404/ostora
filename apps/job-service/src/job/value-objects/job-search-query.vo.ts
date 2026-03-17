import { SearchJobsDto } from '../dto/search-jobs.dto';
import { SalaryRange } from './salary-range.vo';

export class JobSearchQuery {
  private dto: SearchJobsDto;

  constructor(dto: SearchJobsDto) {
    this.dto = dto;
  }

  toESQuery(): object {
    const must: any[] = [];
    const filter: any[] = [];
    const should: any[] = [];

    // Full-text search on title and description
    if (this.dto.q) {
      must.push({
        multi_match: {
          query: this.dto.q,
          fields: ['title^3', 'description^1', 'requirements^1', 'company^2'],
          type: 'best_fields',
          fuzziness: 'AUTO',
          operator: 'or',
        },
      });

      // Boost exact matches
      should.push({
        match_phrase: {
          title: {
            query: this.dto.q,
            boost: 5,
          },
        },
      });
    }

    // City filter
    if (this.dto.city) {
      filter.push({ term: { city: this.dto.city } });
    }

    // Country filter
    if (this.dto.country) {
      filter.push({ term: { country: this.dto.country } });
    }

    // Remote filter
    if (this.dto.remote !== undefined) {
      filter.push({ term: { remote: this.dto.remote } });
    }

    // Contract type filter
    if (this.dto.contractType) {
      filter.push({ term: { contractType: this.dto.contractType } });
    }

    // Salary range filter using SalaryRange VO
    if (this.dto.salaryMin || this.dto.salaryMax) {
      const salaryRange = new SalaryRange(this.dto.salaryMin, this.dto.salaryMax);
      filter.push({ range: { salaryMin: salaryRange.toESRangeFilter() } });
    }

    // Only active jobs
    filter.push({ term: { isActive: true } });

    // Build query
    const query: any = {
      bool: {
        must: must.length > 0 ? must : [{ match_all: {} }],
        filter,
      },
    };

    if (should.length > 0) {
      query.bool.should = should;
      query.bool.minimum_should_match = 0;
    }

    // Pagination
    const page = this.dto.page || 1;
    const limit = this.dto.limit || 20;
    const from = (page - 1) * limit;

    return {
      query,
      from,
      size: limit,
      sort: [
        { _score: { order: 'desc' } },
        { postedAt: { order: 'desc' } },
      ],
      track_total_hits: true,
    };
  }
}
