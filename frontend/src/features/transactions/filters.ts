import type { AssetSymbol, Exchange, Side } from '@/api/types';

export type Filters = {
  symbol: AssetSymbol | '';
  exchange: Exchange | '';
  side: Side | '';
  /** Part of a trade_id. */
  q: string;
  /** Inclusive UTC days, YYYY-MM-DD, or ''. */
  from: string;
  to: string;
  sort: 'asc' | 'desc';
  page: number;
  pageSize: number;
};

export const PAGE_SIZES = [10, 25, 50, 100] as const;

export const DEFAULT_FILTERS: Filters = {
  symbol: '',
  exchange: '',
  side: '',
  q: '',
  from: '',
  to: '',
  sort: 'desc',
  page: 1,
  pageSize: 25,
};

/** Query string for GET /api/transactions: empty filters are left out. */
export function toQuery(filters: Filters): URLSearchParams {
  const query = new URLSearchParams();
  for (const key of ['symbol', 'exchange', 'side', 'from', 'to'] as const) {
    if (filters[key]) query.set(key, filters[key]);
  }
  const q = filters.q.trim();
  if (q) query.set('q', q);
  query.set('sort', filters.sort);
  query.set('page', String(filters.page));
  query.set('pageSize', String(filters.pageSize));
  return query;
}

/** Client-side check so an impossible range is explained before any request. */
export function rangeError(filters: Pick<Filters, 'from' | 'to'>): string | null {
  return filters.from && filters.to && filters.from > filters.to
    ? 'The start date must be on or before the end date.'
    : null;
}

export function isFiltered(filters: Filters): boolean {
  return Boolean(
    filters.symbol ||
      filters.exchange ||
      filters.side ||
      filters.q.trim() ||
      filters.from ||
      filters.to,
  );
}
