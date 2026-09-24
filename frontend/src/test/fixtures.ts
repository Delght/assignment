import type { Holding, PortfolioResponse, TransactionsResponse } from '@/api/types';

/**
 * The same book as the backend API tests: BTC 2 @ 100 + fee 2; ETH 10 @ 30, 5 sold @ 40 − 1;
 * prices BTC 150, ETH 20.
 */
export const btc: Holding = {
  symbol: 'BTC',
  status: 'open',
  quantity: '2',
  averageCost: '101',
  costBasis: '202',
  currentPrice: '150',
  priceAsOf: '2026-03-31T23:59:59Z',
  currentValue: '300',
  realizedPnl: '0',
  unrealizedPnl: '98',
  unrealizedReturn: '0.48514851485148514851',
  totalPnl: '98',
  allocation: '0.75',
  feesPaid: '2',
  tradeCount: 1,
};

export const eth: Holding = {
  symbol: 'ETH',
  status: 'open',
  quantity: '5',
  averageCost: '30',
  costBasis: '150',
  currentPrice: '20',
  priceAsOf: '2026-03-31T23:59:59Z',
  currentValue: '100',
  realizedPnl: '49',
  unrealizedPnl: '-50',
  unrealizedReturn: '-0.33333333333333333333',
  totalPnl: '-1',
  allocation: '0.25',
  feesPaid: '1',
  tradeCount: 2,
};

export function portfolio(overrides: Partial<PortfolioResponse> = {}): PortfolioResponse {
  return {
    dataset: {
      source: 'sample',
      fileName: null,
      loadedAt: '2026-09-24T00:00:00Z',
      tradeCount: 3,
      warnings: [],
    },
    summary: {
      currentValue: '400',
      costBasis: '352',
      realizedPnl: '49',
      unrealizedPnl: '48',
      unrealizedReturn: '0.13636363636363636364',
      totalPnl: '97',
      totalFees: '3',
      unpricedSymbols: [],
      pricesAsOf: { earliest: '2026-03-31T23:59:59Z', latest: '2026-03-31T23:59:59Z' },
    },
    holdings: [btc, eth],
    ...overrides,
  };
}

export const transactions: TransactionsResponse = {
  items: [
    {
      tradeId: 'T3',
      timestamp: '2025-10-02T00:00:00Z',
      exchange: 'Coinbase',
      symbol: 'ETH',
      side: 'SELL',
      quantity: '5',
      priceUsd: '40',
      feeUsd: '1',
      grossValue: '200',
      realizedPnl: '49',
    },
  ],
  page: 1,
  pageSize: 25,
  total: 1,
  totalPages: 1,
  totals: { grossValue: '200', fees: '1', realizedPnl: '49' },
};

type Route = (url: URL, init?: RequestInit) => Response | Promise<Response>;

/** A fetch stand-in routed by path; records every call for assertions. */
export function fakeFetch(routes: Record<string, Route>) {
  const calls: { url: URL; init?: RequestInit }[] = [];
  const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost');
    calls.push({ url, init });
    const route = routes[`${init?.method ?? 'GET'} ${url.pathname}`];
    return route
      ? route(url, init)
      : Response.json({ code: 'not_found', message: 'no route' }, { status: 404 });
  };
  return { fetch, calls };
}
