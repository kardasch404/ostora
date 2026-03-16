import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailEncryption } from './dto/create-email-config.dto';

export interface SmtpTestResult {
  success: boolean;
  message: string;
  error?: string;
}

@Injectable()
export class SmtpTesterService {
  async testConnection(
    email: string,
    password: string,
    smtpHost: string,
    smtpPort: number,
    encryption: EmailEncryption,
  ): Promise<SmtpTestResult> {
    try {
      const secure = encryption === EmailEncryption.SSL || encryption === EmailEncryption.TLS;
      
      const transporter = nodemailer.createTransporter({
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
    } catch (error) {
      return {
        success: false,
        message: 'Connection failed',
        error: error.message,
      };
    }
  }

  getProviderConfig(provider: string): { host: string; port: number; encryption: EmailEncryption } | null {
    const providers = {
      gmail: { host: 'smtp.gmail.com', port: 587, encryption: EmailEncryption.STARTTLS },
      outlook: { host: 'smtp-mail.outlook.com', port: 587, encryption: EmailEncryption.STARTTLS },
      yahoo: { host: 'smtp.mail.yahoo.com', port: 587, encryption: EmailEncryption.STARTTLS },
      gmx: { host: 'mail.gmx.com', port: 587, encryption: EmailEncryption.STARTTLS },
      protonmail: { host: 'smtp.protonmail.com', port: 587, encryption: EmailEncryption.STARTTLS },
      icloud: { host: 'smtp.mail.me.com', port: 587, encryption: EmailEncryption.STARTTLS },
      zoho: { host: 'smtp.zoho.com', port: 587, encryption: EmailEncryption.STARTTLS },
      aol: { host: 'smtp.aol.com', port: 587, encryption: EmailEncryption.STARTTLS },
      'mail.com': { host: 'smtp.mail.com', port: 587, encryption: EmailEncryption.STARTTLS },
      'yandex': { host: 'smtp.yandex.com', port: 587, encryption: EmailEncryption.STARTTLS },
      'fastmail': { host: 'smtp.fastmail.com', port: 587, encryption: EmailEncryption.STARTTLS },
      'mailgun': { host: 'smtp.mailgun.org', port: 587, encryption: EmailEncryption.STARTTLS },
      'sendgrid': { host: 'smtp.sendgrid.net', port: 587, encryption: EmailEncryption.STARTTLS },
      'office365': { host: 'smtp.office365.com', port: 587, encryption: EmailEncryption.STARTTLS },
      'ionos': { host: 'smtp.ionos.com', port: 587, encryption: EmailEncryption.STARTTLS },
      'web.de': { host: 'smtp.web.de', port: 587, encryption: EmailEncryption.STARTTLS },
    };

    return providers[provider.toLowerCase()] || null;
  }
}
