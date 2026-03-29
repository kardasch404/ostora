import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { FastApplyProgressService } from './fast-apply-progress.service';
import { FastApplyRequestDto } from '../dto/fast-apply.dto';
import { UserPlan, EmailConfig, UserBundle, EmailTemplate } from '../interfaces/fast-apply.interface';
import { TokenRouterService } from '../token-router/token-router.service';
import { PrismaService } from '../prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FastApplyService {
  private readonly logger = new Logger(FastApplyService.name);

  constructor(
    @InjectQueue('fast-apply') private fastApplyQueue: Queue,
    private progressService: FastApplyProgressService,
    private tokenRouter: TokenRouterService,
    private prisma: PrismaService,
  ) {}

  async processBatch(dto: FastApplyRequestDto, userPlan: UserPlan, userId: string): Promise<{ batchId: string; message: string }> {
    // Guard check: Premium feature
    if (userPlan === UserPlan.FREE) {
      throw new HttpException('Upgrade to use Fast Apply', HttpStatus.FORBIDDEN);
    }

    // Pre-validation: Max 50 jobs
    if (dto.jobIds.length > 50) {
      throw new HttpException('Max 50 jobs per batch', HttpStatus.BAD_REQUEST);
    }

    // TODO: Load from user-service
    const emailConfig = await this.getEmailConfig(dto.emailConfigId);
    const bundle = await this.getBundle(dto.bundleId);
    const baseTemplate = await this.getTemplate(dto.templateId);

    // Validate bundle has CV + cover letter
    if (!bundle.cvUrl) {
      throw new HttpException('Bundle must have CV', HttpStatus.BAD_REQUEST);
    }

    // Dynamic concurrency decision
    const jobCount = dto.jobIds.length;
    let concurrency = 3;
    if (jobCount <= 5) concurrency = 3;
    else if (jobCount <= 20) concurrency = 5;
    else if (jobCount > 20) concurrency = 8;

    // Check BlazeAI credits
    const remainingCredits = await this.tokenRouter.getRemainingCredits();
    const aiProvider = remainingCredits > 100 ? 'blazeai' : 'ollama';

    this.logger.log(`Fast Apply: ${jobCount} jobs, concurrency: ${concurrency}, provider: ${aiProvider}`);

    // Enqueue all jobs at once
    const batchId = uuidv4();
    await this.progressService.initBatch(batchId, jobCount);

    const priority = this.getPriority(userPlan);

    for (const jobId of dto.jobIds) {
      await this.fastApplyQueue.add(
        {
          jobId,
          userId,
          batchId,
          bundleId: dto.bundleId,
          emailConfigId: dto.emailConfigId,
          baseTemplate,
          aiProvider,
          concurrency,
        },
        { 
          attempts: 3, 
          backoff: 5000,
          priority,
        },
      );
    }

    this.logger.log(`Batch ${batchId} created with ${jobCount} jobs`);

    return {
      batchId,
      message: `Processing ${jobCount} applications...`,
    };
  }

  async getBatchStatus(batchId: string) {
    return this.progressService.getProgress(batchId);
  }

  private getPriority(userPlan: UserPlan): number {
    switch (userPlan) {
      case UserPlan.B2B:
        return 1; // Highest
      case UserPlan.ANNUAL:
        return 2;
      case UserPlan.PREMIUM:
        return 3;
      default:
        return 5; // Lowest
    }
  }

  private async getEmailConfig(emailConfigId: string): Promise<EmailConfig> {
    const config = await this.prisma.emailConfig.findUnique({
      where: { id: emailConfigId },
    });

    if (!config) {
      throw new HttpException('Email config not found', HttpStatus.NOT_FOUND);
    }

    return {
      id: config.id,
      userId: config.userId,
      smtpHost: config.smtpHost,
      smtpPort: config.smtpPort,
      smtpUser: config.email,
      smtpPassword: config.passwordEncrypted,
      fromEmail: config.email,
      fromName: config.fromName,
    };
  }

  private async getBundle(bundleId: string): Promise<UserBundle> {
    const bundle = await this.prisma.applicationBundle.findUnique({
      where: { id: bundleId },
      include: { documents: true },
    });

    if (!bundle) {
      throw new HttpException('Bundle not found', HttpStatus.NOT_FOUND);
    }

    const cvDoc = bundle.documents.find(d => d.type === 'CV');
    const coverLetterDoc = bundle.documents.find(d => d.type === 'COVER_LETTER');

    if (!cvDoc) {
      throw new HttpException('Bundle must have CV', HttpStatus.BAD_REQUEST);
    }

    return {
      id: bundle.id,
      userId: bundle.userId,
      cvUrl: cvDoc.s3Url,
      coverLetterUrl: coverLetterDoc?.s3Url,
    };
  }

  private async getTemplate(templateId: string): Promise<EmailTemplate> {
    const template = await this.prisma.messageTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new HttpException('Template not found', HttpStatus.NOT_FOUND);
    }

    return {
      id: template.id,
      name: template.name,
      subject: template.subject,
      body: template.body,
      placeholders: ['~#rh_name', '~#job_title', '~#company_name'],
    };
  }
}
