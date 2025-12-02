import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilitar CORS para el frontend
  app.enableCors({
    origin: '*', // En producción, especifica los dominios permitidos
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  // Configurar tamaño máximo del payload para uploads
  app.use((req, res, next) => {
    if (req.url.includes('/api/images/upload')) {
      req.setTimeout(30000); // 30 segundos timeout para uploads
    }
    next();
  });

  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';
  
  await app.listen(port, host);
  
  console.log(`🚀 Backend running on:`);
  console.log(`   - Local:   http://127.0.0.1:${port}`);
  console.log(`   - Network: http://${host}:${port}`);
  console.log(`📁 Image upload endpoint: http://${host}:${port}/api/images/upload/book`);
}
bootstrap();
