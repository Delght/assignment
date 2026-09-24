import './dataset.css';

import type { DatasetInfo, PortfolioSummary } from '@/api/types';

import { DatasetActions } from './DatasetActions';
import { DatasetFacts } from './DatasetFacts';

export function DatasetBar({
  dataset,
  pricesAsOf,
}: {
  dataset: DatasetInfo;
  pricesAsOf: PortfolioSummary['pricesAsOf'];
}) {
  return (
    <div className="dataset panel">
      <DatasetFacts dataset={dataset} pricesAsOf={pricesAsOf} />
      <DatasetActions />
    </div>
  );
}
