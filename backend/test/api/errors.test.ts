import type { ArgumentsHost } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { ErrorFilter } from '../../src/infra/http/error.filter.js';
import { useSampleApp } from './support.js';

describe('HTTP basics', () => {
  const http = useSampleApp();

  it('answers the health check', async () => {
    const response = await http().get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('answers unknown routes with the JSON error shape', async () => {
    const response = await http().get('/api/nope');
    expect(response.status).toBe(404);
    expect(response.body.code).toBe('not_found');
  });
});

describe('ErrorFilter', () => {
  it('hides unexpected errors behind a generic 500', () => {
    const json = vi.fn();
    const response = { status: vi.fn(() => response), setHeader: vi.fn(() => response), json };
    const host = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', originalUrl: '/api/portfolio' }),
        getResponse: () => response,
      }),
    } as unknown as ArgumentsHost;

    new ErrorFilter().catch(new Error('database password is hunter2'), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: 'internal_error',
      message: 'Unexpected server error.',
    });
  });
});
