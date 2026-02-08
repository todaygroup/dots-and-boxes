import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS configuration
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:8080,http://localhost:3000';
  const corsOrigins = corsOrigin.includes(',')
    ? corsOrigin.split(',').map(o => o.trim())
    : [corsOrigin];

  console.log('[Server] Allowed CORS origins:', corsOrigins);

  app.enableCors({
    origin: (requestOrigin, callback) => {
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
