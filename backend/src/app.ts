import { existsSync } from 'node:fs';
import { join } from 'node:path';

import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

import { MAX_IMPORT_BYTES } from './config.js';
import { ErrorFilter } from './infra/http/error.filter.js';
import { requestLogger } from './infra/http/request-logger.js';

/** Settings shared by the server and the HTTP tests, so tests exercise the real pipeline. */
export function configureApp(
  app: NestExpressApplication,
  { staticDir }: { staticDir?: string } = {},
): NestExpressApplication {
  app.use(helmet());
  app.setGlobalPrefix('api');
  app.use(requestLogger);
  // trades.csv arrives as the raw request body.
  app.useBodyParser('text', { type: ['text/csv', 'text/plain'], limit: MAX_IMPORT_BYTES });
  app.useGlobalFilters(new ErrorFilter());
  if (staticDir && existsSync(join(staticDir, 'index.html'))) app.useStaticAssets(staticDir);
  app.enableShutdownHooks();
  return app;
}
