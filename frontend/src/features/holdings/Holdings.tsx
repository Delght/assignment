import type { Holding, PortfolioSummary } from '@/api/types';
import { useCompactLayout } from '@/shared/useMediaQuery';

import { HoldingsList } from './HoldingsList';
import { HoldingsTable } from './HoldingsTable';

export function Holdings({
  holdings,
  summary,
}: {
  holdings: Holding[];
  summary: PortfolioSummary;
}) {
  return useCompactLayout() ? (
    <HoldingsList holdings={holdings} />
  ) : (
    <HoldingsTable holdings={holdings} summary={summary} />
  );
}
