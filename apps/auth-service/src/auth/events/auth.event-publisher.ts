import { Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { AuthEvents } from './auth-events.enum';

@Injectable()
export class AuthEventPublisher {
  private readonly logger = new Logger(AuthEventPublisher.name);
  private readonly kafkaEnabled = process.env.KAFKA_ENABLED !== 'false';
  private isConnected = false;

  constructor(@Inject('KAFKA_CLIENT') private kafkaClient: ClientKafka) {}

  async onModuleInit() {
    if (!this.kafkaEnabled) {
      return;
    }

    const events = Object.values(AuthEvents);
    events.forEach((event) => {
      this.kafkaClient.subscribeToResponseOf(event);
    });

    try {
      await this.kafkaClient.connect();
      this.isConnected = true;
    } catch (error) {
      this.logger.warn(`Kafka connection skipped: ${(error as Error).message}`);
      this.isConnected = false;
    }
  }

  private emitEvent(event: AuthEvents, payload: Record<string, unknown>) {
    if (!this.kafkaEnabled || !this.isConnected) {
      return;
    }
    this.kafkaClient.emit(event, payload);
  }

  private emitTopic(topic: string, payload: Record<string, unknown>) {
    if (!this.kafkaEnabled || !this.isConnected) {
      return;
    }
    this.kafkaClient.emit(topic, payload);
  }

  async publishUserLogin(data: {
    userId: string;
    email: string;
    ip: string;
    userAgent: string;
  }): Promise<void> {
    this.emitEvent(AuthEvents.USER_LOGIN, {
      userId: data.userId,
      email: data.email,
      ip: data.ip,
      userAgent: data.userAgent,
      timestamp: new Date().toISOString(),
    });
  }

  async publishUserRegistered(data: {
    userId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    ip?: string;
    userAgent?: string;
    provider?: string;
  }): Promise<void> {
    this.emitEvent(AuthEvents.USER_REGISTERED, {
      userId: data.userId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      ip: data.ip,
      userAgent: data.userAgent,
      provider: data.provider,
      timestamp: new Date().toISOString(),
    });
  }

  async publishNewDeviceLogin(data: {
    userId: string;
    email: string;
    ip: string;
    userAgent: string;
    fingerprint: string;
  }): Promise<void> {
    this.emitEvent(AuthEvents.NEW_DEVICE_LOGIN, {
      userId: data.userId,
      email: data.email,
      ip: data.ip,
      userAgent: data.userAgent,
      fingerprint: data.fingerprint,
      timestamp: new Date().toISOString(),
    });
  }

  async publishAccountLocked(data: {
    userId: string;
    email: string;
    reason: string;
  }): Promise<void> {
    this.emitEvent(AuthEvents.ACCOUNT_LOCKED, {
      userId: data.userId,
      email: data.email,
      reason: data.reason,
      timestamp: new Date().toISOString(),
    });
  }

  async publishPasswordResetRequested(data: {
    userId: string;
    email: string;
    token: string;
    firstName?: string;
  }): Promise<void> {
    this.emitEvent(AuthEvents.PASSWORD_RESET_REQUESTED, {
      userId: data.userId,
      email: data.email,
      token: data.token,
      firstName: data.firstName,
      timestamp: new Date().toISOString(),
    });
  }

  async publishPasswordResetCompleted(data: {
    userId: string;
    email: string;
    ip: string;
    device: string;
    time: string;
  }): Promise<void> {
    this.emitEvent(AuthEvents.PASSWORD_RESET_COMPLETED, {
      userId: data.userId,
      email: data.email,
      ip: data.ip,
      device: data.device,
      time: data.time,
      timestamp: new Date().toISOString(),
    });
  }

  async publishPasswordChanged(data: {
    userId: string;
    email: string;
    firstName?: string;
    ip: string;
    device: string;
    time: string;
  }): Promise<void> {
    this.emitEvent(AuthEvents.PASSWORD_CHANGED, {
      userId: data.userId,
      email: data.email,
      firstName: data.firstName,
      ip: data.ip,
      device: data.device,
      time: data.time,
      timestamp: new Date().toISOString(),
    });
  }

  async publishEmailChangeRequested(data: {
    userId: string;
    oldEmail: string;
    newEmail: string;
    token: string;
    firstName?: string;
  }): Promise<void> {
    this.emitEvent(AuthEvents.EMAIL_CHANGE_REQUESTED, {
      userId: data.userId,
      oldEmail: data.oldEmail,
      newEmail: data.newEmail,
      token: data.token,
      firstName: data.firstName,
      timestamp: new Date().toISOString(),
    });
  }

  async publishEmailChanged(data: {
    userId: string;
    oldEmail: string;
    newEmail: string;
    firstName?: string;
    ip: string;
    device: string;
    time: string;
  }): Promise<void> {
    this.emitEvent(AuthEvents.EMAIL_CHANGED, {
      userId: data.userId,
      oldEmail: data.oldEmail,
      newEmail: data.newEmail,
      firstName: data.firstName,
      ip: data.ip,
      device: data.device,
      time: data.time,
      timestamp: new Date().toISOString(),
    });
  }

  async publishOtpRequested(data: {
    userId: string;
    email: string;
    code: string;
    firstName?: string;
  }): Promise<void> {
    // Backward-compatible auth event topic
    this.emitEvent(AuthEvents.OTP_REQUESTED, {
      userId: data.userId,
      email: data.email,
      code: data.code,
      firstName: data.firstName,
      timestamp: new Date().toISOString(),
    });

    // Email-service canonical topic payload
    this.emitTopic('email.events', {
      eventType: 'OTP_CODE',
      userId: data.userId,
      to: data.email,
      data: {
        name: data.firstName || 'User',
        otpCode: data.code,
        expiryMinutes: 10,
        supportEmail: 'noreplayostora@gmail.com',
      },
    });
  }
}
