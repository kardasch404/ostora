import { TemplateRendererService } from '../../src/template/template-renderer.service';

describe('TemplateRendererService', () => {
  let service: TemplateRendererService;

  beforeEach(() => {
    service = new TemplateRendererService();
  });

  describe('renderFromString', () => {
    it('should render template with simple placeholders', () => {
      const template = 'Hello {{name}}, welcome to {{company}}!';
      const data = {
        name: 'John Doe',
        company: 'Ostora',
      };

      const result = service.renderFromString(template, data);

      expect(result).toBe('Hello John Doe, welcome to Ostora!');
    });

    it('should handle missing placeholders gracefully', () => {
      const template = 'Hello {{name}}, your email is {{email}}';
      const data = {
        name: 'John Doe',
      };

      const result = service.renderFromString(template, data);

      expect(result).toContain('John Doe');
      expect(result).not.toContain('{{name}}');
    });

    it('should process ~# placeholder substitution', () => {
      const template = 'Hello {{userName}}';
      const data = {
        userName: '~#rh_name',
        rh_name: 'John Doe',
      };

      const result = service.renderFromString(template, data);

      expect(result).toBe('Hello John Doe');
    });

    it('should handle nested objects', () => {
      const template = 'Job: {{job.title}} at {{job.company}}';
      const data = {
        job: {
          title: 'Developer',
          company: 'Tech Corp',
        },
      };

      const result = service.renderFromString(template, data);

      expect(result).toBe('Job: Developer at Tech Corp');
    });

    it('should handle arrays with each helper', () => {
      const template = 'Documents: {{#each documents}}{{this}} {{/each}}';
      const data = {
        documents: ['CV.pdf', 'Cover Letter.pdf'],
      };

      const result = service.renderFromString(template, data);

      expect(result).toContain('CV.pdf');
      expect(result).toContain('Cover Letter.pdf');
    });

    it('should handle conditional rendering', () => {
      const template = '{{#if premium}}Premium User{{else}}Free User{{/if}}';
      
      const premiumResult = service.renderFromString(template, { premium: true });
      const freeResult = service.renderFromString(template, { premium: false });

      expect(premiumResult).toBe('Premium User');
      expect(freeResult).toBe('Free User');
    });

    it('should escape HTML by default', () => {
      const template = 'Message: {{message}}';
      const data = {
        message: '<script>alert("xss")</script>',
      };

      const result = service.renderFromString(template, data);

      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });
  });

  describe('processPlaceholders', () => {
    it('should replace ~# prefixed placeholders', () => {
      const data = {
        userName: '~#rh_name',
        userEmail: '~#rh_email',
        rh_name: 'John Doe',
        rh_email: 'john@example.com',
      };

      const processed = (service as any).processPlaceholders(data);

      expect(processed.userName).toBe('John Doe');
      expect(processed.userEmail).toBe('john@example.com');
    });

    it('should keep original value if ~# reference not found', () => {
      const data = {
        userName: '~#missing_field',
      };

      const processed = (service as any).processPlaceholders(data);

      expect(processed.userName).toBe('~#missing_field');
    });

    it('should not process non-string values', () => {
      const data = {
        count: 42,
        active: true,
        items: ['a', 'b'],
      };

      const processed = (service as any).processPlaceholders(data);

      expect(processed.count).toBe(42);
      expect(processed.active).toBe(true);
      expect(processed.items).toEqual(['a', 'b']);
    });
  });
});
