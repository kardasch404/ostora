import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import Handlebars from 'handlebars';

@Injectable()
export class TemplateRegistryService implements OnModuleInit {
  private readonly templates = new Map<string, Handlebars.TemplateDelegate>();

  onModuleInit() {
    const candidateDirs = [
      resolve(process.cwd(), 'apps/ostoracv-service/src/templates'),
      resolve(__dirname, '../templates'),
    ];

    const templateDir = candidateDirs.find((dir) => existsSync(dir));
    if (!templateDir) {
      throw new Error('Could not locate ostoracv templates directory.');
    }

    const files = readdirSync(templateDir).filter((file) => file.endsWith('.hbs'));

    for (const fileName of files) {
      const fullPath = join(templateDir, fileName);
      const rawTemplate = readFileSync(fullPath, 'utf-8');
      const templateId = basename(fileName, '.hbs');
      this.templates.set(templateId, Handlebars.compile(rawTemplate));
    }
  }

  get(templateId: string): Handlebars.TemplateDelegate {
    const found = this.templates.get(templateId);
    if (!found) {
      throw new NotFoundException(`Template ${templateId} not found.`);
    }

    return found;
  }

  render(templateId: string, data: Record<string, unknown>): string {
    const compiled = this.get(templateId);
    return compiled(data);
  }

  listTemplateIds(): string[] {
    return Array.from(this.templates.keys());
  }
}
