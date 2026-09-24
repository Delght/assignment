import type { PortfolioResponse, PortfolioSummary } from '@/api/types';
import { AllocationChart } from '@/features/charts/AllocationChart';
import { PnlChart } from '@/features/charts/PnlChart';
import { DatasetBar } from '@/features/dataset/DatasetBar';
import { Holdings } from '@/features/holdings/Holdings';
import { SummaryCards } from '@/features/overview/SummaryCards';
import { TransactionExplorer } from '@/features/transactions/TransactionExplorer';
import { Alert } from '@/shared/Alert';
import { Section } from '@/shared/Section';

export function PortfolioView({ portfolio }: { portfolio: PortfolioResponse }) {
  const { dataset, summary, holdings } = portfolio;

  return (
    <>
      <DatasetBar dataset={dataset} pricesAsOf={summary.pricesAsOf} />
      {dataset.warnings.map((warning) => (
        <Alert key={warning} tone="warning">
          {warning}
        </Alert>
      ))}
      <UnpricedWarning summary={summary} />

      {dataset.tradeCount === 0 ? (
        <div className="empty-state panel">
          <h2>No trades yet</h2>
          <p>Import a trades.csv file, or reset to the sample data, to see the portfolio.</p>
        </div>
      ) : (
        <>
          {holdings.every((h) => h.status === 'closed') ? (
            <Alert tone="info" title="Every position is closed.">
              Nothing is held right now, so current value and allocation are zero. Realized P&amp;L
              is still shown below.
            </Alert>
          ) : null}
          <SummaryCards summary={summary} />
          <div className="chart-grid">
            <Section id="allocation" title="Allocation by current value">
              <AllocationChart holdings={holdings} total={summary.currentValue} />
            </Section>
            <Section id="pnl" title="Realized and unrealized P&L by asset" fill>
              <PnlChart holdings={holdings} />
            </Section>
          </div>
          <Section id="holdings" title="Holdings">
            <Holdings holdings={holdings} summary={summary} />
          </Section>
          <Section id="transactions" title="Transactions">
            <TransactionExplorer />
          </Section>
        </>
      )}
    </>
  );
}

function UnpricedWarning({ summary }: { summary: PortfolioSummary }) {
  const symbols = summary.unpricedSymbols;
  if (symbols.length === 0) return null;
  const one = symbols.length === 1;
  return (
    <Alert tone="warning" title="Some holdings have no price.">
      {symbols.join(', ')} {one ? 'is' : 'are'} left out of current value, unrealized P&amp;L and
      allocation until prices.csv lists {one ? 'it' : 'them'}.
    </Alert>
  );
}
