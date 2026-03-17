import { Injectable, Logger } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TemplateRendererService {
  private readonly logger = new Logger(TemplateRendererService.name);
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    this.loadTemplates();
  }

  private loadTemplates() {
    const templateDir = path.join(__dirname, '../hbs');
    const files = [
      'verification.hbs',
      'password-reset.hbs',
      'password-changed.hbs',
      'new-device-login.hbs',
      'otp.hbs',
      'application.hbs',
      'welcome.hbs',
    ];

    files.forEach((file) => {
      try {
        const filePath = path.join(templateDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const template = Handlebars.compile(content);
        const key = file.replace('.hbs', '');
        this.templates.set(key, template);
        this.logger.log(`Loaded template: ${key}`);
      } catch (error) {
        this.logger.error(`Failed to load template: ${file}`, error);
      }
    });
  }

  render(templateName: string, data: Record<string, any>): string {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    // Replace placeholders like ~#rh_name with actual values
    const processedData = this.processPlaceholders(data);
    return template(processedData);
  }

  renderFromString(templateString: string, data: Record<string, any>): string {
    const template = Handlebars.compile(templateString);
    const processedData = this.processPlaceholders(data);
    return template(processedData);
  }

  private processPlaceholders(data: Record<string, any>): Record<string, any> {
    const processed: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && value.startsWith('~#')) {
        const actualKey = value.substring(2);
        processed[key] = data[actualKey] || value;
      } else {
        processed[key] = value;
      }
    }
    
    return processed;
  }
}
