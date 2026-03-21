export interface SmtpTransportInterface {
  host: string;
  port: number;
  secure: boolean;
  defaultFrom?: string;
  auth?: {
    user?: string;
    pass?: string;
  };
}

export interface EmailTransportResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
