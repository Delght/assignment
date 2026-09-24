import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { portfolio, transactions } from '@/test/fixtures';
import { ok, renderApp } from '@/test/render';

describe('importing trades', () => {
  const file = (content: string, name = 'trades.csv') =>
    new File([content], name, { type: 'text/csv' });
  const choose = (input: HTMLInputElement, chosen: File) =>
    fireEvent.change(input, { target: { files: [chosen] } });

  it('lists every problem by line when the server rejects the file', async () => {
    renderApp({
      'GET /api/portfolio': ok(portfolio()),
      'GET /api/transactions': ok(transactions),
      'POST /api/import': () =>
        Response.json(
          {
            code: 'invalid_file',
            message: 'The file was not imported: 2 problems found. Nothing was changed.',
            issues: [
              {
                line: 3,
                column: 'trade_id',
                code: 'duplicate_trade_id',
                message: 'Line 3: trade_id T1 is already used on line 2.',
              },
              {
                line: 4,
                column: 'quantity',
                code: 'insufficient_quantity',
                message: 'Line 4: SELL of 2 BTC exceeds the 1 BTC held.',
              },
            ],
          },
          { status: 422 },
        ),
    });
    await screen.findByRole('list', { name: 'Portfolio summary' });
    choose(document.querySelector('input[type=file]') as HTMLInputElement, file('bad'));

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText(/Nothing was changed/)).toBeTruthy();
    expect(within(alert).getByText('Line 3').parentElement?.textContent).toBe(
      'Line 3trade_id T1 is already used on line 2.',
    );
    expect(within(alert).getByText('Line 4')).toBeTruthy();
  });

  it('sends the file as text/csv with its name, then reloads the portfolio', async () => {
    const fake = renderApp({
      'GET /api/portfolio': ok(portfolio()),
      'GET /api/transactions': ok(transactions),
      'POST /api/import': ok({
        dataset: {
          source: 'upload',
          fileName: 'my trades.csv',
          loadedAt: 'x',
          tradeCount: 7,
          warnings: [],
        },
      }),
    });
    await screen.findByRole('list', { name: 'Portfolio summary' });
    choose(
      document.querySelector('input[type=file]') as HTMLInputElement,
      file('csv', 'my trades.csv'),
    );

    expect(await screen.findByText('Trades imported.')).toBeTruthy();
    const upload = fake.calls.find((call) => call.init?.method === 'POST');
    expect(new Headers(upload?.init?.headers).get('content-type')).toBe('text/csv');
    expect(new Headers(upload?.init?.headers).get('x-file-name')).toBe('my%20trades.csv');
    await waitFor(() =>
      expect(
        fake.calls.filter((call) => call.url.pathname === '/api/portfolio').length,
      ).toBeGreaterThan(1),
    );
  });

  it('starts the transaction list again from page 1 once another file is imported', async () => {
    let loadedAt = '2026-09-24T00:00:00Z';
    const dataset = () => ({ ...portfolio().dataset, loadedAt });
    const fake = renderApp({
      'GET /api/portfolio': () => Response.json(portfolio({ dataset: dataset() })),
      'GET /api/transactions': (url) =>
        Response.json({
          ...transactions,
          page: Number(url.searchParams.get('page')),
          total: 60,
          totalPages: 3,
        }),
      'POST /api/import': () => {
        loadedAt = '2026-09-24T00:05:00Z';
        return Response.json({ dataset: dataset() });
      },
    });
    const lastPage = () =>
      fake.calls
        .filter((c) => c.url.pathname === '/api/transactions')
        .at(-1)
        ?.url.searchParams.get('page');

    fireEvent.click(await screen.findByRole('button', { name: 'Next' }));
    await waitFor(() => expect(lastPage()).toBe('2'));
    choose(document.querySelector('input[type=file]') as HTMLInputElement, file('csv'));
    await waitFor(() => expect(lastPage()).toBe('1'));
  });

  it('keeps the hidden file input out of the tab order and the accessibility tree', async () => {
    renderApp({
      'GET /api/portfolio': ok(portfolio()),
      'GET /api/transactions': ok(transactions),
    });
    await screen.findByRole('list', { name: 'Portfolio summary' });
    const input = document.querySelector('input[type=file]') as HTMLInputElement;
    // The visible button opens it; reaching it by Tab would be an unlabelled extra stop.
    expect(input.tabIndex).toBe(-1);
    expect(input.getAttribute('aria-hidden')).toBe('true');
  });

  it('refuses a file over 2 MB without uploading it', async () => {
    const fake = renderApp({
      'GET /api/portfolio': ok(portfolio()),
      'GET /api/transactions': ok(transactions),
    });
    await screen.findByRole('list', { name: 'Portfolio summary' });
    const big = file('x');
    Object.defineProperty(big, 'size', { value: 2 * 1024 * 1024 + 1 });
    choose(document.querySelector('input[type=file]') as HTMLInputElement, big);

    expect(await screen.findByText(/larger than 2 MB/)).toBeTruthy();
    expect(fake.calls.some((call) => call.init?.method === 'POST')).toBe(false);
  });
});
