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
}
