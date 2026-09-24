import { render } from '@testing-library/react';
import { vi } from 'vitest';

import { App } from '@/app/App';
import { Providers } from '@/app/Providers';

import { fakeFetch } from './fixtures';

/** Renders the whole app against a fake API; returns the recorded requests. */
export function renderApp(routes: Parameters<typeof fakeFetch>[0]) {
  const fake = fakeFetch(routes);
  vi.stubGlobal('fetch', vi.fn(fake.fetch));
  render(
    <Providers>
      <App />
    </Providers>,
  );
  return fake;
}

export const ok = (body: unknown) => () => Response.json(body);
