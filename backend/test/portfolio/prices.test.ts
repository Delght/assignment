import { describe, expect, it } from 'vitest';

import { parsePrices, type ValidationIssue } from '../../src/portfolio/index.js';

const AS_OF = '2026-03-31T23:59:59Z';

describe('parsePrices', () => {
  const HEADER = 'as_of,symbol,price_usd';
  const issues = (csv: string): Pick<ValidationIssue, 'line' | 'code'>[] => {
    const result = parsePrices(csv);
    if (result.ok) throw new Error('expected rejection');
    return result.issues.map(({ line, code }) => ({ line, code }));
  };

  it('reads a snapshot exactly', () => {
    const result = parsePrices(`${HEADER}\n${AS_OF},CKB,0.00715000`);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value[0]?.priceUsd.toString()).toBe('0.00715');
    expect(result.value[0]?.asOf).toBe(AS_OF);
  });

  it('rejects duplicates, unsupported symbols, non-positive prices and bad times', () => {
    expect(
      issues(
        [
          HEADER,
          `${AS_OF},BTC,111500`,
          `${AS_OF},BTC,111600`,
          `${AS_OF},XRP,1`,
          `${AS_OF},ETH,0`,
          `yesterday,SOL,200`,
        ].join('\n'),
      ),
    ).toEqual([
      { line: 3, code: 'duplicate_symbol' },
      { line: 4, code: 'unsupported_symbol' },
      { line: 5, code: 'not_positive' },
      { line: 6, code: 'invalid_timestamp' },
    ]);
  });

  it('rejects a file without the required columns', () => {
    expect(issues('symbol,price_usd\nBTC,1')).toEqual([{ line: 1, code: 'missing_columns' }]);
  });
});
