import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AnalyticsService } from './analytics/analytics.service';
import { AnalyticsInterceptor } from './analytics/interceptors/analytics.interceptor';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Apply Helmet security headers
  app.use(helmet());

  // Trust proxy when behind reverse proxy (Nginx, AWS ELB, Cloudflare, etc.)
  (app as any).getHttpAdapter().getInstance().set('trust proxy', 1);

  app.setGlobalPrefix('v1');
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Swagger configuration from env
  const config = new DocumentBuilder()
    .setTitle(configService.get('SWAGGER_TITLE', 'German Butcher Ecommerce'))
    .setDescription(
      configService.get('SWAGGER_DESCRIPTION', 'API documentation for German Butcher E-commerce Application'),
    )
    .setVersion(configService.get('SWAGGER_VERSION', '1.0'))
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token in format: Bearer <token>',
        in: 'header',
      },
      'token', // must match @ApiBearerAuth('token')
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: configService.get('SWAGGER_TITLE', 'German Butcher API Docs'),
    customfavIcon: configService.get('SWAGGER_FAVICON', 'https://germanbutcherbd.com/favicon.ico'),
    customCssUrl: configService.get('SWAGGER_CUSTOM_CSS_URL', 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css'),
    customCss: `
      .topbar { background-color: #d32f2f; }
      .topbar-wrapper span { color: white !important; font-weight: bold; }
      .swagger-ui .info h1 { color: #d32f2f; }
      .swagger-ui .scheme-container { background-color: #f7f7f7; }
      .swagger-ui .opblock.opblock-get { border-color: #388e3c; }
      .swagger-ui .opblock.opblock-post { border-color: #1976d2; }
    `,
    swaggerOptions: {
      persistAuthorization: true, // ✅ keeps token after refresh
      docExpansion: 'none',
      displayRequestDuration: true,
    },
  });

  // Allow CORS from env
  const corsOrigins = configService
    .get('CORS_ORIGINS', '')
    .split(',')
    .map((origin: string) => origin.trim())
    .filter((origin: string) => origin.length > 0);

  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
    ],
    exposedHeaders: ['Authorization', 'Content-Disposition'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalInterceptors(
    new AnalyticsInterceptor(app.get(AnalyticsService), app.get(Reflector)),
  );

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  const nodeEnv = configService.get('NODE_ENV', 'development');
  const apiUrl = configService.get('API_URL', `http://localhost:${port}`);

  console.log('');
  console.log('🚀 German Butcher API is running');
  console.log(`   Environment: ${nodeEnv}`);
  console.log(`   Port: ${port}`);
  if (nodeEnv === 'production') {
    console.log(`   API: ${apiUrl}`);
    console.log(`   Docs: ${apiUrl}/docs`);
  } else {
    console.log(`   Local: http://localhost:${port}`);
    console.log(`   Docs: http://localhost:${port}/docs`);
  }
  console.log('🔒 Security features enabled: Helmet, Rate Limiting');
  console.log('');
}
bootstrap();
