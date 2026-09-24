import { describe, expect, it } from 'vitest';

import { parseTrades, type ValidationIssue } from '../../src/portfolio/index.js';
import { TRADES_HEADER, tradesCsv } from './helpers.js';

const VALID = 'T1,2025-10-01T09:00:00Z,Binance,BTC,BUY,0.03141403,105507.74,3.31';

function issuesOf(csv: string): ValidationIssue[] {
  const result = parseTrades(csv);
  if (result.ok) throw new Error('expected the file to be rejected');
  return result.issues;
}

const summary = (issues: ValidationIssue[]) => issues.map(({ line, code }) => ({ line, code }));

describe('parseTrades: valid input', () => {
  it('keeps every value exactly as written', () => {
    const result = parseTrades(tradesCsv(VALID));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [trade] = result.value;
    expect(trade).toMatchObject({
      tradeId: 'T1',
      timestamp: '2025-10-01T09:00:00Z',
      time: Date.UTC(2025, 9, 1, 9),
      exchange: 'Binance',
      symbol: 'BTC',
      side: 'BUY',
      line: 2,
    });
    expect(trade?.quantity.toString()).toBe('0.03141403');
    expect(trade?.priceUsd.toString()).toBe('105507.74');
    expect(trade?.feeUsd.toString()).toBe('3.31');
  });

  it('accepts a header-only file as an empty portfolio', () => {
    expect(parseTrades(TRADES_HEADER)).toEqual({ ok: true, value: [] });
  });

  it('accepts a zero fee and extra columns', () => {
    const result = parseTrades(
      `${TRADES_HEADER},note\nT1,2025-10-01T09:00:00Z,Coinbase,ETH,BUY,1,3000,0,hello`,
    );
    expect(result.ok).toBe(true);
  });

  it('reads CRLF, mixed line endings, a BOM and blank lines, keeping real line numbers', () => {
    const csv = `﻿${TRADES_HEADER}\r\n${VALID}\r\n\r\nT2,2025-10-02T09:00:00Z,Binance,BTC,BUY,1,100,0\nT3,2025-10-03T09:00:00Z,Binance,BTC,BUY,1,100,0\n`;
    const result = parseTrades(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.map((t) => [t.tradeId, t.line])).toEqual([
      ['T1', 2],
      ['T2', 4],
      ['T3', 5],
    ]);
  });

  it('checks holdings per asset across exchanges', () => {
    // Bought on Binance, sold on Coinbase: one BTC position, never short.
    const result = parseTrades(
      tradesCsv(
        'T1,2025-10-01T00:00:00Z,Binance,BTC,BUY,1,100,0',
        'T2,2025-10-02T00:00:00Z,Coinbase,BTC,SELL,1,120,0',
      ),
    );
    expect(result.ok).toBe(true);
  });
});

describe('parseTrades: rejected files', () => {
  it('rejects an empty file', () => {
    expect(summary(issuesOf(''))).toEqual([{ line: null, code: 'empty_file' }]);
  });

  it('names every missing column', () => {
    const issues = issuesOf('trade_id,timestamp,exchange,symbol,side,quantity\nT1,x,y,z,w,1');
    expect(summary(issues)).toEqual([{ line: 1, code: 'missing_columns' }]);
    expect(issues[0]?.message).toContain('price_usd, fee_usd');
  });

  it('rejects a duplicate trade_id and points at the first use', () => {
    const issues = issuesOf(tradesCsv(VALID, VALID.replace('BUY,0.03141403', 'BUY,1')));
    expect(summary(issues)).toEqual([{ line: 3, code: 'duplicate_trade_id' }]);
    expect(issues[0]?.message).toBe('Line 3: trade_id T1 is already used on line 2.');
  });

  it.each([
    ['impossible date', '2025-02-30T09:00:00Z'],
    ['no time zone', '2025-10-01T09:00:00'],
    ['non-UTC offset', '2025-10-01T09:00:00+07:00'],
    ['space separator', '2025-10-01 09:00:00Z'],
    ['not a date', 'yesterday'],
  ])('rejects a timestamp with %s', (_, timestamp) => {
    const issues = issuesOf(tradesCsv(`T1,${timestamp},Binance,BTC,BUY,1,100,0`));
    expect(summary(issues)).toEqual([{ line: 2, code: 'invalid_timestamp' }]);
  });

  it.each([
    ['exchange', 'T1,2025-10-01T09:00:00Z,Kraken,BTC,BUY,1,100,0', 'unsupported_exchange'],
    ['symbol', 'T1,2025-10-01T09:00:00Z,Binance,XRP,BUY,1,100,0', 'unsupported_symbol'],
    ['lower-case symbol', 'T1,2025-10-01T09:00:00Z,Binance,btc,BUY,1,100,0', 'unsupported_symbol'],
    ['side', 'T1,2025-10-01T09:00:00Z,Binance,BTC,HOLD,1,100,0', 'unsupported_side'],
  ])('rejects an unsupported %s', (_, row, code) => {
    expect(summary(issuesOf(tradesCsv(row)))).toEqual([{ line: 2, code }]);
  });

  it.each([
    [
      'zero quantity',
      'T1,2025-10-01T09:00:00Z,Binance,BTC,BUY,0,100,0',
      'quantity',
      'not_positive',
    ],
    [
      'negative price',
      'T1,2025-10-01T09:00:00Z,Binance,BTC,BUY,1,-5,0',
      'price_usd',
      'not_positive',
    ],
    ['negative fee', 'T1,2025-10-01T09:00:00Z,Binance,BTC,BUY,1,100,-0.5', 'fee_usd', 'negative'],
    ['exponent', 'T1,2025-10-01T09:00:00Z,Binance,BTC,BUY,1e3,100,0', 'quantity', 'invalid_number'],
    [
      'thousands separator',
      'T1,2025-10-01T09:00:00Z,Binance,BTC,BUY,"1,000",100,0',
      'quantity',
      'invalid_number',
    ],
    ['empty value', 'T1,2025-10-01T09:00:00Z,Binance,BTC,BUY,1,100,', 'fee_usd', 'missing_value'],
  ])('rejects %s', (_, row, column, code) => {
    expect(issuesOf(tradesCsv(row))).toMatchObject([{ line: 2, column, code }]);
  });

  it('rejects a row with the wrong number of values', () => {
    const issues = issuesOf(tradesCsv('T1,2025-10-01T09:00:00Z,Binance,BTC,BUY,1,100'));
    expect(summary(issues)).toEqual([{ line: 2, code: 'column_count' }]);
    expect(issues[0]?.message).toBe('Line 2 has 7 values; the header has 8.');
  });

  it('rejects malformed CSV', () => {
    const issues = issuesOf(tradesCsv('T1,"2025-10-01T09:00:00Z,Binance,BTC,BUY,1,100,0'));
    expect(summary(issues)).toEqual([{ line: 2, code: 'malformed_csv' }]);
  });

  it('lists every problem in the file at once, in line order', () => {
    const issues = issuesOf(
      tradesCsv(
        VALID,
        'T2,2025-13-01T09:00:00Z,Binance,BTC,BUY,1,100,0',
        'T3,2025-10-02T09:00:00Z,FTX,BTC,BUY,0,100,0',
        'T1,2025-10-03T09:00:00Z,Binance,BTC,BUY,1,100,0',
      ),
    );
    expect(summary(issues)).toEqual([
      { line: 3, code: 'invalid_timestamp' },
      { line: 4, code: 'unsupported_exchange' },
      { line: 4, code: 'not_positive' },
      { line: 5, code: 'duplicate_trade_id' },
    ]);
  });

  it('never returns part of a file: one bad row rejects all of them', () => {
    const result = parseTrades(tradesCsv(VALID, 'T2,2025-10-02T09:00:00Z,Binance,BTC,BUY,0,100,0'));
    expect(result).toEqual({ ok: false, issues: expect.any(Array) });
    expect('value' in result).toBe(false);
  });

  it('reports every short sale, judging later sells by what was really held', () => {
    const issues = issuesOf(
      tradesCsv(
        'T1,2025-10-01T00:00:00Z,Binance,SOL,BUY,10,200,0',
        'T2,2025-10-02T00:00:00Z,Binance,SOL,SELL,15,210,0',
        'T3,2025-10-03T00:00:00Z,Binance,SOL,SELL,10,220,0',
        'T4,2025-10-04T00:00:00Z,Binance,SOL,SELL,1,220,0',
      ),
    );
    // T2 is refused and not applied, so T3 closes the 10 held and T4 is short.
    expect(summary(issues)).toEqual([
      { line: 3, code: 'insufficient_quantity' },
      { line: 5, code: 'insufficient_quantity' },
    ]);
  });
});
