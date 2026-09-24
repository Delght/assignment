import { type Dec, ZERO } from '../decimal.js';
import { type AssetSymbol, type Side, SYMBOLS, type Trade } from '../model.js';

export type Position = {
  symbol: AssetSymbol;
  quantity: Dec;
  costBasis: Dec;
  /** 0 when nothing is held. */
  averageCost: Dec;
  realizedPnl: Dec;
  feesPaid: Dec;
  tradeCount: number;
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

type State = Omit<Position, 'symbol' | 'averageCost'>;

const emptyState = (): State => ({
  quantity: ZERO,
  costBasis: ZERO,
  realizedPnl: ZERO,
  feesPaid: ZERO,
  tradeCount: 0,
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
    return state ? [{ symbol, ...state, averageCost: averageOf(state) }] : [];
  });
  return { positions, effects };
}

/**
 * Weighted-average rules of the brief. A BUY capitalizes its fee; a SELL realizes net proceeds
 * minus average cost and leaves the average unchanged. Selling everything held removes the whole
 * remaining cost basis, not average × quantity (the average is a rounded division and could
 * leave a residue), so a closed position is exactly zero before the next BUY.
 */
function applyTrade(state: State, trade: Trade): TradeEffect {
  const grossValue = trade.quantity.times(trade.priceUsd);
  let costAdded = ZERO;
  let netProceeds = ZERO;
  let costRemoved = ZERO;
  let realizedPnl = ZERO;

  if (trade.side === 'BUY') {
    costAdded = grossValue.plus(trade.feeUsd);
    state.quantity = state.quantity.plus(trade.quantity);
    state.costBasis = state.costBasis.plus(costAdded);
  } else {
    // Validation rejects short sales; this only guards the invariant.
    if (trade.quantity.greaterThan(state.quantity)) {
      throw new InsufficientQuantityError(trade, state.quantity);
    }
    const closes = trade.quantity.equals(state.quantity);
    netProceeds = grossValue.minus(trade.feeUsd);
    costRemoved = closes ? state.costBasis : averageOf(state).times(trade.quantity);
    realizedPnl = netProceeds.minus(costRemoved);
    state.quantity = closes ? ZERO : state.quantity.minus(trade.quantity);
    state.costBasis = closes ? ZERO : state.costBasis.minus(costRemoved);
    state.realizedPnl = state.realizedPnl.plus(realizedPnl);
  }
  state.feesPaid = state.feesPaid.plus(trade.feeUsd);
  state.tradeCount += 1;

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
    averageCostAfter: averageOf(state),
  };
}

function averageOf({ quantity, costBasis }: Pick<State, 'quantity' | 'costBasis'>): Dec {
  return quantity.isZero() ? ZERO : costBasis.dividedBy(quantity);
}
