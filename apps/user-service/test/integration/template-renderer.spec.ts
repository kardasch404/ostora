import { Test, TestingModule } from '@nestjs/testing';
import { TemplateRendererService } from '../../src/message-template/template-renderer.service';

describe('MessageTemplate Placeholder Substitution (Integration)', () => {
  let service: TemplateRendererService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplateRendererService],
    }).compile();

    service = module.get<TemplateRendererService>(TemplateRendererService);
  });

  describe('render', () => {
    it('should substitute all placeholders correctly', () => {
      const template = `Dear ~#rh_name,

I am writing to express my interest in the ~#job_title position at ~#company_name.

With my background in software development, I believe I would be a great fit for your team.

Best regards,
~#sender_name
~#sender_email
~#sender_phone`;

      const context = {
        rhName: 'John Smith',
        jobTitle: 'Senior Developer',
        companyName: 'Tech Corp',
        senderName: 'Jane Doe',
        senderEmail: 'jane@example.com',
        senderPhone: '+1234567890',
      };

      const result = service.render(template, context);

      expect(result).toContain('Dear John Smith,');
      expect(result).toContain('Senior Developer position at Tech Corp');
      expect(result).toContain('Jane Doe');
      expect(result).toContain('jane@example.com');
      expect(result).toContain('+1234567890');
      expect(result).not.toContain('~#');
    });

    it('should use fallback values for missing placeholders', () => {
      const template = 'Dear ~#rh_name, I am interested in ~#job_title at ~#company_name.';
      const context = {
        rhName: 'John Smith',
        // jobTitle and companyName missing
      };

      const result = service.render(template, context);

      expect(result).toContain('Dear John Smith');
      expect(result).toContain('[Job Title]');
      expect(result).toContain('[Company Name]');
    });

    it('should handle multiple occurrences of same placeholder', () => {
      const template = '~#company_name is a great company. I want to work at ~#company_name.';
      const context = {
        companyName: 'Tech Corp',
      };

      const result = service.render(template, context);

      expect(result).toBe('Tech Corp is a great company. I want to work at Tech Corp.');
    });

    it('should handle all supported placeholders', () => {
      const template = `
~#rh_name
~#rh_first_name
~#rh_last_name
~#job_title
~#company_name
~#sender_name
~#sender_first_name
~#sender_last_name
~#sender_email
~#sender_phone
~#sender_signature
~#job_location
~#job_salary
~#application_date
~#current_date
`;

      const context = {
        rhName: 'John Smith',
        rhFirstName: 'John',
        rhLastName: 'Smith',
        jobTitle: 'Developer',
        companyName: 'Tech Corp',
        senderName: 'Jane Doe',
        senderFirstName: 'Jane',
        senderLastName: 'Doe',
        senderEmail: 'jane@example.com',
        senderPhone: '+1234567890',
        senderSignature: 'Best regards, Jane',
        jobLocation: 'Berlin',
        jobSalary: '€80,000',
        applicationDate: '2024-01-15',
      };

      const result = service.render(template, context);

      expect(result).toContain('John Smith');
      expect(result).toContain('John');
      expect(result).toContain('Smith');
      expect(result).toContain('Developer');
      expect(result).toContain('Tech Corp');
      expect(result).toContain('Jane Doe');
      expect(result).toContain('Jane');
      expect(result).toContain('Doe');
      expect(result).toContain('jane@example.com');
      expect(result).toContain('+1234567890');
      expect(result).toContain('Best regards, Jane');
      expect(result).toContain('Berlin');
      expect(result).toContain('€80,000');
      expect(result).toContain('2024-01-15');
    });

    it('should auto-populate current date', () => {
      const template = 'Date: ~#current_date';
      const context = {};

      const result = service.render(template, context);

      expect(result).toMatch(/Date: \d{1,2}\/\d{1,2}\/\d{4}/);
    });
  });

  describe('extractPlaceholders', () => {
    it('should extract all unique placeholders from template', () => {
      const template = `Dear ~#rh_name,
I am interested in ~#job_title at ~#company_name.
~#company_name is a great company.
Best regards,
~#sender_name`;

      const result = service.extractPlaceholders(template);

      expect(result).toHaveLength(4);
      expect(result).toContain('~#rh_name');
      expect(result).toContain('~#job_title');
      expect(result).toContain('~#company_name');
      expect(result).toContain('~#sender_name');
    });

    it('should return empty array if no placeholders found', () => {
      const template = 'This is a plain text template without placeholders.';

      const result = service.extractPlaceholders(template);

      expect(result).toEqual([]);
    });

    it('should handle template with only placeholders', () => {
      const template = '~#rh_name ~#job_title ~#company_name';

      const result = service.extractPlaceholders(template);

      expect(result).toHaveLength(3);
    });
  });
});
