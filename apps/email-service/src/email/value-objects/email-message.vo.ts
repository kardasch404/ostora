import { SendEmailDto } from '../dto/send-email.dto';

type AttachmentInput =
  | string
  | {
      filename: string;
      content: Uint8Array;
    };

type EmailMessagePayload = Omit<SendEmailDto, 'attachments'> & {
  attachments?: AttachmentInput[];
};

export class EmailMessage {
  private readonly from?: string;
  private readonly to: string;
  private readonly subject: string;
  private readonly body: string;
  private readonly plainText?: string;
  private readonly attachments?: AttachmentInput[];

  constructor(payload: EmailMessagePayload) {
    this.from = payload.from;
    if (!this.isValidEmail(payload.to)) {
      throw new Error('Invalid email address');
    }
    this.to = payload.to;
    this.subject = payload.subject;
    this.body = payload.body;
    this.plainText = payload.plainText;
    this.attachments = payload.attachments;
  }

  get nodemailerOptions(): object {
    return {
      from: this.from,
      to: this.to,
      subject: this.subject,
      html: this.body,
      text: this.plainText || this.stripHtml(this.body),
      attachments:
        this.attachments?.map((item) => (typeof item === 'string' ? { path: item } : item)) || [],
    };
  }

  get sesParams(): object {
    return {
      Destination: {
        ToAddresses: [this.to],
      },
      Message: {
        Subject: { Data: this.subject },
        Body: {
          Html: { Data: this.body },
          Text: { Data: this.plainText || this.stripHtml(this.body) },
        },
      },
    };
  }

  private isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }
}
