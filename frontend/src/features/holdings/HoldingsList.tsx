import type { Holding } from '@/api/types';
import { orDash, percent, quantity, unitPrice, usd } from '@/format/format';
import { AssetLabel } from '@/shared/AssetLabel';
import { ExpandableList } from '@/shared/ExpandableList';
import { Pnl } from '@/shared/Pnl';

import { HoldingBadges } from './HoldingBadges';
import { averageCostText, UnrealizedPnl } from './holdingFields';
import { orderHoldings } from './orderHoldings';

/** Holdings on narrow screens: value and total P&L at a glance, every column on tap. */
export function HoldingsList({ holdings }: { holdings: Holding[] }) {
  return (
    <ExpandableList
      label="Holdings"
      items={orderHoldings(holdings).map((h) => ({
        key: h.symbol,
        title: (
          <>
            <AssetLabel symbol={h.symbol} />
            <HoldingBadges holding={h} />
          </>
        ),
        subtitle: h.allocation === null ? undefined : `${percent(h.allocation)} of the portfolio`,
        value: orDash(h.currentValue, usd),
        subvalue: <Pnl value={h.totalPnl} />,
        dimmed: h.status === 'closed',
        details: [
          { label: 'Quantity', value: quantity(h.quantity) },
          { label: 'Average cost', value: averageCostText(h) },
          { label: 'Price', value: orDash(h.currentPrice, unitPrice) },
          { label: 'Cost basis', value: usd(h.costBasis) },
          { label: 'Realized P&L', value: <Pnl value={h.realizedPnl} /> },
          { label: 'Unrealized P&L', value: <UnrealizedPnl holding={h} /> },
          { label: 'Fees paid', value: usd(h.feesPaid) },
        ],
      }))}
    />
  );
}
