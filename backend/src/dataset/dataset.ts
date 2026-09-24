import {
  analysePortfolio,
  type Ledger,
  type PortfolioValuation,
  type PriceQuote,
  sortTrades,
  type Trade,
  type TradeEffect,
} from '../portfolio/index.js';

/** Everything computed from one set of trades and prices. Replaced whole, never edited. */
export type Dataset = {
  source: 'sample' | 'upload' | 'none';
  fileName: string | null;
  loadedAt: string;
  /** In ledger order: timestamp, then trade_id. */
  trades: Trade[];
  quotes: PriceQuote[];
  ledger: Ledger;
  valuation: PortfolioValuation;
  effectsById: Map<string, TradeEffect>;
  warnings: string[];
};

export function buildDataset(
  source: Dataset['source'],
  trades: readonly Trade[],
  quotes: PriceQuote[],
  warnings: string[],
  fileName: string | null = null,
): Dataset {
  const sorted = sortTrades(trades);
  const { ledger, valuation } = analysePortfolio(sorted, quotes);
  return {
    source,
    fileName,
    loadedAt: new Date().toISOString(),
    trades: sorted,
    quotes,
    ledger,
    valuation,
    effectsById: new Map(ledger.effects.map((effect) => [effect.tradeId, effect])),
    warnings,
  };
}
