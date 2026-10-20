import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import hbs from 'hbs';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Handlebars
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  // Частичные шаблоны
  hbs.registerPartials(join(__dirname, '..', 'views/partials'));
  hbs.registerHelper('eq', (a: unknown, b: unknown) => a === b);

  // Статические файлы
  app.useStaticAssets(join(__dirname, '..', 'public'));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Orbit Calculator API')
    .setDescription(
      'API типов орбит. GET-методы списка и ленты доступны без входа. Для методов создателя используйте HttpOnly cookie sessionId, которую устанавливает /api/orbit-users/authentication.',
    )
    .setVersion('1.0')
    .addCookieAuth(
      'sessionId',
      { type: 'apiKey', in: 'cookie', name: 'sessionId' },
      'sessionId',
    )
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
