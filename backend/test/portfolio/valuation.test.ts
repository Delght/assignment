import { describe, expect, it } from 'vitest';

import { analysePortfolio, Dec, type PriceQuote } from '../../src/portfolio/index.js';
import { cashFlowPnl, text, trades } from './helpers.js';

const AS_OF = '2026-03-31T23:59:59Z';
const quote = (symbol: PriceQuote['symbol'], price: string, asOf = AS_OF): PriceQuote => ({
  symbol,
  priceUsd: new Dec(price),
  asOf,
});

// BTC: 2 @ 100 + fee 2 = 202 (average 101). ETH: 10 @ 30 = 300, then 5 sold @ 40 − 1:
// proceeds 199, cost removed 150 → realized 49; 5 left at 150.
const book = trades(
  'T1,2025-10-01T00:00:00Z,Binance,BTC,BUY,2,100,2',
  'T2,2025-10-01T01:00:00Z,Coinbase,ETH,BUY,10,30,0',
  'T3,2025-10-02T00:00:00Z,Coinbase,ETH,SELL,5,40,1',
);

describe('valuation', () => {
  it('values each holding and the portfolio', () => {
    // BTC 2 × 150 = 300 → unrealized 98. ETH 5 × 20 = 100 → unrealized −50, total −1.
    const { valuation } = analysePortfolio(book, [quote('BTC', '150'), quote('ETH', '20')]);
    const [btc, eth] = valuation.holdings;
    expect(btc).toMatchObject({ symbol: 'BTC', status: 'open' });
    expect(text(btc?.currentValue ?? null)).toBe('300');
    expect(text(btc?.unrealizedPnl ?? null)).toBe('98');
    expect(text(btc?.allocation ?? null)).toBe('0.75');
    expect(text(eth?.unrealizedPnl ?? null)).toBe('-50');
    expect(text(eth?.totalPnl ?? null)).toBe('-1');
    expect(text(eth?.allocation ?? null)).toBe('0.25');
    // unrealized / cost basis: BTC 98 / 202 = 0.4851…, ETH −50 / 150 = −0.3333…
    expect(btc?.unrealizedReturn?.toDecimalPlaces(6).toString()).toBe('0.485149');
    expect(eth?.unrealizedReturn?.toDecimalPlaces(6).toString()).toBe('-0.333333');

    const { summary } = valuation;
    expect(text(summary.currentValue)).toBe('400');
    expect(text(summary.costBasis)).toBe('352');
    expect(text(summary.realizedPnl)).toBe('49');
    expect(text(summary.unrealizedPnl)).toBe('48');
    // 48 / 352 = 0.136363…
    expect(summary.unrealizedReturn?.toDecimalPlaces(6).toString()).toBe('0.136364');
    expect(text(summary.totalPnl)).toBe('97');
    expect(text(summary.totalFees)).toBe('3');
    expect(summary.pricesAsOf).toEqual({ earliest: AS_OF, latest: AS_OF });
    expect(summary.unpricedSymbols).toEqual([]);
  });

  it('counts every fee exactly once: total P&L equals the cash flows', () => {
    // Value 400 + ETH sale 199 − purchases 202 + 300 = 97, the total P&L.
    const { valuation } = analysePortfolio(book, [quote('BTC', '150'), quote('ETH', '20')]);
    expect(text(cashFlowPnl(book, valuation.summary.currentValue))).toBe('97');
    expect(text(valuation.summary.totalPnl)).toBe('97');
  });

  it('never values a holding without a price at 0: it is flagged and left out of totals', () => {
    const { valuation } = analysePortfolio(book, [quote('BTC', '150')]);
    const eth = valuation.holdings.find((h) => h.symbol === 'ETH');
    expect(eth).toMatchObject({
      price: null,
      currentValue: null,
      unrealizedPnl: null,
      allocation: null,
    });
    expect(valuation.summary.unpricedSymbols).toEqual(['ETH']);
    expect(text(valuation.summary.currentValue)).toBe('300');
    expect(text(valuation.summary.unrealizedPnl)).toBe('98');
    // The return compares like with like: 98 over BTC's 202, not over ETH's cost as well.
    expect(valuation.summary.unrealizedReturn?.toDecimalPlaces(6).toString()).toBe('0.485149');
    // Cost basis depends on trades only, so the unpriced ETH still counts.
    expect(text(valuation.summary.costBasis)).toBe('352');
  });

  it('keeps a closed position with its realized P&L, worth 0 and needing no price', () => {
    const closed = trades(
      'T1,2025-10-01T00:00:00Z,Binance,SOL,BUY,4,10,0',
      'T2,2025-10-02T00:00:00Z,Binance,SOL,SELL,4,12,0',
    );
    const { valuation } = analysePortfolio(closed, []);
    expect(valuation.holdings).toHaveLength(1);
    const [sol] = valuation.holdings;
    expect(sol).toMatchObject({ symbol: 'SOL', status: 'closed' });
    expect(text(sol?.currentValue ?? null)).toBe('0');
    expect(text(sol?.totalPnl ?? null)).toBe('8');
    // Nothing is held, so there is no allocation to divide by.
    expect(sol?.allocation).toBeNull();
    expect(sol?.unrealizedReturn).toBeNull();
    expect(valuation.summary.unpricedSymbols).toEqual([]);
    expect(valuation.summary.pricesAsOf).toBeNull();
  });

  it('handles an empty portfolio', () => {
    const { valuation } = analysePortfolio([], [quote('BTC', '150')]);
    expect(valuation.holdings).toEqual([]);
    expect(text(valuation.summary.currentValue)).toBe('0');
    expect(text(valuation.summary.totalPnl)).toBe('0');
  });

  it('reports the range when prices were taken at different times', () => {
    const { valuation } = analysePortfolio(book, [
      quote('BTC', '150', '2026-03-31T23:59:59Z'),
      quote('ETH', '20', '2026-03-31T12:00:00Z'),
    ]);
    expect(valuation.summary.pricesAsOf).toEqual({
      earliest: '2026-03-31T12:00:00Z',
      latest: '2026-03-31T23:59:59Z',
    });
  });
});
