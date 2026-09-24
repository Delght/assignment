import { describe, expect, it } from 'vitest';

import { DEFAULT_FILTERS, isFiltered, rangeError, toQuery } from './filters';

describe('toQuery', () => {
  it('sends only sort and paging by default', () => {
    expect(toQuery(DEFAULT_FILTERS).toString()).toBe('sort=desc&page=1&pageSize=25');
  });

  it('sends every filter that is set, trimming the search', () => {
    const query = toQuery({
      ...DEFAULT_FILTERS,
      symbol: 'ETH',
      exchange: 'Binance',
      side: 'SELL',
      q: '  TRD-004 ',
      from: '2025-11-01',
      to: '2025-11-30',
      sort: 'asc',
      page: 2,
      pageSize: 10,
    });
    expect(Object.fromEntries(query)).toEqual({
      symbol: 'ETH',
      exchange: 'Binance',
      side: 'SELL',
      q: 'TRD-004',
      from: '2025-11-01',
      to: '2025-11-30',
      sort: 'asc',
      page: '2',
      pageSize: '10',
    });
  });
});

describe('rangeError', () => {
  it('flags a start after the end, and nothing else', () => {
    expect(rangeError({ from: '2025-12-01', to: '2025-11-01' })).toMatch(/on or before/);
    expect(rangeError({ from: '2025-11-01', to: '2025-11-01' })).toBeNull();
    expect(rangeError({ from: '2025-11-01', to: '' })).toBeNull();
  });
});

describe('isFiltered', () => {
  it('ignores sort, paging and blank search', () => {
    expect(isFiltered({ ...DEFAULT_FILTERS, sort: 'asc', page: 3, q: '  ' })).toBe(false);
    expect(isFiltered({ ...DEFAULT_FILTERS, side: 'BUY' })).toBe(true);
  });
});
