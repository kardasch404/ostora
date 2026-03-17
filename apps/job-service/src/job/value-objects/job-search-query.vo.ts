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

    // Text search on title and description
    if (this.dto.q) {
      must.push({
        multi_match: {
          query: this.dto.q,
          fields: ['title^2', 'description'],
          type: 'best_fields',
        },
      });
    }

    // Filters
    if (this.dto.city) {
      filter.push({ term: { 'city.keyword': this.dto.city } });
    }

    if (this.dto.country) {
      filter.push({ term: { 'country.keyword': this.dto.country } });
    }

    if (this.dto.remote !== undefined) {
      filter.push({ term: { remote: this.dto.remote } });
    }

    if (this.dto.contractType) {
      filter.push({ term: { 'contractType.keyword': this.dto.contractType } });
    }

    // Salary range
    if (this.dto.salaryMin || this.dto.salaryMax) {
      const salaryRange = new SalaryRange(this.dto.salaryMin, this.dto.salaryMax);
      filter.push({ range: { salary: salaryRange.toESRangeFilter() } });
    }

    // Active jobs only
    filter.push({ term: { isActive: true } });

    const query: any = {
      bool: {
        must: must.length > 0 ? must : [{ match_all: {} }],
        filter,
      },
    };

    return {
      query,
      from: ((this.dto.page || 1) - 1) * (this.dto.limit || 20),
      size: this.dto.limit || 20,
      sort: [{ postedAt: { order: 'desc' } }],
    };
  }
}
