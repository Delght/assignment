import type { DatasetInfo, PortfolioSummary } from '@/api/types';
import { utcDateTime } from '@/format/format';
import { Facts } from '@/shared/Facts';

function sourceLabel(dataset: DatasetInfo): string {
  if (dataset.source === 'sample') return 'Sample data';
  if (dataset.source === 'upload') return dataset.fileName ?? 'Imported file';
  return 'No data loaded';
}

function pricesLabel(pricesAsOf: PortfolioSummary['pricesAsOf']): string {
  if (pricesAsOf === null) return 'No prices';
  const { earliest, latest } = pricesAsOf;
  return earliest === latest
    ? utcDateTime(latest)
    : `${utcDateTime(earliest)} to ${utcDateTime(latest)}`;
}

export function DatasetFacts({
  dataset,
  pricesAsOf,
}: {
  dataset: DatasetInfo;
  pricesAsOf: PortfolioSummary['pricesAsOf'];
}) {
  return (
    <Facts
      items={[
        { label: 'Source', value: sourceLabel(dataset) },
        { label: 'Trades', value: dataset.tradeCount },
        { label: 'Prices as of', value: pricesLabel(pricesAsOf) },
      ]}
    />
  );
}
