import type { LoggerService } from '@nestjs/common';
import { pino } from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),
  base: { service: 'coinance' },
});

export class NestPinoLogger implements LoggerService {
  log(message: unknown, context?: string): void {
    logger.info({ context }, String(message));
  }
  error(message: unknown, trace?: string, context?: string): void {
    logger.error({ context, trace }, String(message));
  }
  warn(message: unknown, context?: string): void {
    logger.warn({ context }, String(message));
  }
  debug(message: unknown, context?: string): void {
    logger.debug({ context }, String(message));
  }
  verbose(message: unknown, context?: string): void {
    logger.trace({ context }, String(message));
  }
}
