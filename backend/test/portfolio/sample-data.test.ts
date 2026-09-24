import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  analysePortfolio,
  Dec,
  parsePrices,
  parseTrades,
  sumOf,
} from '../../src/portfolio/index.js';
import { cashFlowPnl } from './helpers.js';
import reference from './sample-reference.json' with { type: 'json' };

/**
 * The supplied sample data against sample-reference.json, written by scripts/reference.py: an
 * independent Python Decimal implementation, rounded half-even to 10 places. The data files are
 * not in the repository; copy them into data/ to run this suite, which is skipped otherwise.
 */
const tradesPath = fileURLToPath(new URL('../../../data/trades.csv', import.meta.url));
const pricesPath = fileURLToPath(new URL('../../../data/prices.csv', import.meta.url));
const hasSampleData = existsSync(tradesPath) && existsSync(pricesPath);

/** Each asset has two full closes, in the 76–80 and 156–160 trades. */
const FULL_CLOSES = [76, 77, 78, 79, 80, 156, 157, 158, 159, 160].map(
  (n) => `TRD-${String(n).padStart(4, '0')}`,
);

const places10 = (value: Dec | null) =>
  value === null ? null : value.toDecimalPlaces(10, Dec.ROUND_HALF_EVEN).toFixed(10);

function load() {
  const trades = parseTrades(readFileSync(tradesPath, 'utf8'));
  const prices = parsePrices(readFileSync(pricesPath, 'utf8'));
  if (!trades.ok || !prices.ok) throw new Error('sample data failed validation');
  return { trades: trades.value, ...analysePortfolio(trades.value, prices.value) };
}

describe.skipIf(!hasSampleData)('sample data', () => {
  it('imports all 200 trades', () => {
    expect(load().trades).toHaveLength(200);
  });

  it('matches the reference per asset', () => {
    const { holdings } = load().valuation;
    expect(holdings.map((h) => h.symbol)).toEqual(['BTC', 'ETH', 'SOL', 'CKB', 'DOGE']);
    for (const h of holdings) {
      expect({
        quantity: places10(h.quantity),
        average_cost: places10(h.averageCost),
        cost_basis: places10(h.costBasis),
        current_value: places10(h.currentValue),
        realized_pnl: places10(h.realizedPnl),
        unrealized_pnl: places10(h.unrealizedPnl),
        total_pnl: places10(h.totalPnl),
        fees: places10(h.feesPaid),
        allocation: places10(h.allocation),
      }).toEqual(reference.assets[h.symbol]);
    }
  });

  it('matches the reference in total', () => {
    const { summary } = load().valuation;
    expect({
      current_value: places10(summary.currentValue),
      cost_basis: places10(summary.costBasis),
      realized_pnl: places10(summary.realizedPnl),
      unrealized_pnl: places10(summary.unrealizedPnl),
      total_pnl: places10(summary.totalPnl),
      fees: places10(summary.totalFees),
    }).toEqual(reference.totals);
    expect(summary.pricesAsOf).toEqual({
      earliest: '2026-03-31T23:59:59Z',
      latest: '2026-03-31T23:59:59Z',
    });
  });

  it('reconciles holdings with the headline figures', () => {
    const { holdings, summary } = load().valuation;
    expect(sumOf(holdings, (h) => h.currentValue).equals(summary.currentValue)).toBe(true);
    expect(sumOf(holdings, (h) => h.costBasis).equals(summary.costBasis)).toBe(true);
    expect(sumOf(holdings, (h) => h.realizedPnl).equals(summary.realizedPnl)).toBe(true);
    expect(sumOf(holdings, (h) => h.unrealizedPnl).equals(summary.unrealizedPnl)).toBe(true);
    expect(sumOf(holdings, (h) => h.feesPaid).equals(summary.totalFees)).toBe(true);
    expect(summary.realizedPnl.plus(summary.unrealizedPnl).equals(summary.totalPnl)).toBe(true);
    // Each allocation is a rounded division; together they are 1 far beyond display precision.
    expect(
      sumOf(holdings, (h) => h.allocation)
        .minus(1)
        .abs()
        .lessThan('1e-30'),
    ).toBe(true);
  });

  it('counts every fee exactly once: total P&L equals the cash flows', () => {
    const { trades, valuation } = load();
    const difference = cashFlowPnl(trades, valuation.summary.currentValue).minus(
      valuation.summary.totalPnl,
    );
    // Equal up to the 40-digit arithmetic's last places.
    expect(difference.abs().lessThan('1e-20')).toBe(true);
  });

  it('closes every position to exactly zero at each full close', () => {
    const { effects } = load().ledger;
    for (const tradeId of FULL_CLOSES) {
      const effect = effects.find((e) => e.tradeId === tradeId);
      expect(effect?.side, tradeId).toBe('SELL');
      expect(effect?.quantityAfter.isZero(), tradeId).toBe(true);
      expect(effect?.costBasisAfter.isZero(), tradeId).toBe(true);
    }
  });
});
