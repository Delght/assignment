import type { Transaction } from '@/api/types';
import { quantity, unitPrice, usd, utcCompact } from '@/format/format';
import { AssetLabel } from '@/shared/AssetLabel';
import { ExpandableList } from '@/shared/ExpandableList';
import { Pnl } from '@/shared/Pnl';

import type { Filters } from './filters';

/** Transactions on narrow screens: what, when and how much at a glance, the rest on tap. */
export function TransactionList({
  items,
  sort,
  onSortChange,
}: {
  items: Transaction[];
  sort: Filters['sort'];
  onSortChange: (sort: Filters['sort']) => void;
}) {
  const newestFirst = sort === 'desc';
  return (
    <>
      <div className="list-toolbar">
        <button
          type="button"
          className="secondary"
          onClick={() => onSortChange(newestFirst ? 'asc' : 'desc')}
          aria-label={`Sorted ${newestFirst ? 'newest' : 'oldest'} first. Show ${newestFirst ? 'oldest' : 'newest'} first.`}
        >
          {newestFirst ? 'Newest first' : 'Oldest first'}{' '}
          <span aria-hidden="true">{newestFirst ? '↓' : '↑'}</span>
        </button>
      </div>
      <ExpandableList
        label="Transactions"
        items={items.map((t) => ({
          key: t.tradeId,
          title: (
            <>
              <AssetLabel symbol={t.symbol} />
              <span className={`side side-${t.side.toLowerCase()}`}>{t.side}</span>
            </>
          ),
          subtitle: `${utcCompact(t.timestamp)} UTC`,
          value: usd(t.grossValue),
          subvalue: t.realizedPnl === null ? undefined : <Pnl value={t.realizedPnl} />,
          details: [
            { label: 'Trade ID', value: t.tradeId },
            { label: 'Exchange', value: t.exchange },
            { label: 'Quantity', value: quantity(t.quantity) },
            { label: 'Price', value: unitPrice(t.priceUsd) },
            { label: 'Fee', value: usd(t.feeUsd) },
            ...(t.realizedPnl === null
              ? []
              : [{ label: 'Realized P&L', value: <Pnl value={t.realizedPnl} /> }]),
          ],
        }))}
      />
    </>
  );
}
