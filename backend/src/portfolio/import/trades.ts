import { sortTrades } from '../calculation/ledger.js';
import { type Dec, ZERO } from '../decimal.js';
import {
  type AssetSymbol,
  EXCHANGES,
  type ParseResult,
  SIDES,
  SYMBOLS,
  type Trade,
  type ValidationIssue,
} from '../model.js';
import { readCsv } from './csv.js';
import { FirstSeen, RowReader } from './row-reader.js';

const TRADE_COLUMNS = [
  'trade_id',
  'timestamp',
  'exchange',
  'symbol',
  'side',
  'quantity',
  'price_usd',
  'fee_usd',
] as const;

/**
 * All-or-nothing: either every row is valid and all trades are returned, or every problem is
 * listed and nothing is returned. Holdings (no short sale) are checked only once every row is
 * valid: a broken row makes the quantity held at that time unknown.
 */
export function parseTrades(text: string): ParseResult<Trade[]> {
  const { rows, issues } = readCsv(text, TRADE_COLUMNS);
  if (!rows) return { ok: false, issues };

  const trades: Trade[] = [];
  const ids = new FirstSeen();
  for (const { line, cells } of rows) {
    const row = new RowReader(line, cells);
    const tradeId = row.text('trade_id');
    const time = row.timestamp('timestamp');
    const exchange = row.choice('exchange', EXCHANGES);
    const symbol = row.choice('symbol', SYMBOLS);
    const side = row.choice('side', SIDES);
    const quantity = row.amount('quantity', 'positive');
    const priceUsd = row.amount('price_usd', 'positive');
    const feeUsd = row.amount('fee_usd', 'non-negative');
    const firstLine = tradeId === null ? undefined : ids.before(tradeId, line);
    if (firstLine !== undefined) {
      row.fail(
        'trade_id',
        'duplicate_trade_id',
        `trade_id ${tradeId} is already used on line ${firstLine}.`,
      );
    }

    if (
      !row.ok ||
      tradeId === null ||
      time === null ||
      !exchange ||
      !symbol ||
      !side ||
      !quantity ||
      !priceUsd ||
      !feeUsd
    ) {
      issues.push(...row.issues);
      continue;
    }
    const timestamp = cells.timestamp as string;
    trades.push({
      tradeId,
      timestamp,
      time,
      exchange,
      symbol,
      side,
      quantity,
      priceUsd,
      feeUsd,
      line,
    });
  }

  if (issues.length === 0) issues.push(...shortSales(trades));
  return issues.length > 0 ? { ok: false, issues } : { ok: true, value: trades };
}

/** SELLs above the quantity held at that time, per asset across exchanges. */
function shortSales(trades: readonly Trade[]): ValidationIssue[] {
  const held = new Map<AssetSymbol, Dec>();
  const issues: ValidationIssue[] = [];
  for (const trade of sortTrades(trades)) {
    const current = held.get(trade.symbol) ?? ZERO;
    if (trade.side === 'BUY') {
      held.set(trade.symbol, current.plus(trade.quantity));
    } else if (trade.quantity.greaterThan(current)) {
      // Not applied, so later SELLs are judged against what was really held.
      issues.push({
        line: trade.line,
        column: 'quantity',
        code: 'insufficient_quantity',
        message:
          `Line ${trade.line}: SELL of ${trade.quantity.toString()} ${trade.symbol} (${trade.tradeId}, ${trade.timestamp}) ` +
          `exceeds the ${current.toString()} ${trade.symbol} held at that time. Short positions are not supported.`,
      });
    } else {
      held.set(trade.symbol, current.minus(trade.quantity));
    }
  }
  return issues;
}
