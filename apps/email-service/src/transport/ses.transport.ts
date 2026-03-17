import { Injectable, Logger } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { ConfigService } from '@nestjs/config';
import { EmailTransportResult } from '../email/interfaces/smtp-transport.interface';

@Injectable()
export class SesTransport {
  private readonly logger = new Logger(SesTransport.name);
  private client: SESClient;

  constructor(private config: ConfigService) {
    this.client = new SESClient({
      region: config.get('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: config.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async send(params: any): Promise<EmailTransportResult> {
    try {
      const command = new SendEmailCommand({
        Source: this.config.get('AWS_SES_FROM_EMAIL'),
        Destination: params.Destination,
        Message: params.Message,
      });

      const response = await this.client.send(command);
      this.logger.log(`Email sent via SES: ${response.MessageId}`);
      
      return {
        success: true,
        messageId: response.MessageId,
      };
    } catch (error) {
      this.logger.error('SES send failed', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
