// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ¡Esta es la línea mágica!
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Ignora datos extra que no estén definidos en el DTO
  }));

  await app.listen(Number(process.env.PORT || 3000), '127.0.0.1');
}
bootstrap();
