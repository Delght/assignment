import type { ReactNode } from 'react';

import type { Holding, PortfolioSummary } from '@/api/types';
import { orDash, percent, quantity, unitPrice, usd } from '@/format/format';
import { AssetLabel } from '@/shared/AssetLabel';
import { Pnl } from '@/shared/Pnl';
import { ScrollRegion } from '@/shared/ScrollRegion';

import { HoldingBadges } from './HoldingBadges';
import { averageCostText, UnrealizedPnl } from './holdingFields';
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
            <th scope="col">Asset</th>
            <th scope="col" className="num">
              Quantity
            </th>
            <th scope="col" className="num">
              Avg cost
            </th>
            <th scope="col" className="num">
              Price
            </th>
            <th scope="col" className="num">
              Cost basis
            </th>
            <th scope="col" className="num">
              Value
            </th>
            <th scope="col" className="num">
              Realized P&amp;L
            </th>
            <th scope="col" className="num">
              Unrealized P&amp;L
            </th>
            <th scope="col" className="num">
              Total P&amp;L
            </th>
            <th scope="col" className="num">
              Allocation
            </th>
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
