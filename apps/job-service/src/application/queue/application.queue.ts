export const APPLICATION_QUEUE = 'application-queue';

export interface ApplicationJobData {
  jobPostId: string;
  userId: string;
  bundleId: string;
  emailConfigId: string;
  templateId: string;
  recipientEmail: string;
  placeholders?: Record<string, string>;
}
