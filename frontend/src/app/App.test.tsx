import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { portfolio, transactions } from '@/test/fixtures';
import { ok, renderApp } from '@/test/render';

describe('App', () => {
  it('shows the headline figures, holdings and transactions', async () => {
    renderApp({
      'GET /api/portfolio': ok(portfolio()),
      'GET /api/transactions': ok(transactions),
    });

    const summary = await screen.findByRole('list', { name: 'Portfolio summary' });
    expect(within(summary).getByText('$400.00')).toBeTruthy();
    expect(within(summary).getByText('$352.00')).toBeTruthy();
    expect(within(summary).getByText('+$97.00')).toBeTruthy();
    expect(within(summary).getByText('+13.64%')).toBeTruthy();
    // Every card says what its figure covers.
    expect(within(summary).getByText('Open positions at snapshot prices')).toBeTruthy();
    expect(within(summary).getByText('From sells, after fees')).toBeTruthy();
    expect(screen.getByText('2026-03-31 23:59:59 UTC')).toBeTruthy();

    const holdings = screen.getByRole('table', { name: /One row per asset/ });
    const eth = within(holdings).getByRole('row', { name: /^ETH/ });
    // Loss shown with a minus sign and a down arrow, not only in red.
    expect(within(eth).getByText('-$50.00').closest('.pnl')?.textContent).toBe('▼-$50.00');
    // ETH: realized +49, total −1, allocation 25%, unrealized return −33.33%.
    expect(within(eth).getByText('+$49.00')).toBeTruthy();
    expect(within(eth).getByText('-$1.00')).toBeTruthy();
    expect(within(eth).getByText('25.00%')).toBeTruthy();
    // The return under it is secondary: sign and colour, no second arrow.
    expect(within(eth).getByText('-33.33%').textContent).toBe('-33.33%');
    // The footer repeats the summary, so table and headline figures reconcile.
    const footer = within(holdings).getByRole('row', { name: /^Total/ });
    expect(within(footer).getByText('$400.00')).toBeTruthy();
    expect(within(footer).getByText('+$97.00')).toBeTruthy();

    expect(await screen.findByText('T3')).toBeTruthy();
    const totals = screen.getByRole('group', { name: 'Totals for the current filters' });
    expect(within(totals).getByText('$200.00')).toBeTruthy();
    expect(within(totals).getByText('$1.00')).toBeTruthy();
  });

  it('explains a failure to load and retries', async () => {
    let attempts = 0;
    renderApp({
      'GET /api/portfolio': () => {
        attempts += 1;
        return attempts <= 2
          ? Response.json(
              { code: 'internal_error', message: 'Unexpected server error.' },
              { status: 500 },
            )
          : Response.json(portfolio());
      },
      'GET /api/transactions': ok(transactions),
    });

    expect(
      await screen.findByText('The portfolio could not be loaded.', {}, { timeout: 3000 }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('list', { name: 'Portfolio summary' })).toBeTruthy();
  });

  it('guides the user when there are no trades', async () => {
    renderApp({
      'GET /api/portfolio': ok(
        portfolio({
          dataset: {
            source: 'none',
            fileName: null,
            loadedAt: '2026-09-24T00:00:00Z',
            tradeCount: 0,
            warnings: ['No sample trades.csv on the server.'],
          },
          holdings: [],
        }),
      ),
    });
    expect(await screen.findByText('No trades yet')).toBeTruthy();
    expect(screen.getByText('No sample trades.csv on the server.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Import trades.csv' })).toBeTruthy();
  });

  it('warns about holdings without a price', async () => {
    const data = portfolio();
    data.summary.unpricedSymbols = ['ETH'];
    renderApp({ 'GET /api/portfolio': ok(data), 'GET /api/transactions': ok(transactions) });
    expect(await screen.findByText('Some holdings have no price.')).toBeTruthy();
    expect(screen.getByText('Excludes ETH (no price)')).toBeTruthy();
  });

  it('says so when every position is closed', async () => {
    const data = portfolio();
    data.holdings = data.holdings.map((h) => ({ ...h, status: 'closed' as const }));
    renderApp({ 'GET /api/portfolio': ok(data), 'GET /api/transactions': ok(transactions) });
    expect(await screen.findByText('Every position is closed.')).toBeTruthy();
  });
});
