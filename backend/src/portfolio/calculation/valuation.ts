import { addExact, type Dec, multiplyExact, subtractExact, sumOf, ZERO } from '../decimal.js';
import { parseUtcTimestamp } from '../import/timestamp.js';
import type { AssetSymbol, PriceQuote } from '../model.js';
import type { Position } from './ledger.js';

/**
 * Value-based fields are null for an open position without a price (it is never valued at 0),
 * and 0 once the position is closed.
 */
export type Holding = Readonly<
  Position & {
    status: 'open' | 'closed';
    price: PriceQuote | null;
    currentValue: Dec | null;
    unrealizedPnl: Dec | null;
    totalPnl: Dec | null;
    /** unrealizedPnl / costBasis, open positions only. */
    unrealizedReturn: Dec | null;
    /** Null when unpriced or when the portfolio is worth 0. */
    allocation: Dec | null;
  }
>;

export type PortfolioSummary = Readonly<{
  /** Priced holdings only. */
  currentValue: Dec;
  /** Every open position: it depends on trades only. */
  costBasis: Dec;
  realizedPnl: Dec;
  /** Priced holdings only. */
  unrealizedPnl: Dec;
  /** Over the cost basis of priced holdings, so like is compared with like. */
  unrealizedReturn: Dec | null;
  totalPnl: Dec;
  totalFees: Dec;
  unpricedSymbols: readonly AssetSymbol[];
  pricesAsOf: Readonly<{ earliest: string; latest: string }> | null;
}>;

export type PortfolioValuation = {
  readonly summary: PortfolioSummary;
  readonly holdings: readonly Holding[];
};

export function valuePortfolio(
  positions: readonly Position[],
  quotes: readonly PriceQuote[],
): PortfolioValuation {
  const priceOf = new Map(quotes.map((quote) => [quote.symbol, quote]));
  const valued = positions.map((position) =>
    valueHolding(position, priceOf.get(position.symbol) ?? null),
  );
  const portfolioValue = sumOf(valued, (holding) => holding.currentValue);
  const holdings = valued.map((holding) => ({
    ...holding,
    allocation:
      holding.currentValue && !portfolioValue.isZero()
        ? holding.currentValue.dividedBy(portfolioValue)
        : null,
  }));
  return { holdings, summary: summarize(holdings, portfolioValue) };
}

function valueHolding(position: Position, price: PriceQuote | null): Omit<Holding, 'allocation'> {
  const open = !position.quantity.isZero();
  const currentValue = !open
    ? ZERO
    : price
      ? multiplyExact(position.quantity, price.priceUsd)
      : null;
  const unrealizedPnl =
    currentValue === null ? null : subtractExact(currentValue, position.costBasis);
  return {
    ...position,
    status: open ? 'open' : 'closed',
    price,
    currentValue,
    unrealizedPnl,
    totalPnl: unrealizedPnl ? addExact(position.realizedPnl, unrealizedPnl) : null,
    unrealizedReturn:
      open && unrealizedPnl && position.costBasis.greaterThan(0)
        ? unrealizedPnl.dividedBy(position.costBasis)
        : null,
  };
}

function summarize(holdings: readonly Holding[], currentValue: Dec): PortfolioSummary {
  const priced = holdings.filter(isOpenAndPriced);
  const realizedPnl = sumOf(holdings, (h) => h.realizedPnl);
  const unrealizedPnl = sumOf(priced, (h) => h.unrealizedPnl);
  const pricedCostBasis = sumOf(priced, (h) => h.costBasis);
  return {
    currentValue,
    costBasis: sumOf(holdings, (h) => h.costBasis),
    realizedPnl,
    unrealizedPnl,
    unrealizedReturn: pricedCostBasis.greaterThan(0)
      ? unrealizedPnl.dividedBy(pricedCostBasis)
      : null,
    totalPnl: addExact(realizedPnl, unrealizedPnl),
    totalFees: sumOf(holdings, (h) => h.feesPaid),
    unpricedSymbols: holdings.filter((h) => h.status === 'open' && !h.price).map((h) => h.symbol),
    pricesAsOf: range(priced.map((h) => (h.price as PriceQuote).asOf)),
  };
}

function isOpenAndPriced(holding: Holding): boolean {
  return holding.status === 'open' && holding.price !== null;
}

function range(timestamps: string[]): { earliest: string; latest: string } | null {
  const sorted = timestamps.sort(
    (a, b) => (parseUtcTimestamp(a) ?? 0) - (parseUtcTimestamp(b) ?? 0),
  );
  const [earliest] = sorted;
  const latest = sorted.at(-1);
  return earliest && latest ? { earliest, latest } : null;
}
