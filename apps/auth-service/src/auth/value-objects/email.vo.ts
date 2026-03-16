export class Email {
  private readonly _value: string;

  private static readonly DISPOSABLE_DOMAINS = [
    'tempmail.com',
    '10minutemail.com',
    'guerrillamail.com',
    'mailinator.com',
    'throwaway.email',
    'temp-mail.org',
    'fakeinbox.com',
    'trashmail.com',
    'yopmail.com',
    'maildrop.cc',
  ];

  private static readonly EMAIL_REGEX =
    /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  constructor(raw: string) {
    const normalized = raw.trim().toLowerCase();

    if (!Email.EMAIL_REGEX.test(normalized)) {
      throw new Error('Invalid email format');
    }

    const domain = normalized.split('@')[1];
    if (Email.DISPOSABLE_DOMAINS.includes(domain)) {
      throw new Error('Disposable email addresses are not allowed');
    }

    this._value = normalized;
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
