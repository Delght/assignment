// Column names, shared by the table, the phone list, the filters and the totals.

export const TRANSACTION_LABELS = {
  time: 'Time (UTC)',
  tradeId: 'Trade ID',
  exchange: 'Exchange',
  asset: 'Asset',
  side: 'Side',
  assetAndSide: 'Asset and side',
  quantity: 'Quantity',
  price: 'Price',
  grossValue: 'Gross value',
  fee: 'Fee',
  realizedPnl: 'Realized P&L',
} as const;
