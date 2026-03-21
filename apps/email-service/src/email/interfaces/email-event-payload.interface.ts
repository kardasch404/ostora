import { EmailEventEnum } from '../../kafka/email-event.enum';

export interface EmailEventPayload {
  eventType: EmailEventEnum;
  userId: string;
  to: string;
  data: Record<string, any>;
  attachments?: string[];
}
