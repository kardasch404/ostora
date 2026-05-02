import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { GatewayController } from './gateway.controller';

const kafkaBrokers = [process.env.KAFKA_BROKER || 'localhost:9095'];

/** Shared Kafka client config – fail fast instead of hanging forever */
const kafkaClientConfig = {
  connectionTimeout: 5_000,
  requestTimeout: 10_000,
  retry: {
    initialRetryTime: 300,
    retries: 3,
  },
};

function kafkaService(name: string, clientId: string, groupId: string) {
  return {
    name,
    transport: Transport.KAFKA as const,
    options: {
      client: { clientId, brokers: kafkaBrokers, ...kafkaClientConfig },
      consumer: { groupId },
    },
  };
}

@Module({
  imports: [
    ClientsModule.register([
      kafkaService('AUTH_SERVICE', 'api-gateway-auth', 'api-gateway-auth-consumer'),
      kafkaService('USER_SERVICE', 'api-gateway-user', 'api-gateway-user-consumer'),
      kafkaService('JOB_SERVICE', 'api-gateway-job', 'api-gateway-job-consumer'),
      kafkaService('EMAIL_SERVICE', 'api-gateway-email', 'api-gateway-email-consumer'),
      kafkaService('PAYMENT_SERVICE', 'api-gateway-payment', 'api-gateway-payment-consumer'),
      kafkaService('AI_SERVICE', 'api-gateway-ai', 'api-gateway-ai-consumer'),
      kafkaService('NOTIFICATION_SERVICE', 'api-gateway-notification', 'api-gateway-notification-consumer'),
      kafkaService('ANALYTICS_SERVICE', 'api-gateway-analytics', 'api-gateway-analytics-consumer'),
    ]),
  ],
  controllers: [GatewayController],
})
export class GatewayModule {}
