import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { SmtpTransportInterface, EmailTransportResult } from '../email/interfaces/smtp-transport.interface';

@Injectable()
export class SmtpTransport {
  private readonly logger = new Logger(SmtpTransport.name);
  private transporter: Transporter;
  private readonly defaultFrom?: string;

  constructor(config: SmtpTransportInterface) {
    this.defaultFrom = config.defaultFrom || config.auth?.user;
    const transportOptions: any = {
      host: config.host,
      port: config.port,
      secure: config.secure,
    };

    if (config.auth?.user && config.auth?.pass) {
      transportOptions.auth = {
        user: config.auth.user,
        pass: config.auth.pass,
      };
    }

    this.transporter = nodemailer.createTransport(transportOptions);
  }

  async send(mailOptions: any): Promise<EmailTransportResult> {
    try {
      const info = await this.transporter.sendMail({
        ...mailOptions,
        from: mailOptions.from || this.defaultFrom,
      });
      this.logger.log(`Email sent: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      this.logger.error('SMTP send failed', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      this.logger.error('SMTP verification failed', error);
      return false;
    }
  }
}
