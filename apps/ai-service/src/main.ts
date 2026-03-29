import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 4723;
  await app.listen(port);

  logger.log(`🚀 AI Service running on http://localhost:${port}`);
  logger.log(`📊 BlazeAI quota: ${process.env.BLAZEAI_DAILY_QUOTA || 1000} credits/day`);
}

bootstrap();
