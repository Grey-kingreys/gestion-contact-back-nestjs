import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.log(process.env.CORS_ORIGIN),
  app.enableCors({
    origin: [
      process.env.CORS_ORIGIN_WEB,
      process.env.CORS_ORIGIN_MOBILE,
    ],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.listen(process.env.PORT || 8003);
  console.log('Server listening on', process.env.PORT || 8003);
}
bootstrap();
