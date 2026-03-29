import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { FastApplyProgressService } from './fast-apply-progress.service';
import { TokenRouterService, TaskType, TaskPriority } from '../token-router/token-router.service';
import { FastApplyJob } from '../interfaces/fast-apply.interface';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import Redis from 'ioredis';

@Processor('fast-apply')
export class FastApplyProcessor {
  private readonly logger = new Logger(FastApplyProcessor.name);
  private readonly redis: Redis;

  constructor(
    private progressService: FastApplyProgressService,
    private tokenRouter: TokenRouterService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
    });
  }

  @Process({ concurrency: 8 })
  async handleFastApply(job: Job<FastApplyJob>) {
    this.logger.log(`[FastApply] Processing job ${job.data.jobId} in batch ${job.data.batchId}`);

    try {
      // 1. Load job post from database
      const jobPost = await this.loadJobPost(job.data.jobId);

      // 2. Load user profile
      const userProfile = await this.loadUserProfile(job.data.userId);

      // 3. Build personalization prompt
      const prompt = this.buildPersonalizeEmailPrompt(
        userProfile,
        jobPost,
        job.data.baseTemplate,
      );

      // 4. Generate personalized email using AI
      const priority = job.data.aiProvider === 'blazeai' ? TaskPriority.REALTIME : TaskPriority.BACKGROUND;
      const personalizedEmail = await this.tokenRouter.route(
        TaskType.EMAIL_GENERATION,
        priority,
        prompt,
        { temperature: 0.7, maxTokens: 800 },
      );

      // 5. Replace placeholders
      const finalEmail = this.replacePlaceholders(personalizedEmail, jobPost);

      // 6. Send email via SMTP
      await this.sendEmail(job.data.emailConfigId, jobPost.contactEmail, finalEmail, job.data.bundleId);

      // 7. Create job application record
      await this.createJobApplication(job.data.userId, job.data.jobId, job.data.batchId);

      // 8. Update progress
      await this.progressService.incrementCompleted(job.data.batchId);

      // 9. Notify via WebSocket
      await this.notifyProgress(job.data.batchId, jobPost.title);

      this.logger.log(`[FastApply] Completed job ${job.data.jobId}`);

      return {
        success: true,
        jobId: job.data.jobId,
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error(`[FastApply] Failed job ${job.data.jobId}: ${error.message}`);
      await this.progressService.incrementFailed(job.data.batchId);
      throw error;
    }
  }

  private buildPersonalizeEmailPrompt(userProfile: any, jobPost: any, template: any): string {
    return `Personalize this email template for a job application.

User Profile:
- Name: ${userProfile.name}
- Experience: ${userProfile.experience}
- Skills: ${userProfile.skills.join(', ')}

Job:
- Title: ${jobPost.title}
- Company: ${jobPost.company}
- Requirements: ${jobPost.requirements}

Template:
Subject: ${template.subject}
Body: ${template.body}

Generate a personalized, professional email. Replace placeholders like ~#rh_name, ~#job_title, ~#company_name with actual values.`;
  }

  private replacePlaceholders(email: string, jobPost: any): string {
    return email
      .replace(/~#rh_name/g, jobPost.hrName || 'Hiring Manager')
      .replace(/~#job_title/g, jobPost.title)
      .replace(/~#company_name/g, jobPost.company);
  }

  private async notifyProgress(batchId: string, currentJob: string): Promise<void> {
    const progress = await this.progressService.getProgress(batchId);
    
    // TODO: Emit via WebSocket
    await this.redis.publish('fast-apply:progress', JSON.stringify({
      batchId,
      done: progress.done,
      total: progress.total,
      currentJob,
    }));
  }

  private async loadJobPost(jobId: string): Promise<any> {
    const job = await this.prisma.jobPost.findUnique({
      where: { id: jobId },
      include: { company: true },
    });

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    return {
      id: job.id,
      title: job.title,
      company: job.company.name,
      requirements: job.requirements || '',
      contactEmail: 'hr@' + job.company.name.toLowerCase().replace(/\s+/g, '') + '.com',
      hrName: 'Hiring Manager',
      description: job.description,
    };
  }

  private async loadUserProfile(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            skills: true,
            experience: true,
          },
        },
      },
    });

    if (!user || !user.profile) {
      throw new Error(`User profile ${userId} not found`);
    }

    return {
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      experience: user.profile.experienceYears + ' years' || 'N/A',
      skills: user.profile.skills.map(s => s.name),
      title: user.profile.title || 'Professional',
    };
  }

  private async sendEmail(emailConfigId: string, to: string, body: string, bundleId: string): Promise<void> {
    // Get email config
    const config = await this.prisma.emailConfig.findUnique({
      where: { id: emailConfigId },
    });

    if (!config) {
      throw new Error('Email config not found');
    }

    // Get bundle documents
    const bundle = await this.prisma.applicationBundle.findUnique({
      where: { id: bundleId },
      include: { documents: true },
    });

    // TODO: Integrate with email-service via Kafka or HTTP
    // For now, just log
    this.logger.log(`Email would be sent to ${to} from ${config.email}`);
    this.logger.log(`Attachments: ${bundle?.documents.map(d => d.filename).join(', ')}`);
  }

  private async createJobApplication(userId: string, jobId: string, batchId: string): Promise<void> {
    await this.prisma.jobPostApplication.create({
      data: {
        userId,
        jobPostId: jobId,
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    this.logger.log(`Job application created: user=${userId}, job=${jobId}, batch=${batchId}`);
  }
}
