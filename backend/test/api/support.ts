import 'reflect-metadata';

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll } from 'vitest';

import { configureApp } from '../../src/app.js';
import { AppModule } from '../../src/app.module.js';
import { DATA_DIR } from '../../src/config.js';

export const AS_OF = '2026-03-31T23:59:59Z';
export const HEADER = 'trade_id,timestamp,exchange,symbol,side,quantity,price_usd,fee_usd';

/** BTC 2 @ 100 + 2 = 202. ETH 10 @ 30 = 300, 5 sold @ 40 − 1 → realized 49, 5 left at 150. */
export const SAMPLE_TRADES = [
  HEADER,
  'T1,2025-10-01T00:00:00Z,Binance,BTC,BUY,2,100,2',
  'T2,2025-10-01T01:00:00Z,Coinbase,ETH,BUY,10,30,0',
  'T3,2025-10-02T00:00:00Z,Coinbase,ETH,SELL,5,40,1',
].join('\n');
export const SAMPLE_PRICES = ['as_of,symbol,price_usd', `${AS_OF},BTC,150`, `${AS_OF},ETH,20`].join(
  '\n',
);

export async function startApp(
  files: { trades?: string; prices?: string },
  staticDir?: string,
): Promise<{ app: NestExpressApplication; close: () => Promise<void> }> {
  const dir = mkdtempSync(join(tmpdir(), 'portfolio-api-'));
  if (files.trades !== undefined) writeFileSync(join(dir, 'trades.csv'), files.trades);
  if (files.prices !== undefined) writeFileSync(join(dir, 'prices.csv'), files.prices);

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(DATA_DIR)
    .useValue(dir)
    .compile();
  const app = configureApp(moduleRef.createNestApplication<NestExpressApplication>(), {
    staticDir,
  });
  await app.init();
  return {
    app,
    close: async () => {
      await app.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

/** One app with the sample files for the whole file; returns a supertest agent factory. */
export function useSampleApp(): () => ReturnType<typeof request> {
  let started: Awaited<ReturnType<typeof startApp>>;
  beforeAll(async () => {
    started = await startApp({ trades: SAMPLE_TRADES, prices: SAMPLE_PRICES });
  });
  afterAll(async () => {
    await started.close();
  });
  return () => request(started.app.getHttpServer());
}

export function upload(http: ReturnType<typeof request>, body: string, type = 'text/csv') {
  return http
    .post('/api/import')
    .set('Content-Type', type)
    .set('X-File-Name', 'mine.csv')
    .send(body);
}
