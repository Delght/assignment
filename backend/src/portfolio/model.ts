import type { Dec } from './decimal.js';

export const EXCHANGES = ['Binance', 'Coinbase'] as const;
export const SYMBOLS = ['BTC', 'ETH', 'SOL', 'CKB', 'DOGE'] as const;
export const SIDES = ['BUY', 'SELL'] as const;

export type Exchange = (typeof EXCHANGES)[number];
export type AssetSymbol = (typeof SYMBOLS)[number];
export type Side = (typeof SIDES)[number];

/** Parsed once and never changed. */
export type Trade = {
  readonly tradeId: string;
  /** As written in the file (UTC ISO-8601). */
  readonly timestamp: string;
  /** Milliseconds since the epoch, for ordering. */
  readonly time: number;
  readonly exchange: Exchange;
  readonly symbol: AssetSymbol;
  readonly side: Side;
  readonly quantity: Dec;
  readonly priceUsd: Dec;
  readonly feeUsd: Dec;
  /** Line in the source file, for error messages. */
  readonly line: number;
};

export type PriceQuote = {
  readonly symbol: AssetSymbol;
  readonly priceUsd: Dec;
  readonly asOf: string;
};

export type ValidationIssue = {
  /** Line in the file (the header is line 1), or null for a file-level problem. */
  line: number | null;
  column?: string;
  code: string;
  message: string;
};

export type ParseResult<T> = { ok: true; value: T } | { ok: false; issues: ValidationIssue[] };
