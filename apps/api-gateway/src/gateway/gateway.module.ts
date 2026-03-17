import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { GatewayController } from './gateway.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'api-gateway-auth',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9095'],
          },
          consumer: {
            groupId: 'api-gateway-auth-consumer',
          },
        },
      },
      {
        name: 'USER_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'api-gateway-user',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9095'],
          },
          consumer: {
            groupId: 'api-gateway-user-consumer',
          },
        },
      },
      {
        name: 'JOB_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'api-gateway-job',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9095'],
          },
          consumer: {
            groupId: 'api-gateway-job-consumer',
          },
        },
      },
      {
        name: 'EMAIL_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'api-gateway-email',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9095'],
          },
          consumer: {
            groupId: 'api-gateway-email-consumer',
          },
        },
      },
      {
        name: 'PAYMENT_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'api-gateway-payment',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9095'],
          },
          consumer: {
            groupId: 'api-gateway-payment-consumer',
          },
        },
      },
      {
        name: 'AI_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'api-gateway-ai',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9095'],
          },
          consumer: {
            groupId: 'api-gateway-ai-consumer',
          },
        },
      },
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'api-gateway-notification',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9095'],
          },
          consumer: {
            groupId: 'api-gateway-notification-consumer',
          },
        },
      },
      {
        name: 'ANALYTICS_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'api-gateway-analytics',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9095'],
          },
          consumer: {
            groupId: 'api-gateway-analytics-consumer',
          },
        },
      },
    ]),
  ],
  controllers: [GatewayController],
})
export class GatewayModule {}
