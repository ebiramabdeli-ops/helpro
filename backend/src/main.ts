import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3000;

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  await app.listen(port);
  
  console.log(`
  🚀 Helpro Backend is running!
  
  📍 API:        http://localhost:${port}/api
  🔐 Auth:       http://localhost:${port}/api/auth
  📝 Tasks:      http://localhost:${port}/api/tasks
  👥 Users:      http://localhost:${port}/api/users
  💳 Payments:   http://localhost:${port}/api/payments
  🎯 Matching:   http://localhost:${port}/api/matching
  ⚡ Admin:      http://localhost:${port}/api/admin
  
  Environment: ${configService.get('NODE_ENV')}
  `);
}

bootstrap();
