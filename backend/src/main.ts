import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { LoggerService } from './common/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = await app.resolve(LoggerService);
  app.useLogger(logger);

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true },
  }));

  // CORS
  const configuredOrigins = configService.get<string>('CORS_ORIGINS', '').split(',').filter(Boolean);
  const defaultOrigins = ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:5173'];
  const allowedOrigins = configuredOrigins.length ? configuredOrigins : defaultOrigins;
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
  });

  // API versioning
  app.enableVersioning({ type: VersioningType.URI });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // Global filters & interceptors
  app.useGlobalFilters(new HttpExceptionFilter(logger));
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Swagger / OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Recovery Compass API')
    .setDescription(
      `**Recovery Compass** — Post-surgery recovery management API.\n\n` +
      `> ⚠️ **Prototype Notice**: ${configService.get('PROTOTYPE_NOTICE')}\n\n` +
      `This API powers the complete Recovery Compass patient recovery journey: ` +
      `document ingestion, structured extraction, verification, scheduling, ` +
      `medication tracking, symptom logging, red-flag detection, family consent, ` +
      `and notifications.`,
    )
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addTag('Auth', 'Authentication and session management')
    .addTag('Users', 'User profile management')
    .addTag('Documents', 'Document upload and processing pipeline')
    .addTag('Extractions', 'Structured extraction verification')
    .addTag('Plans', 'Recovery plan management')
    .addTag('Tasks', 'Recovery task tracking')
    .addTag('Medications', 'Medication schedule and event tracking')
    .addTag('Symptoms', 'Symptom logging')
    .addTag('Safety', 'Red-flag detection and safety alerts')
    .addTag('FollowUps', 'Follow-up appointments')
    .addTag('DoctorQuestions', 'Clinician question generation')
    .addTag('Family', 'Family/caregiver consent system')
    .addTag('Notifications', 'Notification management')
    .addTag('Preferences', 'User notification preferences')
    .addTag('Privacy', 'Privacy and data deletion')
    .addTag('Admin', 'Administrative configuration')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');

  logger.log(`Recovery Compass API running on port ${port}`, 'Bootstrap');
  logger.log(`API docs available at http://localhost:${port}/api/docs`, 'Bootstrap');

  if (configService.get('IS_PROTOTYPE') === 'true') {
    logger.log('PROTOTYPE MODE - for demonstration and evaluation', 'Bootstrap');
  }
}

bootstrap();
