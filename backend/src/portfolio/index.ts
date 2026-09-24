/**
 * Portfolio domain: parsing, validation, weighted-average ledger and valuation. No framework and
 * no I/O, so every result is a pure function of its inputs.
 */
import { buildLedger, type Ledger } from './calculation/ledger.js';
import { type PortfolioValuation, valuePortfolio } from './calculation/valuation.js';
import type { PriceQuote, Trade } from './model.js';

export {
  InsufficientQuantityError,
  type Ledger,
  type Position,
  sortTrades,
  type TradeEffect,
} from './calculation/ledger.js';
export type { Holding, PortfolioSummary, PortfolioValuation } from './calculation/valuation.js';
export { Dec, sumOf, ZERO } from './decimal.js';
export { parsePrices } from './import/prices.js';
export { parseUtcTimestamp } from './import/timestamp.js';
export { parseTrades } from './import/trades.js';
export * from './model.js';

export function analysePortfolio(
  trades: readonly Trade[],
  quotes: readonly PriceQuote[],
): { ledger: Ledger; valuation: PortfolioValuation } {
  const ledger = buildLedger(trades);
  return { ledger, valuation: valuePortfolio(ledger.positions, quotes) };
}
