import { Injectable } from '@nestjs/common';
import { SYSTEM_PROMPTS, PromptType } from './system-prompts.config';

@Injectable()
export class PromptBuilderService {
  getSystemPrompt(type: PromptType, language: 'en' | 'fr' | 'de' = 'en'): string {
    return SYSTEM_PROMPTS[language][type] || SYSTEM_PROMPTS.en[type];
  }

  buildCvAnalysisPrompt(cvText: string, jobDescription: string): string {
    return `CV:\n${cvText}\n\nJob Description:\n${jobDescription}\n\nProvide analysis with match score, strengths, missing skills, and suggestions.`;
  }

  buildCoverLetterPrompt(cvText: string, jobDescription: string, companyName: string): string {
    return `Create a cover letter for this job application.\n\nCV:\n${cvText}\n\nJob Description:\n${jobDescription}\n\nCompany: ${companyName}`;
  }

  buildJobMatchPrompt(cvText: string, jobs: any[]): string {
    const jobList = jobs.map((j, i) => `${i + 1}. ${j.title} at ${j.company}`).join('\n');
    return `Match this CV to the best jobs:\n\nCV:\n${cvText}\n\nJobs:\n${jobList}\n\nRank top 5 matches with scores.`;
  }
}
