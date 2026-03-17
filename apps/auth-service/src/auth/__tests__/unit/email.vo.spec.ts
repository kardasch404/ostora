import { Email } from '../../value-objects/email.vo';

describe('Email Value Object', () => {
  describe('Valid email formats', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'john.doe@company.co.uk',
        'test+tag@domain.org',
        'user_name@sub.domain.com',
        'a@b.co',
        'test.email@example.com',
      ];

      validEmails.forEach((email) => {
        expect(() => new Email(email)).not.toThrow();
        expect(new Email(email).value).toBe(email.toLowerCase());
      });
    });

    it('should normalize email to lowercase', () => {
      const email = new Email('User@Example.COM');
      expect(email.value).toBe('user@example.com');
    });

    it('should trim whitespace from email', () => {
      const email = new Email('  user@example.com  ');
      expect(email.value).toBe('user@example.com');
    });
  });

  describe('Invalid email formats', () => {
    it('should reject empty email', () => {
      expect(() => new Email('')).toThrow('Invalid email format');
    });

    it('should reject email without @', () => {
      expect(() => new Email('notanemail')).toThrow('Invalid email format');
    });

    it('should reject email without domain', () => {
      expect(() => new Email('user@')).toThrow('Invalid email format');
    });

    it('should reject email without local part', () => {
      expect(() => new Email('@example.com')).toThrow('Invalid email format');
    });

    it('should reject email with spaces', () => {
      expect(() => new Email('user @example.com')).toThrow('Invalid email format');
    });
  });

  describe('Disposable email domains', () => {
    it('should reject tempmail.com', () => {
      expect(() => new Email('user@tempmail.com')).toThrow(
        'Disposable email addresses are not allowed',
      );
    });

    it('should reject guerrillamail.com', () => {
      expect(() => new Email('test@guerrillamail.com')).toThrow(
        'Disposable email addresses are not allowed',
      );
    });

    it('should reject 10minutemail.com', () => {
      expect(() => new Email('fake@10minutemail.com')).toThrow(
        'Disposable email addresses are not allowed',
      );
    });

    it('should reject mailinator.com', () => {
      expect(() => new Email('spam@mailinator.com')).toThrow(
        'Disposable email addresses are not allowed',
      );
    });

    it('should accept gmail.com', () => {
      expect(() => new Email('user@gmail.com')).not.toThrow();
    });

    it('should accept outlook.com', () => {
      expect(() => new Email('test@outlook.com')).not.toThrow();
    });

    it('should accept company domains', () => {
      expect(() => new Email('work@company.com')).not.toThrow();
    });
  });

  describe('Email equality', () => {
    it('should consider emails equal regardless of case', () => {
      const email1 = new Email('User@Example.com');
      const email2 = new Email('user@example.com');
      expect(email1.value).toBe(email2.value);
    });

    it('should consider emails equal after trimming', () => {
      const email1 = new Email('  user@example.com  ');
      const email2 = new Email('user@example.com');
      expect(email1.value).toBe(email2.value);
    });
  });

  describe('Edge cases', () => {
    it('should handle email with numbers', () => {
      const email = new Email('user123@example456.com');
      expect(email.value).toBe('user123@example456.com');
    });

    it('should handle email with hyphens', () => {
      const email = new Email('user-name@my-domain.com');
      expect(email.value).toBe('user-name@my-domain.com');
    });

    it('should handle email with plus sign', () => {
      const email = new Email('user+tag@example.com');
      expect(email.value).toBe('user+tag@example.com');
    });
  });
});
