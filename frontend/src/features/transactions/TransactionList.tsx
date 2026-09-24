import type { Transaction } from '@/api/types';
import { quantity, unitPrice, usd, utcCompact } from '@/format/format';
import { AssetLabel } from '@/shared/AssetLabel';
import { ExpandableList } from '@/shared/ExpandableList';
import { Pnl } from '@/shared/Pnl';

import type { Filters } from './filters';
import { TRANSACTION_LABELS as L } from './transactionFields';

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
        columns={{
          title: L.assetAndSide,
          subtitle: L.time,
          value: L.grossValue,
          subvalue: L.realizedPnl,
        }}
        items={items.map((t) => ({
          key: t.tradeId,
          title: (
            <>
              <AssetLabel symbol={t.symbol} />
              <span className={`side side-${t.side.toLowerCase()}`}>{t.side}</span>
            </>
          ),
          subtitle: utcCompact(t.timestamp),
          value: usd(t.grossValue),
          subvalue: t.realizedPnl === null ? undefined : <Pnl value={t.realizedPnl} />,
          details: [
            { label: L.tradeId, value: t.tradeId },
            { label: L.exchange, value: t.exchange },
            { label: L.quantity, value: quantity(t.quantity) },
            { label: L.price, value: unitPrice(t.priceUsd) },
            { label: L.fee, value: usd(t.feeUsd) },
            ...(t.realizedPnl === null
              ? []
              : [{ label: L.realizedPnl, value: <Pnl value={t.realizedPnl} /> }]),
          ],
        }))}
      />
    </>
  );
}
