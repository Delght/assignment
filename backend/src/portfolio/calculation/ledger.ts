import { addExact, type Dec, multiplyExact, subtractExact, ZERO } from '../decimal.js';
import { type AssetSymbol, type Side, SYMBOLS, type Trade } from '../model.js';

export type Position = {
  symbol: AssetSymbol;
  quantity: Dec;
  costBasis: Dec;
  /** 0 when nothing is held. */
  averageCost: Dec;
  realizedPnl: Dec;
  feesPaid: Dec;
};

/** What one trade did to its asset's position. Fields that do not apply to its side are 0. */
export type TradeEffect = {
  tradeId: string;
  symbol: AssetSymbol;
  side: Side;
  grossValue: Dec;
  /** BUY: gross value + fee. */
  costAdded: Dec;
  /** SELL: gross value − fee. */
  netProceeds: Dec;
  /** SELL: average cost before the sale × quantity sold. */
  costRemoved: Dec;
  /** SELL: net proceeds − cost removed. */
  realizedPnl: Dec;
  quantityAfter: Dec;
  costBasisAfter: Dec;
  averageCostAfter: Dec;
};

export type Ledger = { positions: Position[]; effects: TradeEffect[] };

export class InsufficientQuantityError extends Error {
  constructor(
    readonly trade: Trade,
    readonly held: Dec,
  ) {
    super(
      `${trade.tradeId}: SELL of ${trade.quantity.toString()} ${trade.symbol} exceeds the ${held.toString()} held`,
    );
    this.name = 'InsufficientQuantityError';
  }
}

/** Ascending timestamp; trade_id breaks ties so the result never depends on file order. */
export function sortTrades(trades: readonly Trade[]): Trade[] {
  return [...trades].sort(
    (a, b) => a.time - b.time || (a.tradeId < b.tradeId ? -1 : a.tradeId > b.tradeId ? 1 : 0),
  );
}

type State = Omit<Position, 'symbol'> & {
  /** The ratio set by the last BUY; divide after multiplying by the quantity sold. */
  averageBasis: Dec;
  averageQuantity: Dec;
};

const emptyState = (): State => ({
  quantity: ZERO,
  costBasis: ZERO,
  averageCost: ZERO,
  realizedPnl: ZERO,
  feesPaid: ZERO,
  averageBasis: ZERO,
  averageQuantity: ZERO,
});

export function buildLedger(trades: readonly Trade[]): Ledger {
  const states = new Map<AssetSymbol, State>();
  const effects = sortTrades(trades).map((trade) => {
    const state = states.get(trade.symbol) ?? emptyState();
    states.set(trade.symbol, state);
    return applyTrade(state, trade);
  });

  const positions = SYMBOLS.flatMap((symbol) => {
    const state = states.get(symbol);
    if (!state) return [];
    const { quantity, costBasis, averageCost, realizedPnl, feesPaid } = state;
    return [{ symbol, quantity, costBasis, averageCost, realizedPnl, feesPaid }];
  });
  return { positions, effects };
}

/**
 * Weighted-average rules of the brief. A BUY capitalizes its fee and sets the average; a SELL
 * realizes net proceeds minus average cost and keeps the stored average as it is (recomputing it
 * from what remains would change its last digit). Selling everything held removes the whole
 * remaining cost basis, not average × quantity (the average is a rounded division and could
 * leave a residue), so a closed position is exactly zero before the next BUY. Partial sales
 * use the stored cost/quantity ratio with division last, avoiding an extra rounding of average ×
 * sold quantity. Exact additions and subtractions preserve the cash-flow identity on every trade.
 */
function applyTrade(state: State, trade: Trade): TradeEffect {
  const grossValue = multiplyExact(trade.quantity, trade.priceUsd);
  let costAdded = ZERO;
  let netProceeds = ZERO;
  let costRemoved = ZERO;
  let realizedPnl = ZERO;

  if (trade.side === 'BUY') {
    costAdded = addExact(grossValue, trade.feeUsd);
    state.quantity = addExact(state.quantity, trade.quantity);
    state.costBasis = addExact(state.costBasis, costAdded);
    state.averageBasis = state.costBasis;
    state.averageQuantity = state.quantity;
    state.averageCost = state.averageBasis.dividedBy(state.averageQuantity);
  } else {
    // Validation rejects short sales; this only guards the invariant.
    if (trade.quantity.greaterThan(state.quantity)) {
      throw new InsufficientQuantityError(trade, state.quantity);
    }
    const closes = trade.quantity.equals(state.quantity);
    netProceeds = subtractExact(grossValue, trade.feeUsd);
    costRemoved = closes
      ? state.costBasis
      : multiplyExact(state.averageBasis, trade.quantity).dividedBy(state.averageQuantity);
    realizedPnl = subtractExact(netProceeds, costRemoved);
    state.quantity = closes ? ZERO : subtractExact(state.quantity, trade.quantity);
    state.costBasis = closes ? ZERO : subtractExact(state.costBasis, costRemoved);
    if (closes) {
      state.averageCost = state.averageBasis = state.averageQuantity = ZERO;
    }
    state.realizedPnl = addExact(state.realizedPnl, realizedPnl);
  }
  state.feesPaid = addExact(state.feesPaid, trade.feeUsd);

  return {
    tradeId: trade.tradeId,
    symbol: trade.symbol,
    side: trade.side,
    grossValue,
    costAdded,
    netProceeds,
    costRemoved,
    realizedPnl,
    quantityAfter: state.quantity,
    costBasisAfter: state.costBasis,
    averageCostAfter: state.averageCost,
  };
}
