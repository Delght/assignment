/**
 * The JSON contract. Amounts and quantities are decimal strings (see `dec` in serialize.ts);
 * the client rounds them for display only. frontend/src/api/types.ts mirrors these types.
 */
import type { AssetSymbol, Exchange, Side } from '../portfolio/index.js';

export type DecimalString = string;

export type DatasetInfo = {
  source: 'sample' | 'upload' | 'none';
  fileName: string | null;
  loadedAt: string;
  tradeCount: number;
  /** Problems that did not stop the app, e.g. no prices file. */
  warnings: string[];
};

export type HoldingDto = {
  symbol: AssetSymbol;
  status: 'open' | 'closed';
  quantity: DecimalString;
  averageCost: DecimalString;
  costBasis: DecimalString;
  currentPrice: DecimalString | null;
  priceAsOf: string | null;
  currentValue: DecimalString | null;
  realizedPnl: DecimalString;
  unrealizedPnl: DecimalString | null;
  unrealizedReturn: DecimalString | null;
  totalPnl: DecimalString | null;
  allocation: DecimalString | null;
  feesPaid: DecimalString;
  tradeCount: number;
};

export type PortfolioResponse = {
  dataset: DatasetInfo;
  summary: {
    currentValue: DecimalString;
    costBasis: DecimalString;
    realizedPnl: DecimalString;
    unrealizedPnl: DecimalString;
    unrealizedReturn: DecimalString | null;
    totalPnl: DecimalString;
    totalFees: DecimalString;
    unpricedSymbols: AssetSymbol[];
    pricesAsOf: { earliest: string; latest: string } | null;
  };
  holdings: HoldingDto[];
};

export type TransactionDto = {
  tradeId: string;
  timestamp: string;
  exchange: Exchange;
  symbol: AssetSymbol;
  side: Side;
  quantity: DecimalString;
  priceUsd: DecimalString;
  feeUsd: DecimalString;
  grossValue: DecimalString;
  /** SELL only: net proceeds − average cost × quantity. */
  realizedPnl: DecimalString | null;
};

export type TransactionsResponse = {
  items: TransactionDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  /** Over every row matching the filters, not just this page. */
  totals: { grossValue: DecimalString; fees: DecimalString; realizedPnl: DecimalString };
};

export type ImportResponse = { dataset: DatasetInfo };
