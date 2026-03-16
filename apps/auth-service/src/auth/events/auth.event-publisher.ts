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

  async publishEmailVerificationRequested(data: {
    userId: string;
    email: string;
    token: string;
    firstName?: string;
  }): Promise<void> {
    this.kafkaClient.emit(AuthEvents.EMAIL_VERIFICATION_REQUESTED, {
      userId: data.userId,
      email: data.email,
      token: data.token,
      firstName: data.firstName,
      timestamp: new Date().toISOString(),
    });
  }

  async publishUserRegistered(data: {
    userId: string;
    email: string;
    firstName?: string;
    lastName?: string;
  }): Promise<void> {
    this.kafkaClient.emit(AuthEvents.USER_REGISTERED, {
      userId: data.userId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      timestamp: new Date().toISOString(),
    });
  }

  async publishEmailVerified(data: { userId: string; email: string }): Promise<void> {
    this.kafkaClient.emit(AuthEvents.EMAIL_VERIFIED, {
      userId: data.userId,
      email: data.email,
      timestamp: new Date().toISOString(),
    });
  }
}
