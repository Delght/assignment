import { type Dec, parseTrades, sumOf, type Trade } from '../../src/portfolio/index.js';

export const TRADES_HEADER = 'trade_id,timestamp,exchange,symbol,side,quantity,price_usd,fee_usd';

export function tradesCsv(...rows: string[]): string {
  return [TRADES_HEADER, ...rows].join('\n');
}

/** Parses rows that the test expects to be valid, failing loudly with the issues otherwise. */
export function trades(...rows: string[]): Trade[] {
  const result = parseTrades(tradesCsv(...rows));
  if (!result.ok) throw new Error(`expected valid trades: ${JSON.stringify(result.issues)}`);
  return result.value;
}

/** Exact decimal comparison as text, so 175 and 175.0000001 never pass as equal. */
export function text(value: Dec | null): string | null {
  return value === null ? null : value.toString();
}

/**
 * Total P&L from cash flows alone: what is held now + what sales brought in (after fees) − what
 * purchases cost (with fees). It does not depend on the cost method, so it checks the ledger
 * from outside: fees must be counted exactly once and no cost may be lost or doubled.
 */
export function cashFlowPnl(all: readonly Trade[], currentValue: Dec): Dec {
  const gross = (t: Trade) => t.quantity.times(t.priceUsd);
  const received = sumOf(
    all.filter((t) => t.side === 'SELL'),
    (t) => gross(t).minus(t.feeUsd),
  );
  const paid = sumOf(
    all.filter((t) => t.side === 'BUY'),
    (t) => gross(t).plus(t.feeUsd),
  );
  return currentValue.plus(received).minus(paid);
}
