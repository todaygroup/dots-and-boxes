import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS configuration
  const envCorsOrigin = process.env.CORS_ORIGIN || '';
  const defaultOrigins = [
    'http://localhost:8080',
    'http://localhost:3000',
    'https://dots-and-boxes-api.vercel.app',
    'https://dots-and-boxes-api.vercel.app/' // Add trailing slash version just in case
  ];

  const corsOrigins = [
    ...envCorsOrigin.split(',').map(o => o.trim()).filter(Boolean),
    ...defaultOrigins
  ];

  console.log('[Server] Allowed CORS origins:', corsOrigins);

  app.enableCors({
    origin: (requestOrigin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!requestOrigin) return callback(null, true);

      if (corsOrigins.includes('*') || corsOrigins.includes(requestOrigin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked request from origin: ${requestOrigin}`);
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);

  console.log(`[Server] Running on port ${port}`);
  console.log(`[Server] CORS origins: ${corsOrigins.join(', ')}`);
}
bootstrap();
