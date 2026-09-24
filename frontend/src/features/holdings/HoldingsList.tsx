import type { Holding } from '@/api/types';
import { orDash, percent, quantity, unitPrice, usd } from '@/format/format';
import { AssetLabel } from '@/shared/AssetLabel';
import { ExpandableList } from '@/shared/ExpandableList';
import { Pnl } from '@/shared/Pnl';

import { HoldingBadges } from './HoldingBadges';
import { averageCostText, HOLDING_LABELS as L, UnrealizedPnl } from './holdingFields';
import { orderHoldings } from './orderHoldings';

/** Holdings on narrow screens: value and total P&L at a glance, every column on tap. */
export function HoldingsList({ holdings }: { holdings: Holding[] }) {
  return (
    <ExpandableList
      label="Holdings"
      columns={{
        title: L.asset,
        subtitle: L.allocation,
        value: L.currentValue,
        subvalue: L.totalPnl,
      }}
      items={orderHoldings(holdings).map((h) => ({
        key: h.symbol,
        title: (
          <>
            <AssetLabel symbol={h.symbol} />
            <HoldingBadges holding={h} />
          </>
        ),
        subtitle: h.allocation === null ? undefined : percent(h.allocation),
        value: orDash(h.currentValue, usd),
        subvalue: <Pnl value={h.totalPnl} />,
        dimmed: h.status === 'closed',
        details: [
          { label: L.quantity, value: quantity(h.quantity) },
          { label: L.averageCost, value: averageCostText(h) },
          { label: L.price, value: orDash(h.currentPrice, unitPrice) },
          { label: L.costBasis, value: usd(h.costBasis) },
          { label: L.realizedPnl, value: <Pnl value={h.realizedPnl} /> },
          { label: L.unrealizedPnl, value: <UnrealizedPnl holding={h} /> },
        ],
      }))}
    />
  );
}
