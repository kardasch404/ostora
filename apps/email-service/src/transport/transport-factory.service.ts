import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmtpTransport } from './smtp.transport';
import { SesTransport } from './ses.transport';

@Injectable()
export class TransportFactoryService {
  private readonly logger = new Logger(TransportFactoryService.name);

  private readonly providerDefaults: Record<string, { host: string; port: number; secure: boolean }> = {
    gmail: { host: 'smtp.gmail.com', port: 587, secure: false },
    outlook: { host: 'smtp-mail.outlook.com', port: 587, secure: false },
    office365: { host: 'smtp.office365.com', port: 587, secure: false },
  };

  constructor(
    private config: ConfigService,
    private sesTransport: SesTransport
  ) {}

  private normalizeSmtpConfig(emailConfig: any): { host: string; port: number; secure: boolean } {
    const providerKey = emailConfig?.provider?.toLowerCase?.();
    const defaults = providerKey ? this.providerDefaults[providerKey] : undefined;

    const host = emailConfig?.smtpHost || defaults?.host;
    const port = Number(emailConfig?.smtpPort ?? defaults?.port);
    const secure =
      typeof emailConfig?.smtpSecure === 'boolean'
        ? emailConfig.smtpSecure
        : defaults?.secure || false;

    if (!host || Number.isNaN(port) || port <= 0) {
      throw new Error('Invalid SMTP transport configuration');
    }

    if (!emailConfig?.smtpUser || !emailConfig?.smtpPassword) {
      throw new Error('SMTP credentials are required');
    }

    return { host, port, secure };
  }

  createSmtpTransport(emailConfig: any): SmtpTransport {
    const normalizedConfig = this.normalizeSmtpConfig(emailConfig);
    return new SmtpTransport({
      host: normalizedConfig.host,
      port: normalizedConfig.port,
      secure: normalizedConfig.secure,
      defaultFrom: emailConfig.fromEmail,
      auth: {
        user: emailConfig.smtpUser,
        pass: emailConfig.smtpPassword,
      },
    });
  }

  async verifySmtpTransport(emailConfig: any): Promise<boolean> {
    const transport = this.createSmtpTransport(emailConfig);
    return transport.verify();
  }

  getSesTransport(): SesTransport {
    return this.sesTransport;
  }

  getTransport(emailConfig?: any): SmtpTransport | SesTransport {
    const allowSesFallback = this.config.get<string>('ALLOW_SES_FALLBACK', 'false') === 'true';

    if (emailConfig) {
      try {
        return this.createSmtpTransport(emailConfig);
      } catch (error) {
        if (!allowSesFallback) {
          this.logger.error('SMTP transport configured but failed to initialize', error);
          throw error;
        }
        this.logger.warn('Failed to create SMTP transport, falling back to SES');
      }
    }

    if (!allowSesFallback) {
      throw new Error('No valid SMTP transport available and ALLOW_SES_FALLBACK is disabled');
    }
    return this.getSesTransport();
  }
}
