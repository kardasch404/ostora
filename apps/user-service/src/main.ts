import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Ostora User Service')
    .setDescription('User profile management API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Profile')
    .addTag('Education')
    .addTag('Experience')
    .addTag('Skills')
    .addTag('Languages')
    .addTag('Social Links')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  const port = process.env.PORT || 4719;
  await app.listen(port);

  console.log(`🚀 User Service is running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api/v1/docs`);
}

bootstrap();
