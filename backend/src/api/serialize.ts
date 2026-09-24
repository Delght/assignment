import type { Dataset } from '../dataset/dataset.js';
import { Dec, type Holding, type Trade } from '../portfolio/index.js';
import type {
  DatasetInfo,
  DecimalString,
  HoldingDto,
  PortfolioResponse,
  TransactionDto,
} from './contract.js';

/**
 * Far beyond display precision, and short of the 40-digit engine's rounding noise (a total can
 * otherwise end in …000000000021 at the 36th decimal place).
 */
const WIRE_DECIMAL_PLACES = 20;

/** Plain notation: `toString()` would write 0.00000001 as "1e-8". */
export function dec(value: Dec): DecimalString {
  return value.toDecimalPlaces(WIRE_DECIMAL_PLACES, Dec.ROUND_HALF_EVEN).toFixed();
}

const decOrNull = (value: Dec | null): DecimalString | null => (value === null ? null : dec(value));

export function datasetInfo(dataset: Dataset): DatasetInfo {
  return {
    source: dataset.source,
    fileName: dataset.fileName,
    loadedAt: dataset.loadedAt,
    tradeCount: dataset.trades.length,
    warnings: dataset.warnings,
  };
}

export function portfolioResponse(dataset: Dataset): PortfolioResponse {
  const { summary, holdings } = dataset.valuation;
  return {
    dataset: datasetInfo(dataset),
    summary: {
      currentValue: dec(summary.currentValue),
      costBasis: dec(summary.costBasis),
      realizedPnl: dec(summary.realizedPnl),
      unrealizedPnl: dec(summary.unrealizedPnl),
      unrealizedReturn: decOrNull(summary.unrealizedReturn),
      totalPnl: dec(summary.totalPnl),
      totalFees: dec(summary.totalFees),
      unpricedSymbols: summary.unpricedSymbols,
      pricesAsOf: summary.pricesAsOf,
    },
    holdings: holdings.map(holdingDto),
  };
}

function holdingDto(holding: Holding): HoldingDto {
  return {
    symbol: holding.symbol,
    status: holding.status,
    quantity: dec(holding.quantity),
    averageCost: dec(holding.averageCost),
    costBasis: dec(holding.costBasis),
    currentPrice: holding.price ? dec(holding.price.priceUsd) : null,
    priceAsOf: holding.price?.asOf ?? null,
    currentValue: decOrNull(holding.currentValue),
    realizedPnl: dec(holding.realizedPnl),
    unrealizedPnl: decOrNull(holding.unrealizedPnl),
    unrealizedReturn: decOrNull(holding.unrealizedReturn),
    totalPnl: decOrNull(holding.totalPnl),
    allocation: decOrNull(holding.allocation),
    feesPaid: dec(holding.feesPaid),
    tradeCount: holding.tradeCount,
  };
}

export function transactionDto(trade: Trade, dataset: Dataset): TransactionDto {
  const effect = dataset.effectsById.get(trade.tradeId);
  if (!effect) throw new Error(`no ledger entry for ${trade.tradeId}`);
  return {
    tradeId: trade.tradeId,
    timestamp: trade.timestamp,
    exchange: trade.exchange,
    symbol: trade.symbol,
    side: trade.side,
    quantity: dec(trade.quantity),
    priceUsd: dec(trade.priceUsd),
    feeUsd: dec(trade.feeUsd),
    grossValue: dec(effect.grossValue),
    realizedPnl: trade.side === 'SELL' ? dec(effect.realizedPnl) : null,
  };
}
