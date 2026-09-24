import { describe, expect, it } from 'vitest';

import {
  percent,
  quantity,
  signedPercent,
  signedUsd,
  trendOf,
  unitPrice,
  usd,
  utcCompact,
  utcDateTime,
} from './format';

describe('usd', () => {
  it.each([
    ['60620.89161', '$60,620.89'],
    ['2.675', '$2.68'], // half-even on the exact decimal; via a float this would be $2.67
    ['2.665', '$2.66'],
    ['-4401.3084972465', '-$4,401.31'],
    ['0', '$0.00'],
    ['12345678901234567890.125', '$12,345,678,901,234,567,890.12'], // beyond float precision
  ])('%s → %s', (input, output) => {
    expect(usd(input)).toBe(output);
  });
});

describe('signedUsd', () => {
  it.each([
    ['98', '+$98.00'],
    ['-50', '-$50.00'],
    ['-0.004', '$0.00'], // rounds to zero: no sign
    ['0', '$0.00'],
  ])('%s → %s', (input, output) => {
    expect(signedUsd(input)).toBe(output);
  });
});

describe('unitPrice', () => {
  it.each([
    ['117711.8999010621', '$117,711.90'],
    ['0.00715', '$0.00715'],
    ['0.006873362196534169', '$0.00687336'],
    ['0.2', '$0.20'],
  ])('%s → %s', (input, output) => {
    expect(unitPrice(input)).toBe(output);
  });
});

describe('quantity', () => {
  it.each([
    ['0.0774292', '0.0774292'],
    ['1947047', '1,947,047'],
    ['0.123456789', '0.12345679'],
  ])('%s → %s', (input, output) => {
    expect(quantity(input)).toBe(output);
  });
});

describe('percent', () => {
  it('formats a ratio', () => {
    expect(percent('0.1424155200')).toBe('14.24%');
    expect(percent('1')).toBe('100.00%');
    expect(signedPercent('0.01086647452497423243')).toBe('+1.09%');
    expect(signedPercent('-0.333333')).toBe('-33.33%');
  });
});

describe('trendOf', () => {
  it('follows the displayed value, so $0.00 is flat', () => {
    expect(trendOf('98')).toBe('up');
    expect(trendOf('-50')).toBe('down');
    expect(trendOf('-0.004')).toBe('flat');
    expect(trendOf('0.00004', signedPercent)).toBe('flat');
  });
});

describe('utcDateTime', () => {
  it('shows the instant in UTC, as stored', () => {
    expect(utcDateTime('2025-10-01T09:00:00Z')).toBe('2025-10-01 09:00:00 UTC');
    expect(utcDateTime('2026-03-31T23:59:59.500Z')).toBe('2026-03-31 23:59:59 UTC');
  });
});

describe('utcCompact', () => {
  it('drops the zone and zero seconds for columns headed UTC', () => {
    expect(utcCompact('2025-10-01T09:00:00Z')).toBe('2025-10-01 09:00');
    expect(utcCompact('2025-10-01T09:00:30Z')).toBe('2025-10-01 09:00:30');
  });
});
