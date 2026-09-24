import type { Dataset } from '../../dataset/dataset.js';
import { sumOf, type Trade } from '../../portfolio/index.js';
import type { TransactionsResponse } from '../contract.js';
import { dec, transactionDto } from '../serialize.js';
import type { TransactionsQuery } from './transactions.query.js';

/** One page of the trades matching the query, with totals over every match. */
export function selectTransactions(
  dataset: Dataset,
  query: TransactionsQuery,
): TransactionsResponse {
  const matching = dataset.trades.filter(matches(query));
  const ordered = query.sort === 'asc' ? matching : [...matching].reverse();
  const start = (query.page - 1) * query.pageSize;
  const effect = (trade: Trade) => dataset.effectsById.get(trade.tradeId);

  return {
    items: ordered
      .slice(start, start + query.pageSize)
      .map((trade) => transactionDto(trade, dataset)),
    page: query.page,
    pageSize: query.pageSize,
    total: matching.length,
    totalPages: Math.max(1, Math.ceil(matching.length / query.pageSize)),
    totals: {
      grossValue: dec(sumOf(matching, (trade) => effect(trade)?.grossValue ?? null)),
      fees: dec(sumOf(matching, (trade) => trade.feeUsd)),
      realizedPnl: dec(sumOf(matching, (trade) => effect(trade)?.realizedPnl ?? null)),
    },
  };
}

function matches(query: TransactionsQuery): (trade: Trade) => boolean {
  const needle = query.q?.toLowerCase();
  return (trade) =>
    (!query.symbol || trade.symbol === query.symbol) &&
    (!query.exchange || trade.exchange === query.exchange) &&
    (!query.side || trade.side === query.side) &&
    (!needle || trade.tradeId.toLowerCase().includes(needle)) &&
    (query.from === undefined || trade.time >= query.from) &&
    (query.toExclusive === undefined || trade.time < query.toExclusive);
}
