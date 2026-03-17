export class SalaryRange {
  constructor(
    public readonly min?: number,
    public readonly max?: number,
    public readonly currency: string = 'EUR'
  ) {
    if (min !== undefined && min <= 0) throw new Error('Min salary must be > 0');
    if (max !== undefined && min !== undefined && max <= min) throw new Error('Max salary must be > min');
  }

  toESRangeFilter(): object {
    const filter: any = {};
    if (this.min !== undefined) filter.gte = this.min;
    if (this.max !== undefined) filter.lte = this.max;
    return filter;
  }

  toString(): string {
    if (this.min !== undefined && this.max !== undefined) return `${this.min}-${this.max} ${this.currency}`;
    if (this.min !== undefined) return `${this.min}+ ${this.currency}`;
    if (this.max !== undefined) return `Up to ${this.max} ${this.currency}`;
    return 'Not specified';
  }
}
