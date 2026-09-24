import { describe, expect, it } from 'vitest';

import type { Holding } from '@/api/types';
import { btc, eth } from '@/test/fixtures';

import { allocationData, pnlData } from './chartData';

const closedSol: Holding = {
  ...eth,
  symbol: 'SOL',
  status: 'closed',
  quantity: '0',
  costBasis: '0',
  currentValue: '0',
  unrealizedPnl: '0',
  unrealizedReturn: null,
  realizedPnl: '8',
  totalPnl: '8',
  allocation: null,
};
const unpricedDoge: Holding = {
  ...eth,
  symbol: 'DOGE',
  currentPrice: null,
  currentValue: null,
  unrealizedPnl: null,
  unrealizedReturn: null,
  totalPnl: null,
  allocation: null,
};

describe('allocationData', () => {
  it('has one slice per priced open position, labelled from the exact values', () => {
    expect(allocationData([btc, eth, closedSol, unpricedDoge])).toEqual([
      { symbol: 'BTC', value: 300, share: '75.00%', valueLabel: '$300.00' },
      { symbol: 'ETH', value: 100, share: '25.00%', valueLabel: '$100.00' },
    ]);
  });
});

describe('pnlData', () => {
  it('has a bar pair per asset, closed ones included, negatives kept negative', () => {
    expect(pnlData([btc, eth, closedSol, unpricedDoge])).toEqual([
      {
        symbol: 'BTC',
        realized: 0,
        unrealized: 98,
        realizedLabel: '$0.00',
        unrealizedLabel: '+$98.00',
      },
      {
        symbol: 'ETH',
        realized: 49,
        unrealized: -50,
        realizedLabel: '+$49.00',
        unrealizedLabel: '-$50.00',
      },
      {
        symbol: 'SOL',
        realized: 8,
        unrealized: 0,
        realizedLabel: '+$8.00',
        unrealizedLabel: '$0.00',
      },
      {
        symbol: 'DOGE',
        realized: 49,
        unrealized: 0,
        realizedLabel: '+$49.00',
        unrealizedLabel: 'no price',
      },
    ]);
  });
});
