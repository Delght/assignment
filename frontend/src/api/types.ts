/**
 * Mirror of backend/src/api/contract.ts. Amounts are decimal strings (plain notation,
 * rounded half-even to 20 places by the server); the UI rounds them only when displaying.
 */
export type DecimalString = string;

export const SYMBOLS = ['BTC', 'ETH', 'SOL', 'CKB', 'DOGE'] as const;
export const EXCHANGES = ['Binance', 'Coinbase'] as const;
export const SIDES = ['BUY', 'SELL'] as const;

export type AssetSymbol = (typeof SYMBOLS)[number];
export type Exchange = (typeof EXCHANGES)[number];
export type Side = (typeof SIDES)[number];

export type DatasetInfo = {
  source: 'sample' | 'upload' | 'none';
  fileName: string | null;
  loadedAt: string;
  tradeCount: number;
  warnings: string[];
};

export type Holding = {
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

export type PortfolioSummary = {
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

export type PortfolioResponse = {
  dataset: DatasetInfo;
  summary: PortfolioSummary;
  holdings: Holding[];
};

export type Transaction = {
  tradeId: string;
  timestamp: string;
  exchange: Exchange;
  symbol: AssetSymbol;
  side: Side;
  quantity: DecimalString;
  priceUsd: DecimalString;
  feeUsd: DecimalString;
  grossValue: DecimalString;
  realizedPnl: DecimalString | null;
};

export type TransactionsResponse = {
  items: Transaction[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  totals: { grossValue: DecimalString; fees: DecimalString; realizedPnl: DecimalString };
};

export type ImportResponse = { dataset: DatasetInfo };

export type ValidationIssue = {
  line: number | null;
  column?: string;
  code: string;
  message: string;
};

export type ErrorBody = {
  code: string;
  message: string;
  issues?: ValidationIssue[];
  totalIssues?: number;
};
