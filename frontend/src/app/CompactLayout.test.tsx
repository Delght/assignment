import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { portfolio, transactions } from '@/test/fixtures';
import { ok, renderApp } from '@/test/render';

describe('on a phone', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(max-width: 40rem)',
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
  });

  it('lists holdings instead of a wide table, with every column one tap away', async () => {
    renderApp({ 'GET /api/portfolio': ok(portfolio()), 'GET /api/transactions': ok(transactions) });

    const holdings = await screen.findByRole('list', { name: 'Holdings' });
    expect(screen.queryByRole('table', { name: /One row per asset/ })).toBeNull();

    const eth = within(holdings).getByText('ETH').closest('details') as HTMLElement;
    const summary = eth.querySelector('summary') as HTMLElement;
    // At a glance: value, total P&L and share of the portfolio, named once above the list.
    expect(within(summary).getByText('$100.00')).toBeTruthy();
    expect(within(summary).getByText('-$1.00')).toBeTruthy();
    expect(within(summary).getByText('25.00%')).toBeTruthy();
    // Each figure is named for screen readers too, not only by the visual head.
    expect(summary.textContent).toContain('Allocation: 25.00%');
    expect(summary.textContent).toContain('Current value: $100.00');
    expect(summary.textContent).toMatch(/Total P&L: \S*-\$1\.00/);
    const head = holdings.previousElementSibling as HTMLElement;
    expect(within(head).getByText('Allocation')).toBeTruthy();
    // On tap: the remaining columns.
    const details = eth.querySelector('dl') as HTMLElement;
    expect(within(details).getByText('Realized P&L').nextElementSibling?.textContent).toBe(
      '▲+$49.00',
    );
    expect(within(details).getByText('Average cost').nextElementSibling?.textContent).toBe(
      '$30.00',
    );
  });

  it('lists transactions, with a sort switch in place of the column header', async () => {
    const fake = renderApp({
      'GET /api/portfolio': ok(portfolio()),
      'GET /api/transactions': ok(transactions),
    });

    const list = await screen.findByRole('list', { name: 'Transactions' });
    const sale = within(list).getByText('ETH').closest('details') as HTMLElement;
    const summary = sale.querySelector('summary') as HTMLElement;
    expect(within(summary).getByText('$200.00')).toBeTruthy();
    // The head names the columns once; each row still reads fully to a screen reader.
    const head = list.previousElementSibling as HTMLElement;
    expect(within(head).getByText('Gross value')).toBeTruthy();
    expect(summary.textContent).toContain('Time (UTC): 2025-10-02 00:00');
    expect(summary.textContent).toContain('Gross value: $200.00');
    expect(summary.textContent).toMatch(/Realized P&L: \S*\+\$49\.00/);
    expect(within(sale.querySelector('dl') as HTMLElement).getByText('T3')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Sorted newest first/ }));
    await waitFor(() =>
      expect(
        fake.calls
          .filter((c) => c.url.pathname === '/api/transactions')
          .at(-1)
          ?.url.searchParams.get('sort'),
      ).toBe('asc'),
    );
  });
});
