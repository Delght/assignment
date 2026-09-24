import {
  analysePortfolio,
  type PortfolioValuation,
  type PriceQuote,
  sortTrades,
  type Trade,
  type TradeEffect,
} from '../portfolio/index.js';

/** prices.csv as loaded, with what went wrong reading it; it outlives every import. */
export type PriceSnapshot = {
  readonly quotes: readonly PriceQuote[];
  readonly warnings: readonly string[];
};

/** Everything computed from one set of trades and prices. Replaced whole, never edited. */
export type Dataset = {
  readonly source: 'sample' | 'upload' | 'none';
  readonly fileName: string | null;
  readonly loadedAt: string;
  /** In ledger order: timestamp, then trade_id. */
  readonly trades: readonly Trade[];
  readonly prices: PriceSnapshot;
  readonly valuation: PortfolioValuation;
  readonly effectsById: ReadonlyMap<string, Readonly<TradeEffect>>;
  /** About the trades first, then about the prices. */
  readonly warnings: readonly string[];
};

export function buildDataset(
  source: Dataset['source'],
  trades: readonly Trade[],
  prices: PriceSnapshot,
  {
    fileName = null,
    warnings = [],
  }: { fileName?: string | null; warnings?: readonly string[] } = {},
): Dataset {
  const sorted = sortTrades(trades);
  const { ledger, valuation } = analysePortfolio(sorted, prices.quotes);
  return {
    source,
    fileName,
    loadedAt: new Date().toISOString(),
    trades: sorted,
    prices,
    valuation,
    effectsById: new Map(ledger.effects.map((effect) => [effect.tradeId, effect])),
    warnings: [...warnings, ...prices.warnings],
  };
}
