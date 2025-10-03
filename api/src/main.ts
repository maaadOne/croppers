import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {cors: true});
  app.useGlobalPipes(new ValidationPipe({
  transform: true,     
  transformOptions: { enableImplicitConversion: true },            // ← coerce strings → numbers using @Type
  whitelist: true,
  forbidNonWhitelisted: true,
}));
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
