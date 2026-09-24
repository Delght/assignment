import { type ParseResult, type PriceQuote, SYMBOLS } from '../model.js';
import { readCsv } from './csv.js';
import { FirstSeen, RowReader } from './row-reader.js';

const PRICE_COLUMNS = ['as_of', 'symbol', 'price_usd'] as const;

/** One positive USD price per supported symbol; a symbol may be absent (its holding is unpriced). */
export function parsePrices(text: string): ParseResult<PriceQuote[]> {
  const { rows, issues } = readCsv(text, PRICE_COLUMNS);
  if (!rows) return { ok: false, issues };

  const quotes: PriceQuote[] = [];
  const symbols = new FirstSeen();
  for (const { line, cells } of rows) {
    const row = new RowReader(line, cells);
    const asOf = row.timestamp('as_of') === null ? null : (cells.as_of as string);
    const symbol = row.choice('symbol', SYMBOLS);
    const priceUsd = row.amount('price_usd', 'positive');
    const firstLine = symbol === null ? undefined : symbols.before(symbol, line);
    if (firstLine !== undefined) {
      row.fail('symbol', 'duplicate_symbol', `${symbol} already has a price on line ${firstLine}.`);
    }

    if (!row.ok || asOf === null || !symbol || !priceUsd) {
      issues.push(...row.issues);
      continue;
    }
    quotes.push({ symbol, priceUsd, asOf });
  }
  return issues.length > 0 ? { ok: false, issues } : { ok: true, value: quotes };
}
