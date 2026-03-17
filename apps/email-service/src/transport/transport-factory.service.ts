import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmtpTransport } from './smtp.transport';
import { SesTransport } from './ses.transport';
import { SmtpTransportInterface } from '../email/interfaces/smtp-transport.interface';

@Injectable()
export class TransportFactoryService {
  private readonly logger = new Logger(TransportFactoryService.name);

  constructor(
    private config: ConfigService,
    private sesTransport: SesTransport
  ) {}

  async createSmtpTransport(emailConfig: any): Promise<SmtpTransport> {
    const smtpConfig: SmtpTransportInterface = {
      host: emailConfig.smtpHost,
      port: emailConfig.smtpPort,
      secure: emailConfig.smtpSecure,
      auth: {
        user: emailConfig.smtpUser,
        pass: emailConfig.smtpPassword,
      },
    };

    const transport = new SmtpTransport(smtpConfig);
    
    // Verify SMTP connection
    const isValid = await transport.verify();
    if (!isValid) {
      this.logger.warn('SMTP verification failed, will use SES fallback');
      throw new Error('SMTP verification failed');
    }

    return transport;
  }

  getSesTransport(): SesTransport {
    return this.sesTransport;
  }

  async getTransport(emailConfig?: any): Promise<SmtpTransport | SesTransport> {
    // Try user's SMTP config first
    if (emailConfig) {
      try {
        return await this.createSmtpTransport(emailConfig);
      } catch (error) {
        this.logger.warn('Failed to create SMTP transport, falling back to SES');
      }
    }

    // Fallback to AWS SES
    return this.getSesTransport();
  }
}
