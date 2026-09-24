import type { Dec } from './decimal.js';

export const EXCHANGES = ['Binance', 'Coinbase'] as const;
export const SYMBOLS = ['BTC', 'ETH', 'SOL', 'CKB', 'DOGE'] as const;
export const SIDES = ['BUY', 'SELL'] as const;

export type Exchange = (typeof EXCHANGES)[number];
export type AssetSymbol = (typeof SYMBOLS)[number];
export type Side = (typeof SIDES)[number];

export type Trade = {
  tradeId: string;
  /** As written in the file (UTC ISO-8601). */
  timestamp: string;
  /** Milliseconds since the epoch, for ordering. */
  time: number;
  exchange: Exchange;
  symbol: AssetSymbol;
  side: Side;
  quantity: Dec;
  priceUsd: Dec;
  feeUsd: Dec;
  /** Line in the source file, for error messages. */
  line: number;
};

export type PriceQuote = {
  symbol: AssetSymbol;
  priceUsd: Dec;
  asOf: string;
};

export type ValidationIssue = {
  /** Line in the file (the header is line 1), or null for a file-level problem. */
  line: number | null;
  column?: string;
  code: string;
  message: string;
};

export type ParseResult<T> = { ok: true; value: T } | { ok: false; issues: ValidationIssue[] };
