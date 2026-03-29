export class ProviderMetrics {
  constructor(
    public readonly provider: string,
    public readonly requestCount: number,
    public readonly avgResponseTime: number,
    public readonly errorRate: number,
  ) {}
}

export class QuotaStatus {
  constructor(
    public readonly used: number,
    public readonly remaining: number,
    public readonly total: number,
    public readonly resetAt: Date,
  ) {}

  get percentage(): number {
    return (this.used / this.total) * 100;
  }

  get isNearLimit(): boolean {
    return this.percentage >= 95;
  }
}

export class TaskPriority {
  static readonly HIGH = 1;
  static readonly MEDIUM = 2;
  static readonly LOW = 3;

  constructor(public readonly value: number) {}

  isHigher(other: TaskPriority): boolean {
    return this.value < other.value;
  }
}
