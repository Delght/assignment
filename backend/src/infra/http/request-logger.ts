import type { NextFunction, Request, Response } from 'express';

import { logger } from '../logger.js';

export function requestLogger(request: Request, response: Response, next: NextFunction): void {
  const started = process.hrtime.bigint();
  response.on('finish', () => {
    logger.info(
      {
        method: request.method,
        url: request.originalUrl,
        status: response.statusCode,
        ms: Number((process.hrtime.bigint() - started) / 1_000_000n),
      },
      'request',
    );
  });
  next();
}
