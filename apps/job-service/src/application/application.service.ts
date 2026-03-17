import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { KafkaService } from '../kafka/kafka.service';
import { ApplyDto } from './dto/apply.dto';
import { BulkApplyDto } from './dto/bulk-apply.dto';
import { ApplicationData } from './value-objects/application-data.vo';
import { APPLICATION_QUEUE, ApplicationJobData } from './queue/application.queue';
import { ApplicationStatus } from './dto/application.response';

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger(ApplicationService.name);

  constructor(
    private prisma: PrismaService,
    private kafka: KafkaService,
    @InjectQueue(APPLICATION_QUEUE) private applicationQueue: Queue
  ) {}

  async apply(jobPostId: string, dto: ApplyDto, userId: string) {
    // Validate job exists
    const job = await this.prisma.jobPost.findUnique({
      where: { id: jobPostId },
      include: { company: true },
    });

    if (!job) {
      throw new NotFoundException(`Job ${jobPostId} not found`);
    }

    // Check if already applied
    const existingApplication = await this.prisma.jobApplication.findUnique({
      where: {
        userId_jobPostId: { userId, jobPostId },
      },
    });

    if (existingApplication) {
      throw new Error('You have already applied to this job');
    }

    // Create application data
    const appData = new ApplicationData(
      jobPostId,
      userId,
      dto.bundleId,
      dto.emailConfigId,
      dto.templateId,
      dto.recipientEmail,
      dto.placeholders
    );

    // Process application immediately
    return this.processApplication(appData.toJobData());
  }

  async applyBulk(dto: BulkApplyDto, userId: string) {
    const { bundleId, emailConfigId, templateId, jobs } = dto;
    const queuedJobs: string[] = [];

    for (const job of jobs) {
      // Validate job exists
      const jobPost = await this.prisma.jobPost.findUnique({
        where: { id: job.jobPostId },
      });

      if (!jobPost) {
        this.logger.warn(`Job ${job.jobPostId} not found, skipping`);
        continue;
      }

      // Check if already applied
      const existingApplication = await this.prisma.jobApplication.findUnique({
        where: {
          userId_jobPostId: { userId, jobPostId: job.jobPostId },
        },
      });

      if (existingApplication) {
        this.logger.warn(`Already applied to job ${job.jobPostId}, skipping`);
        continue;
      }

      // Create pending application record
      await this.prisma.jobApplication.create({
        data: {
          userId,
          jobPostId: job.jobPostId,
          status: ApplicationStatus.QUEUED,
        },
      });

      // Queue application with rate limiting (1 job per 5 seconds)
      const delay = queuedJobs.length * 5000;
      
      await this.applicationQueue.add(
        {
          jobPostId: job.jobPostId,
          userId,
          bundleId,
          emailConfigId,
          templateId,
          recipientEmail: job.recipientEmail,
          placeholders: job.placeholders,
        },
        {
          delay,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        }
      );

      queuedJobs.push(job.jobPostId);
      this.logger.log(`Queued application for job ${job.jobPostId} with ${delay}ms delay`);
    }

    return {
      totalJobs: jobs.length,
      queued: queuedJobs.length,
      message: `${queuedJobs.length} applications queued successfully`,
      jobIds: queuedJobs,
    };
  }

  async processApplication(data: ApplicationJobData) {
    const { jobPostId, userId, bundleId, emailConfigId, templateId, recipientEmail, placeholders } = data;

    try {
      // Fetch job details
      const job = await this.prisma.jobPost.findUnique({
        where: { id: jobPostId },
        include: { company: true },
      });

      // Fetch user details
      const user = await this.fetchUserDetails(userId);

      // Build placeholders with job and user data
      const enrichedPlaceholders = {
        ...placeholders,
        userName: user.name,
        userEmail: user.email,
        jobTitle: job.title,
        companyName: job.company.name,
        location: job.location || `${job.city}, ${job.country}`,
        appliedDate: new Date().toLocaleDateString(),
      };

      // Emit Kafka event to email service
      await this.kafka.emit('email.events', {
        eventType: 'APPLICATION_SENT',
        userId,
        to: recipientEmail,
        data: enrichedPlaceholders,
        emailConfigId,
        templateId,
        bundleId,
      });

      // Create or update application record
      const application = await this.prisma.jobApplication.upsert({
        where: {
          userId_jobPostId: { userId, jobPostId },
        },
        create: {
          userId,
          jobPostId,
          status: ApplicationStatus.SENT,
          appliedAt: new Date(),
        },
        update: {
          status: ApplicationStatus.SENT,
          appliedAt: new Date(),
          errorMessage: null,
        },
      });

      this.logger.log(`Application sent for job ${jobPostId}`);
      return application;
    } catch (error) {
      this.logger.error(`Failed to process application for job ${jobPostId}`, error);

      // Update application status to FAILED
      await this.prisma.jobApplication.upsert({
        where: {
          userId_jobPostId: { userId, jobPostId },
        },
        create: {
          userId,
          jobPostId,
          status: ApplicationStatus.FAILED,
          errorMessage: error.message,
          appliedAt: new Date(),
        },
        update: {
          status: ApplicationStatus.FAILED,
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }

  async getApplications(userId: string) {
    return this.prisma.jobApplication.findMany({
      where: { userId },
      include: {
        jobPost: {
          include: { company: true },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });
  }

  async getApplicationById(id: string, userId: string) {
    return this.prisma.jobApplication.findFirst({
      where: { id, userId },
      include: {
        jobPost: {
          include: { company: true },
        },
      },
    });
  }

  private async fetchUserDetails(userId: string): Promise<any> {
    // TODO: Implement gRPC call to user-service
    // For now, fetch from database if available
    return {
      name: 'User Name',
      email: 'user@example.com',
    };
  }
}
