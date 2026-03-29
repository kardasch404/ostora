export interface EmailConfig {
  id: string;
  userId: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
}

export interface UserBundle {
  id: string;
  userId: string;
  cvUrl: string;
  coverLetterUrl?: string;
  portfolioUrl?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  placeholders: string[];
}

export interface FastApplyJob {
  jobId: string;
  userId: string;
  batchId: string;
  bundleId: string;
  emailConfigId: string;
  baseTemplate: EmailTemplate;
  aiProvider: 'blazeai' | 'ollama';
  concurrency: number;
}

export interface BatchProgress {
  batchId: string;
  total: number;
  done: number;
  failed: number;
  status: 'processing' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
}

export enum UserPlan {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  ANNUAL = 'ANNUAL',
  B2B = 'B2B',
}
