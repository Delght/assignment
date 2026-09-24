import { describe, expect, it } from 'vitest';

import { analysePortfolio, Dec, sumOf } from '../../src/portfolio/index.js';
import { cashFlowPnl, text, trades } from './helpers.js';

const quote = [{ symbol: 'BTC' as const, priceUsd: new Dec('1'), asOf: '2026-01-04T00:00:00Z' }];
const roundTrip = trades(
  'T1,2026-01-01T00:00:00Z,Binance,BTC,BUY,11,1,0.02',
  'T2,2026-01-02T00:00:00Z,Binance,BTC,SELL,1,1,0',
  'T3,2026-01-03T00:00:00Z,Binance,BTC,SELL,10,1,0.005',
);

describe('P&L at display rounding boundaries', () => {
  it('retains the cash-flow identity before and after a full close', () => {
    // Every unit is bought and sold at $1. P&L is just minus fees: -0.02, then -0.025.
    for (const [index, expected] of ['-0.02', '-0.02', '-0.025'].entries()) {
      const history = roundTrip.slice(0, index + 1);
      const { valuation } = analysePortfolio(history, quote);
      expect(text(valuation.summary.totalPnl)).toBe(expected);
      expect(
        valuation.summary.totalPnl.equals(cashFlowPnl(history, valuation.summary.currentValue)),
      ).toBe(true);
    }
    const { ledger, valuation } = analysePortfolio(roundTrip, quote);
    expect(text(valuation.summary.realizedPnl)).toBe('-0.025');
    expect(text(sumOf(ledger.effects, (effect) => effect.realizedPnl))).toBe('-0.025');
    expect(ledger.positions[0]?.quantity.isZero()).toBe(true);
    expect(ledger.positions[0]?.costBasis.isZero()).toBe(true);
    expect(ledger.positions[0]?.averageCost.isZero()).toBe(true);
  });

  it('removes an exact fraction of the acquisition cost before rounding a partial sale', () => {
    // Cost 6 * 1 + 1 = 7. Half sold removes exactly 3.5; proceeds 3 * 1.165 = 3.495.
    // Realized = -0.005, unrealized = 3 - 3.5 = -0.5, total = -0.505.
    const history = trades(
      'T1,2026-01-01T00:00:00Z,Binance,BTC,BUY,6,1,1',
      'T2,2026-01-02T00:00:00Z,Binance,BTC,SELL,3,1.165,0',
    );
    const { ledger, valuation } = analysePortfolio(history, quote);
    expect(text(ledger.effects[1]?.costRemoved ?? null)).toBe('3.5');
    expect(text(valuation.summary.realizedPnl)).toBe('-0.005');
    expect(text(valuation.summary.unrealizedPnl)).toBe('-0.5');
    expect(text(valuation.summary.totalPnl)).toBe('-0.505');
    const [buy, sell] = ledger.effects;
    expect(text(sell?.averageCostAfter ?? null)).toBe(text(buy?.averageCostAfter ?? null));
    expect(
      valuation.summary.totalPnl.equals(cashFlowPnl(history, valuation.summary.currentValue)),
    ).toBe(true);
  });

  it('keeps earlier realized P&L when a position reopens', () => {
    // First round loses 0.025. BUY 2 @ 1 + 0.01, SELL 2 @ 1 + 0.01 loses another 0.02.
    const reopened = trades(
      'T4,2026-01-04T00:00:00Z,Binance,BTC,BUY,2,1,0.01',
      'T5,2026-01-05T00:00:00Z,Binance,BTC,SELL,2,1,0.01',
    );
    const { valuation } = analysePortfolio([...roundTrip, ...reopened], quote);
    expect(text(valuation.summary.realizedPnl)).toBe('-0.045');
    expect(text(valuation.summary.totalPnl)).toBe('-0.045');
  });
});
