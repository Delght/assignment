import { useEffect, useState } from 'react';

import { DEFAULT_FILTERS, type Filters } from './filters';

const SEARCH_DELAY_MS = 300;

/** Filter state; the trade ID search applies once typing pauses, and filters reset the page. */
export function useTransactionFilters() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(
      () => setFilters((f) => (f.q === search ? f : { ...f, q: search, page: 1 })),
      SEARCH_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [search]);

  return {
    filters,
    search,
    setSearch,
    update: (change: Partial<Filters>) => setFilters((f) => ({ ...f, page: 1, ...change })),
    goToPage: (page: number) => setFilters((f) => ({ ...f, page })),
    clear: () => {
      setSearch('');
      setFilters((f) => ({ ...DEFAULT_FILTERS, sort: f.sort, pageSize: f.pageSize }));
    },
  };
}
