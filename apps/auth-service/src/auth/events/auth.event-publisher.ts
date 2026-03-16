import { Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { AuthEvents } from './auth-events.enum';

@Injectable()
export class AuthEventPublisher {
  constructor(@Inject('KAFKA_CLIENT') private kafkaClient: ClientKafka) {}

  async onModuleInit() {
    const events = Object.values(AuthEvents);
    events.forEach((event) => {
      this.kafkaClient.subscribeToResponseOf(event);
    });
    await this.kafkaClient.connect();
  }

  async publishUserLogin(data: {
    userId: string;
    email: string;
    ip: string;
    userAgent: string;
  }): Promise<void> {
    this.kafkaClient.emit(AuthEvents.USER_LOGIN, {
      userId: data.userId,
      email: data.email,
      ip: data.ip,
      userAgent: data.userAgent,
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
    this.kafkaClient.emit(AuthEvents.NEW_DEVICE_LOGIN, {
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
    this.kafkaClient.emit(AuthEvents.ACCOUNT_LOCKED, {
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
    this.kafkaClient.emit(AuthEvents.PASSWORD_RESET_REQUESTED, {
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
    this.kafkaClient.emit(AuthEvents.PASSWORD_RESET_COMPLETED, {
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
    this.kafkaClient.emit(AuthEvents.PASSWORD_CHANGED, {
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
    this.kafkaClient.emit(AuthEvents.EMAIL_CHANGE_REQUESTED, {
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
    this.kafkaClient.emit(AuthEvents.EMAIL_CHANGED, {
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
    this.kafkaClient.emit(AuthEvents.OTP_REQUESTED, {
      userId: data.userId,
      email: data.email,
      code: data.code,
      firstName: data.firstName,
      timestamp: new Date().toISOString(),
    });
  }
}
