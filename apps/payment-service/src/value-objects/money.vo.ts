export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: 'MAD' | 'USD',
  ) {
    if (amount < 0) throw new Error('Amount cannot be negative');
  }

  toUSD(): Money {
    if (this.currency === 'USD') return this;
    return new Money(Math.round(this.amount / 10), 'USD');
  }

  toMAD(): Money {
    if (this.currency === 'MAD') return this;
    return new Money(this.amount * 10, 'MAD');
  }

  toCents(): number {
    return Math.round(this.amount * 100);
  }

  static fromCents(cents: number, currency: 'MAD' | 'USD'): Money {
    return new Money(cents / 100, currency);
  }
}
