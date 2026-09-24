import { describe, expect, it } from 'vitest';

import { useSampleApp } from './support.js';

const ids = (body: { items: { tradeId: string }[] }) => body.items.map((item) => item.tradeId);

describe('GET /api/transactions', () => {
  const http = useSampleApp();

  it('lists newest first with the effect of each trade and totals for the filter', async () => {
    const response = await http().get('/api/transactions');
    expect(response.status).toBe(200);
    expect(ids(response.body)).toEqual(['T3', 'T2', 'T1']);
    expect(response.body).toMatchObject({ page: 1, pageSize: 25, total: 3, totalPages: 1 });
    // Gross 200 + 300 + 200; fees 2 + 0 + 1; realized only on the SELL.
    expect(response.body.totals).toEqual({ grossValue: '700', fees: '3', realizedPnl: '49' });
    expect(response.body.items[0]).toEqual({
      tradeId: 'T3',
      timestamp: '2025-10-02T00:00:00Z',
      exchange: 'Coinbase',
      symbol: 'ETH',
      side: 'SELL',
      quantity: '5',
      priceUsd: '40',
      feeUsd: '1',
      grossValue: '200',
      realizedPnl: '49',
    });
    expect(response.body.items[2]).toMatchObject({
      tradeId: 'T1',
      grossValue: '200',
      realizedPnl: null,
    });
  });

  it.each([
    ['symbol=ETH', ['T3', 'T2']],
    ['exchange=Binance', ['T1']],
    ['side=SELL', ['T3']],
    ['q=t3', ['T3']],
    ['from=2025-10-02&to=2025-10-02', ['T3']],
    ['from=2025-10-01&to=2025-10-01', ['T2', 'T1']],
    ['sort=asc', ['T1', 'T2', 'T3']],
    ['sort=asc&pageSize=2&page=2', ['T3']],
    ['symbol=SOL', []],
  ])('filters with %s', async (query, expected) => {
    const response = await http().get(`/api/transactions?${query}`);
    expect(response.status).toBe(200);
    expect(ids(response.body)).toEqual(expected);
  });

  it('computes totals over every matching row, not just the page', async () => {
    const response = await http().get('/api/transactions?pageSize=1');
    expect(response.body).toMatchObject({ total: 3, totalPages: 3 });
    expect(response.body.totals.grossValue).toBe('700');
  });

  it.each([
    ['symbol=XRP', 'symbol'],
    ['from=2025-02-30', 'from'],
    ['from=2025-10-03&to=2025-10-01', 'from'],
    ['pageSize=1000', 'pageSize'],
    ['page=0', 'page'],
    ['colour=blue', 'colour'],
  ])('rejects %s, naming the parameter', async (query, parameter) => {
    const response = await http().get(`/api/transactions?${query}`);
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('invalid_query');
    expect(response.body.issues[0].message).toContain(parameter);
  });
});
