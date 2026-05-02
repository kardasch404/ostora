import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: process.env.CORS_ORIGIN || '*', credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('OstorCV Service')
    .setDescription('Standalone CV and cover letter rendering service')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('OstorCV')
    .addTag('Internal')
    .build();

  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/v1/docs', app, swaggerDoc);

  const port = Number(process.env.PORT || 4731);
  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(`OstorCV service listening on http://localhost:${port}`);
}

bootstrap();
