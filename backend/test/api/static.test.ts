import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { SAMPLE_PRICES, SAMPLE_TRADES, startApp } from './support.js';

describe('serving the built frontend', () => {
  const staticDir = mkdtempSync(join(tmpdir(), 'portfolio-web-'));
  let started: Awaited<ReturnType<typeof startApp>>;
  const http = () => request(started.app.getHttpServer());

  beforeAll(async () => {
    writeFileSync(
      join(staticDir, 'index.html'),
      '<!doctype html><title>Portfolio Analytics</title>',
    );
    started = await startApp({ trades: SAMPLE_TRADES, prices: SAMPLE_PRICES }, staticDir);
  });
  afterAll(async () => {
    await started.close();
    rmSync(staticDir, { recursive: true, force: true });
  });

  it('serves the app at / and the API under /api from one origin', async () => {
    const page = await http().get('/');
    expect(page.status).toBe(200);
    expect(page.text).toContain('Portfolio Analytics');
    expect((await http().get('/api/health')).body).toEqual({ status: 'ok' });
  });

  it('sends security headers', async () => {
    const page = await http().get('/');
    expect(page.headers['x-content-type-options']).toBe('nosniff');
    expect(page.headers['content-security-policy']).toContain("default-src 'self'");
  });

  it('keeps API errors as JSON', async () => {
    const response = await http().get('/api/nope');
    expect(response.status).toBe(404);
    expect(response.body.code).toBe('not_found');
  });
});
