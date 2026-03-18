import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:8080,http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // Security
  app.use(helmet());

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Set-Cookie'],
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

  const kafkaEnabled = process.env.KAFKA_ENABLED !== 'false';
  if (kafkaEnabled) {
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
  }

  const port = process.env.PORT || 4718;
  await app.listen(port);

  console.log(`🚀 Auth Service is running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api/v1/docs`);
}

bootstrap();
