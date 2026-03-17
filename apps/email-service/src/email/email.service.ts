import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendEmailDto } from './dto/send-email.dto';
import { SendApplicationDto } from './dto/send-application.dto';
import { EmailMessage } from './value-objects/email-message.vo';
import { TransportFactoryService } from '../transport/transport-factory.service';
import { EmailLogService } from '../log/email-log.service';
import { TemplateRendererService } from '../template/template-renderer.service';
import { EmailStatus, EmailProvider } from './dto/email-log.response';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private s3Client: S3Client;

  constructor(
    private config: ConfigService,
    private transportFactory: TransportFactoryService,
    private emailLog: EmailLogService,
    private templateRenderer: TemplateRendererService
  ) {
    this.s3Client = new S3Client({
      region: config.get('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: config.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async sendEmail(dto: SendEmailDto, userId: string, emailConfigId?: string) {
    const message = new EmailMessage(dto);
    let emailConfig = null;

    // Fetch user's email config if provided
    if (emailConfigId) {
      emailConfig = await this.fetchEmailConfig(emailConfigId);
    }

    // Get appropriate transport (SMTP or SES)
    const transport = await this.transportFactory.getTransport(emailConfig);
    const provider = emailConfig ? EmailProvider.SMTP : EmailProvider.SES;

    try {
      let result;
      if (provider === EmailProvider.SMTP) {
        result = await transport.send(message.nodemailerOptions);
      } else {
        result = await transport.send(message.sesParams);
      }

      if (result.success) {
        await this.emailLog.record(userId, dto.to, dto.subject, EmailStatus.SENT, provider);
        this.logger.log(`Email sent to ${dto.to} via ${provider}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      await this.emailLog.record(userId, dto.to, dto.subject, EmailStatus.FAILED, provider, error.message);
      throw error;
    }
  }

  async sendApplication(dto: SendApplicationDto, userId: string) {
    // Fetch email config, template, and bundle from user-service via gRPC
    const emailConfig = await this.fetchEmailConfig(dto.emailConfigId);
    const template = await this.fetchTemplate(dto.templateId);
    const bundle = await this.fetchBundle(dto.bundleId);

    // Build placeholders
    const placeholders = {
      ...dto.placeholders,
      jobPostId: dto.jobPostId,
      userName: 'User Name', // Fetch from user-service
    };

    // Render template
    const body = this.templateRenderer.renderFromString(template.body, placeholders);

    // Get presigned URLs for attachments
    const attachmentUrls = await this.getPresignedUrls(bundle.documents);

    // Send email
    await this.sendEmail(
      {
        to: dto.recipientEmail,
        subject: template.subject,
        body,
        attachments: attachmentUrls,
      },
      userId,
      dto.emailConfigId
    );

    this.logger.log(`Application email sent for job ${dto.jobPostId}`);
  }

  private async fetchEmailConfig(emailConfigId: string): Promise<any> {
    // TODO: Implement gRPC call to user-service
    // For now, return mock data
    return {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: 'user@example.com',
      smtpPassword: 'password',
    };
  }

  private async fetchTemplate(templateId: string): Promise<any> {
    // TODO: Implement gRPC call to user-service
    return {
      subject: 'Job Application',
      body: '<h1>Hello {{userName}}</h1>',
    };
  }

  private async fetchBundle(bundleId: string): Promise<any> {
    // TODO: Implement gRPC call to user-service
    return {
      documents: ['cv.pdf', 'cover-letter.pdf'],
    };
  }

  private async getPresignedUrls(s3Keys: string[]): Promise<string[]> {
    const bucket = this.config.get('AWS_S3_BUCKET');
    const urls = await Promise.all(
      s3Keys.map(async (key) => {
        const command = new GetObjectCommand({ Bucket: bucket, Key: key });
        return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
      })
    );
    return urls;
  }
}
