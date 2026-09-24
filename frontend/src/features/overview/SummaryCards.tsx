import './cards.css';

import type { PortfolioSummary } from '@/api/types';
import { usd } from '@/format/format';
import { Pnl } from '@/shared/Pnl';

export function SummaryCards({ summary }: { summary: PortfolioSummary }) {
  const unpriced = summary.unpricedSymbols.length > 0;
  return (
    <ul className="cards" aria-label="Portfolio summary">
      <Card
        label="Current value"
        note={unpriced ? `Excludes ${summary.unpricedSymbols.join(', ')} (no price)` : undefined}
      >
        {usd(summary.currentValue)}
      </Card>
      <Card label="Cost basis" note="Open positions, fees included">
        {usd(summary.costBasis)}
      </Card>
      <Card label="Realized P&L">
        <Pnl value={summary.realizedPnl} />
      </Card>
      <Card
        label="Unrealized P&L"
        note={
          summary.unrealizedReturn !== null ? (
            <>
              <Pnl value={summary.unrealizedReturn} kind="percent" arrow={false} /> of cost basis
            </>
          ) : undefined
        }
      >
        <Pnl value={summary.unrealizedPnl} />
      </Card>
      <Card label="Total P&L" note="Realized and unrealized, after all fees">
        <Pnl value={summary.totalPnl} />
      </Card>
      <Card label="Total fees" note="All buys and sells">
        {usd(summary.totalFees)}
      </Card>
    </ul>
  );
}

function Card({
  label,
  note,
  children,
}: {
  label: string;
  note?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="card panel">
      <span className="card-label">{label}</span>
      <span className="card-value">{children}</span>
      {note ? <span className="card-note">{note}</span> : null}
    </li>
  );
}
