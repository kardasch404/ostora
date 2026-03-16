import { Injectable } from '@nestjs/common';
import { TemplatePlaceholder } from './placeholder.enum';

export interface RenderContext {
  rhName?: string;
  rhFirstName?: string;
  rhLastName?: string;
  jobTitle?: string;
  companyName?: string;
  senderName?: string;
  senderFirstName?: string;
  senderLastName?: string;
  senderEmail?: string;
  senderPhone?: string;
  senderSignature?: string;
  jobLocation?: string;
  jobSalary?: string;
  applicationDate?: string;
}

@Injectable()
export class TemplateRendererService {
  render(template: string, context: RenderContext): string {
    let rendered = template;

    // Replace all placeholders
    rendered = rendered.replace(new RegExp(TemplatePlaceholder.RH_NAME, 'g'), context.rhName || '[Recruiter Name]');
    rendered = rendered.replace(new RegExp(TemplatePlaceholder.RH_FIRST_NAME, 'g'), context.rhFirstName || '[Recruiter First Name]');
    rendered = rendered.replace(new RegExp(TemplatePlaceholder.RH_LAST_NAME, 'g'), context.rhLastName || '[Recruiter Last Name]');
    rendered = rendered.replace(new RegExp(TemplatePlaceholder.JOB_TITLE, 'g'), context.jobTitle || '[Job Title]');
    rendered = rendered.replace(new RegExp(TemplatePlaceholder.COMPANY_NAME, 'g'), context.companyName || '[Company Name]');
    rendered = rendered.replace(new RegExp(TemplatePlaceholder.SENDER_NAME, 'g'), context.senderName || '[Your Name]');
    rendered = rendered.replace(new RegExp(TemplatePlaceholder.SENDER_FIRST_NAME, 'g'), context.senderFirstName || '[Your First Name]');
    rendered = rendered.replace(new RegExp(TemplatePlaceholder.SENDER_LAST_NAME, 'g'), context.senderLastName || '[Your Last Name]');
    rendered = rendered.replace(new RegExp(TemplatePlaceholder.SENDER_EMAIL, 'g'), context.senderEmail || '[Your Email]');
    rendered = rendered.replace(new RegExp(TemplatePlaceholder.SENDER_PHONE, 'g'), context.senderPhone || '[Your Phone]');
    rendered = rendered.replace(new RegExp(TemplatePlaceholder.SENDER_SIGNATURE, 'g'), context.senderSignature || '[Your Signature]');
    rendered = rendered.replace(new RegExp(TemplatePlaceholder.JOB_LOCATION, 'g'), context.jobLocation || '[Job Location]');
    rendered = rendered.replace(new RegExp(TemplatePlaceholder.JOB_SALARY, 'g'), context.jobSalary || '[Salary Range]');
    rendered = rendered.replace(new RegExp(TemplatePlaceholder.APPLICATION_DATE, 'g'), context.applicationDate || new Date().toLocaleDateString());
    rendered = rendered.replace(new RegExp(TemplatePlaceholder.CURRENT_DATE, 'g'), new Date().toLocaleDateString());

    return rendered;
  }

  extractPlaceholders(template: string): string[] {
    const placeholderRegex = /~#[a-z_]+/g;
    const matches = template.match(placeholderRegex);
    return matches ? [...new Set(matches)] : [];
  }
}
