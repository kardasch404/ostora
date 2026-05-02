import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailEncryption } from './dto/create-email-config.dto';

export interface SmtpTestResult {
  success: boolean;
  message: string;
  error?: string;
}

type ProviderCatalogEntry = {
  name: string;
  host: string;
  port: number;
  encryption: EmailEncryption;
  domains: string[];
};

@Injectable()
export class SmtpTesterService {
  private readonly providerCatalog: Record<string, ProviderCatalogEntry> = {
    gmail: {
      name: 'Gmail',
      host: 'smtp.gmail.com',
      port: 587,
      encryption: EmailEncryption.STARTTLS,
      domains: ['gmail.com', 'googlemail.com'],
    },
    outlook: {
      name: 'Outlook',
      host: 'smtp-mail.outlook.com',
      port: 587,
      encryption: EmailEncryption.STARTTLS,
      domains: ['outlook.com', 'outlook.de', 'hotmail.com', 'hotmail.de', 'live.com', 'live.de', 'msn.com'],
    },
    yahoo: {
      name: 'Yahoo',
      host: 'smtp.mail.yahoo.com',
      port: 587,
      encryption: EmailEncryption.STARTTLS,
      domains: ['yahoo.com', 'ymail.com', 'rocketmail.com'],
    },
    gmx: {
      name: 'GMX',
      host: 'mail.gmx.com',
      port: 587,
      encryption: EmailEncryption.STARTTLS,
      domains: ['gmx.com', 'gmx.de'],
    },
    protonmail: {
      name: 'ProtonMail',
      host: 'smtp.protonmail.com',
      port: 587,
      encryption: EmailEncryption.STARTTLS,
      domains: ['protonmail.com', 'pm.me'],
    },
    icloud: {
      name: 'iCloud',
      host: 'smtp.mail.me.com',
      port: 587,
      encryption: EmailEncryption.STARTTLS,
      domains: ['icloud.com', 'me.com', 'mac.com'],
    },
    zoho: {
      name: 'Zoho',
      host: 'smtp.zoho.com',
      port: 587,
      encryption: EmailEncryption.STARTTLS,
      domains: ['zoho.com', 'zohomail.com'],
    },
    aol: {
      name: 'AOL',
      host: 'smtp.aol.com',
      port: 587,
      encryption: EmailEncryption.STARTTLS,
      domains: ['aol.com'],
    },
    'mail.com': {
      name: 'Mail.com',
      host: 'smtp.mail.com',
      port: 587,
      encryption: EmailEncryption.STARTTLS,
      domains: ['mail.com'],
    },
    yandex: {
      name: 'Yandex',
      host: 'smtp.yandex.com',
      port: 587,
      encryption: EmailEncryption.STARTTLS,
      domains: ['yandex.com', 'yandex.ru'],
    },
    fastmail: {
      name: 'FastMail',
      host: 'smtp.fastmail.com',
      port: 587,
      encryption: EmailEncryption.STARTTLS,
      domains: ['fastmail.com'],
    },
    mailgun: {
      name: 'Mailgun',
      host: 'smtp.mailgun.org',
      port: 587,
      encryption: EmailEncryption.STARTTLS,
      domains: ['mailgun.org'],
    },
    sendgrid: {
      name: 'SendGrid',
      host: 'smtp.sendgrid.net',
      port: 587,
      encryption: EmailEncryption.STARTTLS,
      domains: ['sendgrid.net'],
    },
    office365: {
      name: 'Office 365',
      host: 'smtp.office365.com',
      port: 587,
      encryption: EmailEncryption.STARTTLS,
      domains: ['office365.com'],
    },
    ionos: {
      name: 'IONOS',
      host: 'smtp.ionos.com',
      port: 587,
      encryption: EmailEncryption.STARTTLS,
      domains: ['ionos.com', 'ionos.de'],
    },
    'web.de': {
      name: 'Web.de',
      host: 'smtp.web.de',
      port: 587,
      encryption: EmailEncryption.STARTTLS,
      domains: ['web.de'],
    },
  };

  async testConnection(
    email: string,
    password: string,
    smtpHost: string,
    smtpPort: number,
    encryption: EmailEncryption,
  ): Promise<SmtpTestResult> {
    try {
      const secure = encryption === EmailEncryption.SSL;

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure,
        auth: {
          user: email,
          pass: password,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      await transporter.verify();

      // Send test email
      await transporter.sendMail({
        from: `"${email}" <${email}>`,
        to: email,
        subject: 'Ostora - Email Configuration Test',
        text: 'Your email configuration is working correctly!',
        html: '<p>Your email configuration is working correctly!</p>',
      });

      return {
        success: true,
        message: 'Connection successful. Test email sent.',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown SMTP connection error';
      return {
        success: false,
        message: 'Connection failed',
        error: errorMessage,
      };
    }
  }

  getSupportedProviders(): Array<{ name: string; value: string }> {
    return Object.entries(this.providerCatalog).map(([value, config]) => ({
      name: config.name,
      value,
    }));
  }

  getProviderConfig(provider: string): { host: string; port: number; encryption: EmailEncryption } | null {
    const normalized = provider?.toLowerCase().trim();
    if (!normalized) {
      return null;
    }

    const config = this.providerCatalog[normalized];
    if (!config) {
      return null;
    }

    return {
      host: config.host,
      port: config.port,
      encryption: config.encryption,
    };
  }

  getProviderConfigByDomain(domain: string): { host: string; port: number; encryption: EmailEncryption } | null {
    const normalizedDomain = domain?.toLowerCase().trim();
    if (!normalizedDomain) {
      return null;
    }

    for (const provider of Object.values(this.providerCatalog)) {
      if (provider.domains.includes(normalizedDomain)) {
        return {
          host: provider.host,
          port: provider.port,
          encryption: provider.encryption,
        };
      }
    }

    return null;
  }

  inferProvider(email: string, smtpHost: string): string {
    const normalizedHost = smtpHost?.toLowerCase().trim() || '';
    for (const [value, provider] of Object.entries(this.providerCatalog)) {
      if (provider.host.toLowerCase() === normalizedHost) {
        return value;
      }
    }

    const domain = email.split('@')[1]?.toLowerCase();
    if (domain) {
      for (const [value, provider] of Object.entries(this.providerCatalog)) {
        if (provider.domains.includes(domain)) {
          return value;
        }
      }
    }

    return 'custom';
  }
}
