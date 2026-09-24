import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException } from '@nestjs/common';
import type { Request, Response } from 'express';

import { logger } from '../logger.js';
import { ApiError, type ErrorBody } from './api-error.js';

/** Issues sent back per request; a broken file can have thousands. */
const MAX_ISSUES = 200;

/**
 * Turns every failure into the same JSON shape. Expected errors keep their status and message;
 * anything else is logged with its stack and answered with a generic 500, never a stack trace.
 */
@Catch()
export class ErrorFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const { status, body } = toResponse(error);
    if (status >= 500) {
      logger.error(
        { err: error, method: request.method, url: request.originalUrl },
        'request failed',
      );
    }
    response.status(status).setHeader('Cache-Control', 'no-store').json(body);
  }
}

function toResponse(error: unknown): { status: number; body: ErrorBody } {
  if (error instanceof ApiError) {
    const body: ErrorBody = { code: error.code, message: error.message };
    if (error.issues) {
      body.issues = error.issues.slice(0, MAX_ISSUES);
      if (error.issues.length > MAX_ISSUES) body.totalIssues = error.issues.length;
    }
    return { status: error.status, body };
  }
  if (error instanceof HttpException) {
    // Framework errors: unknown route, body too large, unsupported media type…
    const status = error.getStatus();
    return { status, body: { code: codeFor(status), message: messageOf(error) } };
  }
  if (isHttpError(error)) {
    // Errors raised by the body parser before Nest sees the request (e.g. 413 Payload Too Large).
    return { status: error.status, body: { code: codeFor(error.status), message: error.message } };
  }
  return { status: 500, body: { code: 'internal_error', message: 'Unexpected server error.' } };
}

function isHttpError(error: unknown): error is { status: number; message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as { status?: unknown }).status === 'number' &&
    (error as { status: number }).status >= 400 &&
    (error as { status: number }).status < 500
  );
}

function codeFor(status: number): string {
  const codes: Record<number, string> = {
    400: 'bad_request',
    404: 'not_found',
    405: 'method_not_allowed',
    413: 'payload_too_large',
    415: 'unsupported_media_type',
  };
  return codes[status] ?? (status >= 500 ? 'internal_error' : 'request_error');
}

function messageOf(error: HttpException): string {
  const response = error.getResponse();
  if (typeof response === 'string') return response;
  const message = (response as { message?: unknown }).message;
  return typeof message === 'string' ? message : error.message;
}
