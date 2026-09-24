import type { Holding } from '@/api/types';
import { unitPrice } from '@/format/format';
import { Pnl } from '@/shared/Pnl';

// Shown by both the table and the phone list, so they always read the same.

export const HOLDING_LABELS = {
  asset: 'Asset',
  quantity: 'Quantity',
  averageCost: 'Average cost',
  price: 'Price',
  costBasis: 'Cost basis',
  currentValue: 'Current value',
  realizedPnl: 'Realized P&L',
  unrealizedPnl: 'Unrealized P&L',
  totalPnl: 'Total P&L',
  allocation: 'Allocation',
} as const;

export function averageCostText(holding: Holding): string {
  return holding.status === 'open' ? unitPrice(holding.averageCost) : '—';
}

export function UnrealizedPnl({ holding }: { holding: Holding }) {
  return (
    <>
      <Pnl value={holding.unrealizedPnl} />
      {holding.unrealizedReturn === null ? null : (
        <span className="sub">
          <Pnl value={holding.unrealizedReturn} kind="percent" arrow={false} />
        </span>
      )}
    </>
  );
}
