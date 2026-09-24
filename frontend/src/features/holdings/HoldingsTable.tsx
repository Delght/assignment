import type { ReactNode } from 'react';

import type { Holding, PortfolioSummary } from '@/api/types';
import { orDash, percent, quantity, unitPrice, usd } from '@/format/format';
import { AssetLabel } from '@/shared/AssetLabel';
import { Pnl } from '@/shared/Pnl';
import { ScrollRegion } from '@/shared/ScrollRegion';

import { HoldingBadges } from './HoldingBadges';
import { averageCostText, HOLDING_LABELS as L, UnrealizedPnl } from './holdingFields';
import { orderHoldings } from './orderHoldings';

export function HoldingsTable({
  holdings,
  summary,
}: {
  holdings: Holding[];
  summary: PortfolioSummary;
}) {
  return (
    <ScrollRegion labelledBy="holdings-caption">
      <table className="table">
        <caption id="holdings-caption">One row per asset. Average cost includes buy fees.</caption>
        <thead>
          <tr>
            <th scope="col">{L.asset}</th>
            <NumHead>{L.quantity}</NumHead>
            <NumHead>{L.averageCost}</NumHead>
            <NumHead>{L.price}</NumHead>
            <NumHead>{L.costBasis}</NumHead>
            <NumHead>{L.currentValue}</NumHead>
            <NumHead>{L.realizedPnl}</NumHead>
            <NumHead>{L.unrealizedPnl}</NumHead>
            <NumHead>{L.totalPnl}</NumHead>
            <NumHead>{L.allocation}</NumHead>
          </tr>
        </thead>
        <tbody>
          {orderHoldings(holdings).map((h) => (
            <tr key={h.symbol} className={h.status === 'closed' ? 'row-closed' : undefined}>
              <th scope="row">
                <AssetLabel symbol={h.symbol} />
                <HoldingBadges holding={h} />
              </th>
              <Num>{quantity(h.quantity)}</Num>
              <Num>{averageCostText(h)}</Num>
              <Num>{orDash(h.currentPrice, unitPrice)}</Num>
              <Num>{usd(h.costBasis)}</Num>
              <Num>{orDash(h.currentValue, usd)}</Num>
              <Num>
                <Pnl value={h.realizedPnl} />
              </Num>
              <Num>
                <UnrealizedPnl holding={h} />
              </Num>
              <Num>
                <Pnl value={h.totalPnl} />
              </Num>
              <Num>{orDash(h.allocation, percent)}</Num>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <Num />
            <Num />
            <Num />
            <Num>{usd(summary.costBasis)}</Num>
            <Num>{usd(summary.currentValue)}</Num>
            <Num>
              <Pnl value={summary.realizedPnl} />
            </Num>
            <Num>
              <Pnl value={summary.unrealizedPnl} />
            </Num>
            <Num>
              <Pnl value={summary.totalPnl} />
            </Num>
            <Num>{holdings.some((h) => h.allocation !== null) ? '100.00%' : '—'}</Num>
          </tr>
        </tfoot>
      </table>
    </ScrollRegion>
  );
}

function Num({ children }: { children?: ReactNode }) {
  return <td className="num">{children}</td>;
}

function NumHead({ children }: { children: ReactNode }) {
  return (
    <th scope="col" className="num">
      {children}
    </th>
  );
}
