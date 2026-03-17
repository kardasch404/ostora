import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as helmet from 'helmet';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());

  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global pipes


  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Ostora Auth Service')

    .addTag('Authentication')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  // Kafka microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'auth-service',
        brokers: [process.env.KAFKA_BROKER || 'localhost:9095'],
      },
      consumer: {
        groupId: 'auth-service-consumer',
      },
    },
  });

  await app.startAllMicroservices();

  const port = process.env.PORT || 4718;
  await app.listen(port);

  console.log(`🚀 Auth Service is running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api/v1/docs`);
}

bootstrap();
