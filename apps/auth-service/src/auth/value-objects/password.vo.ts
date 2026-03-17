import * as bcrypt from 'bcrypt';

export class Password {
  private readonly _hash: string;
  private static readonly BCRYPT_COST = 12;

  private static readonly MIN_LENGTH = 8;
  private static readonly UPPERCASE_REGEX = /[A-Z]/;
  private static readonly LOWERCASE_REGEX = /[a-z]/;
  private static readonly NUMBER_REGEX = /[0-9]/;
  private static readonly SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

  private constructor(hash: string) {
    this._hash = hash;
  }

  static async create(plain: string): Promise<Password> {
    if (plain.length < Password.MIN_LENGTH) {
      throw new Error(`Password must be at least ${Password.MIN_LENGTH} characters long`);
    }

    if (!Password.UPPERCASE_REGEX.test(plain)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (!Password.LOWERCASE_REGEX.test(plain)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (!Password.NUMBER_REGEX.test(plain)) {
      throw new Error('Password must contain at least one number');
    }

    if (!Password.SPECIAL_CHAR_REGEX.test(plain)) {
      throw new Error('Password must contain at least one special character');
    }

    const hash = await bcrypt.hash(plain, Password.BCRYPT_COST);
    return new Password(hash);
  }

  static fromHash(hash: string): Password {
    return new Password(hash);
  }

  get hash(): string {
    return this._hash;
  }

  async compare(plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this._hash);
  }
}
