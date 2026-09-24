import type { AssetSymbol, Holding } from '@/api/types';
import { percent, signedUsd, usd } from '@/format/format';

/**
 * Chart series derived from the same holdings the table shows, so charts and table always
 * reconcile. Numbers are converted to floats only here, to position shapes; every label shown
 * to the user is formatted from the exact decimal string.
 */
export type AllocationSlice = {
  symbol: AssetSymbol;
  value: number;
  share: string;
  valueLabel: string;
};

/** Largest first, so the legend reads like a ranking. */
export function allocationData(holdings: Holding[]): AllocationSlice[] {
  const slices = holdings.flatMap((h) =>
    h.status === 'open' &&
    h.currentValue !== null &&
    h.allocation !== null &&
    Number(h.currentValue) > 0
      ? [
          {
            symbol: h.symbol,
            value: Number(h.currentValue),
            share: percent(h.allocation),
            valueLabel: usd(h.currentValue),
          },
        ]
      : [],
  );
  return slices.sort((a, b) => b.value - a.value);
}

export type PnlBar = {
  symbol: string;
  realized: number;
  unrealized: number;
  realizedLabel: string;
  unrealizedLabel: string;
};

export function pnlData(holdings: Holding[]): PnlBar[] {
  return holdings.map((h) => ({
    symbol: h.symbol,
    realized: Number(h.realizedPnl),
    unrealized: h.unrealizedPnl === null ? 0 : Number(h.unrealizedPnl),
    realizedLabel: signedUsd(h.realizedPnl),
    unrealizedLabel: h.unrealizedPnl === null ? 'no price' : signedUsd(h.unrealizedPnl),
  }));
}
