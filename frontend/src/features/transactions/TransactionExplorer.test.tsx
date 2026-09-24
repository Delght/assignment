import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { portfolio, transactions } from '@/test/fixtures';
import { ok, renderApp } from '@/test/render';

describe('transaction explorer', () => {
  it('sends filters, sort and paging to the server', async () => {
    const fake = renderApp({
      'GET /api/portfolio': ok(portfolio()),
      'GET /api/transactions': (url) =>
        Response.json({
          ...transactions,
          total: 60,
          totalPages: 3,
          page: Number(url.searchParams.get('page')),
        }),
    });
    await screen.findByText('T3');
    const last = () =>
      fake.calls.filter((c) => c.url.pathname === '/api/transactions').at(-1)?.url.searchParams;

    fireEvent.change(screen.getByLabelText('Asset'), { target: { value: 'ETH' } });
    await waitFor(() => expect(last()?.get('symbol')).toBe('ETH'));

    fireEvent.click(screen.getByRole('button', { name: /Time \(UTC\)/ }));
    await waitFor(() => expect(last()?.get('sort')).toBe('asc'));

    fireEvent.click(await screen.findByRole('button', { name: 'Next' }));
    await waitFor(() => expect(last()?.get('page')).toBe('2'));

    // Changing a filter goes back to page 1.
    fireEvent.change(screen.getByLabelText('Side'), { target: { value: 'SELL' } });
    await waitFor(() => expect(last()?.get('side')).toBe('SELL'));
    expect(last()?.get('page')).toBe('1');
  });

  it('explains an impossible date range instead of querying', async () => {
    const fake = renderApp({
      'GET /api/portfolio': ok(portfolio()),
      'GET /api/transactions': ok(transactions),
    });
    await screen.findByText('T3');
    const before = fake.calls.length;

    fireEvent.change(screen.getByLabelText('From (UTC)'), { target: { value: '2025-12-01' } });
    fireEvent.change(screen.getByLabelText('To (UTC)'), { target: { value: '2025-11-01' } });

    expect(
      await screen.findByText('The start date must be on or before the end date.'),
    ).toBeTruthy();
    expect(
      fake.calls.slice(before).some((c) => c.url.searchParams.get('to') === '2025-11-01'),
    ).toBe(false);
  });
});
