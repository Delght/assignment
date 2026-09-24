import { afterEach, describe, expect, it } from 'vitest';

import { MAX_IMPORT_BYTES } from '../../src/config.js';
import { HEADER, upload, useSampleApp } from './support.js';

describe('POST /api/import and /api/reset', () => {
  const http = useSampleApp();

  afterEach(async () => {
    await http().post('/api/reset');
  });

  it('replaces the trades and keeps the prices', async () => {
    const response = await upload(
      http(),
      `${HEADER}\nX1,2025-11-01T00:00:00Z,Binance,BTC,BUY,1,120,0`,
    );
    expect(response.status).toBe(200);
    expect(response.body.dataset).toMatchObject({
      source: 'upload',
      fileName: 'mine.csv',
      tradeCount: 1,
    });
    const portfolio = (await http().get('/api/portfolio')).body;
    expect(portfolio.summary).toMatchObject({
      currentValue: '150',
      costBasis: '120',
      unrealizedPnl: '30',
    });
  });

  it('rejects an invalid file with every issue and leaves the portfolio untouched', async () => {
    const before = (await http().get('/api/portfolio')).body.summary;
    const response = await upload(
      http(),
      [
        HEADER,
        'X1,2025-11-01T00:00:00Z,Binance,BTC,BUY,1,120,0',
        'X1,2025-11-02T00:00:00Z,Kraken,BTC,BUY,1,120,0',
      ].join('\n'),
    );
    expect(response.status).toBe(422);
    expect(response.body.code).toBe('invalid_file');
    expect(response.body.message).toContain('Nothing was changed');
    expect(
      response.body.issues.map((i: { line: number; code: string }) => [i.line, i.code]),
    ).toEqual([
      [3, 'unsupported_exchange'],
      [3, 'duplicate_trade_id'],
    ]);
    expect((await http().get('/api/portfolio')).body.summary).toEqual(before);
  });

  it('rejects a short sale', async () => {
    const response = await upload(
      http(),
      [
        HEADER,
        'X1,2025-11-01T00:00:00Z,Binance,BTC,BUY,1,120,0',
        'X2,2025-11-02T00:00:00Z,Binance,BTC,SELL,2,130,0',
      ].join('\n'),
    );
    expect(response.status).toBe(422);
    expect(response.body.issues[0]).toMatchObject({ line: 3, code: 'insufficient_quantity' });
  });

  it('rejects an empty body', async () => {
    const response = await upload(http(), '');
    expect(response.status).toBe(422);
    expect(response.body.issues[0].code).toBe('empty_file');
  });

  it('rejects a body that is not CSV text', async () => {
    const response = await upload(http(), '{"trades":[]}', 'application/json');
    expect(response.status).toBe(415);
    expect(response.body.code).toBe('unsupported_media_type');
  });

  it('rejects a file over the size limit as JSON, not an HTML error page', async () => {
    const response = await upload(http(), `${HEADER}\n${'x'.repeat(MAX_IMPORT_BYTES + 1)}`);
    expect(response.status).toBe(413);
    expect(response.body.code).toBe('payload_too_large');
  });

  it('caps the issue list and says how many there were', async () => {
    const rows = Array.from({ length: 250 }, (_, i) => `X${i},not-a-date,Binance,BTC,BUY,1,1,0`);
    const response = await upload(http(), [HEADER, ...rows].join('\n'));
    expect(response.status).toBe(422);
    expect(response.body.issues).toHaveLength(200);
    expect(response.body.totalIssues).toBe(250);
  });

  it('restores the sample files on reset', async () => {
    await upload(http(), `${HEADER}\nX1,2025-11-01T00:00:00Z,Binance,BTC,BUY,1,120,0`);
    const response = await http().post('/api/reset');
    expect(response.status).toBe(200);
    expect(response.body.dataset).toMatchObject({ source: 'sample', tradeCount: 3 });
  });
});
