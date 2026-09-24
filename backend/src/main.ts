import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { configureApp } from './app.js';
import { AppModule } from './app.module.js';
import { staticDirFromEnv } from './config.js';
import { logger, NestPinoLogger } from './infra/logger.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new NestPinoLogger(),
  });
  configureApp(app, { staticDir: staticDirFromEnv() });
  const port = Number.parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(port);
  logger.info({ port }, 'api listening');
}

void bootstrap();
