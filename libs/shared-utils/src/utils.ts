import * as bcrypt from 'bcrypt';
import { createHash, createHmac } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { v7 as uuidv7 } from 'uuidv7';

// ==================== CRYPTO UTIL ====================

export class CryptoUtil {
  private static readonly SALT_ROUNDS = 12;

  /**
   * Hash a password using bcrypt
   * @param password Plain text password
   * @returns Hashed password
   */
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare plain text password with hashed password
   * @param password Plain text password
   * @param hashedPassword Hashed password
   * @returns True if passwords match
   */
  static async compare(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generate a random token
   * @param length Token length
   * @returns Random token
   */
  static generateToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Generate a random numeric code
   * @param length Code length
   * @returns Random numeric code
   */
  static generateNumericCode(length: number = 6): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }
}

// ==================== DATE UTIL ====================

export class DateUtil {
  /**
   * Add days to a date
   * @param date Base date
   * @param days Number of days to add
   * @returns New date
   */
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Add hours to a date
   * @param date Base date
   * @param hours Number of hours to add
   * @returns New date
   */
  static addHours(date: Date, hours: number): Date {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  }

  /**
   * Add minutes to a date
   * @param date Base date
   * @param minutes Number of minutes to add
   * @returns New date
   */
  static addMinutes(date: Date, minutes: number): Date {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  }

  /**
   * Check if date is in the past
   * @param date Date to check
   * @returns True if date is in the past
   */
  static isPast(date: Date): boolean {
    return date < new Date();
  }

  /**
   * Check if date is in the future
   * @param date Date to check
   * @returns True if date is in the future
   */
  static isFuture(date: Date): boolean {
    return date > new Date();
  }

  /**
   * Get difference in days between two dates
   * @param date1 First date
   * @param date2 Second date
   * @returns Difference in days
   */
  static diffInDays(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get difference in hours between two dates
   * @param date1 First date
   * @param date2 Second date
   * @returns Difference in hours
   */
  static diffInHours(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60));
  }

  /**
   * Format date to ISO string
   * @param date Date to format
   * @returns ISO string
   */
  static toISOString(date: Date): string {
    return date.toISOString();
  }

  /**
   * Get start of day
   * @param date Date
   * @returns Start of day
   */
  static startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get end of day
   * @param date Date
   * @returns End of day
   */
  static endOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Check if two dates are on the same day
   * @param date1 First date
   * @param date2 Second date
   * @returns True if same day
   */
  static isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
}

// ==================== UUID UTIL ====================

export class UuidUtil {
  /**
   * Generate UUID v4
   * @returns UUID v4
   */
  static v4(): string {
    return uuidv4();
  }

  /**
   * Generate UUID v7 (time-ordered)
   * @returns UUID v7
   */
  static v7(): string {
    return uuidv7();
  }

  /**
   * Validate UUID format
   * @param uuid UUID to validate
   * @returns True if valid UUID
   */
  static isValid(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Generate short ID (8 characters)
   * @returns Short ID
   */
  static short(): string {
    return uuidv4().split('-')[0];
  }
}

// ==================== HASH UTIL ====================

export class HashUtil {
  static sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  static sha512(value: string): string {
    return createHash('sha512').update(value).digest('hex');
  }

  static md5(value: string): string {
    return createHash('md5').update(value).digest('hex');
  }

  static hmacSha256(value: string, secret: string): string {
    return createHmac('sha256', secret).update(value).digest('hex');
  }
}

// ==================== STRING UTIL ====================

export class StringUtil {
  /**
   * Slugify a string
   * @param text Text to slugify
   * @returns Slugified string
   */
  static slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  /**
   * Truncate string
   * @param text Text to truncate
   * @param length Maximum length
   * @param suffix Suffix to add
   * @returns Truncated string
   */
  static truncate(text: string, length: number, suffix: string = '...'): string {
    if (text.length <= length) {
      return text;
    }
    return text.substring(0, length - suffix.length) + suffix;
  }

  /**
   * Capitalize first letter
   * @param text Text to capitalize
   * @returns Capitalized string
   */
  static capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  /**
   * Generate random string
   * @param length String length
   * @returns Random string
   */
  static random(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Mask sensitive data
   * @param text Text to mask
   * @param visibleChars Number of visible characters at start and end
   * @returns Masked string
   */
  static mask(text: string, visibleChars: number = 4): string {
    if (text.length <= visibleChars * 2) {
      return '*'.repeat(text.length);
    }
    const start = text.substring(0, visibleChars);
    const end = text.substring(text.length - visibleChars);
    const masked = '*'.repeat(text.length - visibleChars * 2);
    return `${start}${masked}${end}`;
  }
}

// ==================== ARRAY UTIL ====================

export class ArrayUtil {
  /**
   * Chunk array into smaller arrays
   * @param array Array to chunk
   * @param size Chunk size
   * @returns Chunked array
   */
  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Remove duplicates from array
   * @param array Array with duplicates
   * @returns Array without duplicates
   */
  static unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  }

  /**
   * Shuffle array
   * @param array Array to shuffle
   * @returns Shuffled array
   */
  static shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Get random element from array
   * @param array Array
   * @returns Random element
   */
  static random<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}
