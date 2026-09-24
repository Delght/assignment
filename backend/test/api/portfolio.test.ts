import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { AS_OF, SAMPLE_PRICES, SAMPLE_TRADES, startApp, useSampleApp } from './support.js';

describe('GET /api/portfolio', () => {
  const http = useSampleApp();

  it('returns the summary and holdings as exact decimal strings', async () => {
    const response = await http().get('/api/portfolio');
    expect(response.status).toBe(200);
    const { dataset, summary, holdings } = response.body;
    expect(dataset).toMatchObject({
      source: 'sample',
      fileName: null,
      tradeCount: 3,
      warnings: [],
    });
    expect(summary).toMatchObject({
      currentValue: '400',
      costBasis: '352',
      realizedPnl: '49',
      unrealizedPnl: '48',
      totalPnl: '97',
      totalFees: '3',
      unpricedSymbols: [],
      pricesAsOf: { earliest: AS_OF, latest: AS_OF },
    });
    // 48 / 352 = 0.136363…
    expect(summary.unrealizedReturn).toMatch(/^0\.1363636363/);
    expect(holdings.map((h: { symbol: string }) => h.symbol)).toEqual(['BTC', 'ETH']);
    expect(holdings[0]).toMatchObject({
      symbol: 'BTC',
      status: 'open',
      quantity: '2',
      averageCost: '101',
      costBasis: '202',
      currentPrice: '150',
      priceAsOf: AS_OF,
      currentValue: '300',
      realizedPnl: '0',
      unrealizedPnl: '98',
      totalPnl: '98',
      allocation: '0.75',
      feesPaid: '2',
      tradeCount: 1,
    });
  });
});

describe('GET /api/portfolio without sample files', () => {
  it('starts empty, explains why, refuses reset and still accepts an import', async () => {
    const { app, close } = await startApp({ prices: SAMPLE_PRICES });
    const http = () => request(app.getHttpServer());
    try {
      const portfolio = (await http().get('/api/portfolio')).body;
      expect(portfolio.dataset).toMatchObject({ source: 'none', tradeCount: 0 });
      expect(portfolio.dataset.warnings[0]).toContain('No sample trades.csv');
      expect(portfolio.holdings).toEqual([]);

      const reset = await http().post('/api/reset');
      expect(reset.status).toBe(409);
      expect(reset.body.code).toBe('sample_unavailable');

      await http()
        .post('/api/import')
        .set('Content-Type', 'text/csv')
        .send(`${SAMPLE_TRADES.split('\n')[0]}\nX1,2025-11-01T00:00:00Z,Binance,BTC,BUY,1,120,0`);
      // Prices were loaded even though the trades were missing.
      expect((await http().get('/api/portfolio')).body.summary.currentValue).toBe('150');
    } finally {
      await close();
    }
  });

  it('shows holdings as unpriced when prices.csv is missing', async () => {
    const { app, close } = await startApp({ trades: SAMPLE_TRADES });
    try {
      const portfolio = (await request(app.getHttpServer()).get('/api/portfolio')).body;
      expect(portfolio.dataset.warnings).toEqual([
        'Prices: no prices.csv on the server; holdings are unpriced.',
      ]);
      expect(portfolio.summary).toMatchObject({
        unpricedSymbols: ['BTC', 'ETH'],
        currentValue: '0',
        costBasis: '352',
        pricesAsOf: null,
      });
      expect(portfolio.holdings[0]).toMatchObject({ currentPrice: null, currentValue: null });
    } finally {
      await close();
    }
  });
});
