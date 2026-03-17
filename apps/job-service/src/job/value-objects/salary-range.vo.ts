export class SalaryRange {
  constructor(
    public readonly min?: number,
    public readonly max?: number,
    public readonly currency: string = 'EUR'
  ) {
    if (min && min <= 0) throw new Error('Min salary must be > 0');
    if (max && min && max < min) throw new Error('Max salary must be > min');
  }

  toESRangeFilter(): object {
    const filter: any = {};
    if (this.min) filter.gte = this.min;
    if (this.max) filter.lte = this.max;
    return filter;
  }

  toString(): string {
    if (this.min && this.max) return `${this.min}-${this.max} ${this.currency}`;
    if (this.min) return `${this.min}+ ${this.currency}`;
    if (this.max) return `Up to ${this.max} ${this.currency}`;
    return 'Not specified';
  }
}
