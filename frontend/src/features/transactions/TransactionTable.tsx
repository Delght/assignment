import { type ReactNode, useId } from 'react';

import type { Transaction } from '@/api/types';
import { quantity, unitPrice, usd, utcCompact } from '@/format/format';
import { AssetLabel } from '@/shared/AssetLabel';
import { Pnl } from '@/shared/Pnl';
import { ScrollRegion } from '@/shared/ScrollRegion';

import type { Filters } from './filters';
import { TRANSACTION_LABELS as L } from './transactionFields';

export function TransactionTable({
  items,
  sort,
  onSortChange,
  busy,
}: {
  items: Transaction[];
  sort: Filters['sort'];
  onSortChange: (sort: Filters['sort']) => void;
  busy: boolean;
}) {
  const captionId = useId();
  const ascending = sort === 'asc';
  return (
    <ScrollRegion labelledBy={captionId}>
      <table className="table" aria-busy={busy}>
        <caption id={captionId} className="visually-hidden">
          Transactions matching the filters
        </caption>
        <thead>
          <tr>
            <th scope="col" aria-sort={ascending ? 'ascending' : 'descending'}>
              <button
                type="button"
                className="sort"
                onClick={() => onSortChange(ascending ? 'desc' : 'asc')}
              >
                {L.time} <span aria-hidden="true">{ascending ? '↑' : '↓'}</span>
                <span className="visually-hidden">
                  , sorted {ascending ? 'oldest' : 'newest'} first. Change order.
                </span>
              </button>
            </th>
            <th scope="col">{L.tradeId}</th>
            <th scope="col">{L.exchange}</th>
            <th scope="col">{L.asset}</th>
            <th scope="col">{L.side}</th>
            <NumHead>{L.quantity}</NumHead>
            <NumHead>{L.price}</NumHead>
            <NumHead>{L.grossValue}</NumHead>
            <NumHead>{L.fee}</NumHead>
            <NumHead>{L.realizedPnl}</NumHead>
          </tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.tradeId}>
              <td className="nowrap">{utcCompact(t.timestamp)}</td>
              <td className="nowrap muted">{t.tradeId}</td>
              <td className="muted">{t.exchange}</td>
              <td>
                <AssetLabel symbol={t.symbol} />
              </td>
              <td>
                <span className={`side side-${t.side.toLowerCase()}`}>{t.side}</span>
              </td>
              <td className="num">{quantity(t.quantity)}</td>
              <td className="num">{unitPrice(t.priceUsd)}</td>
              <td className="num">{usd(t.grossValue)}</td>
              <td className="num">{usd(t.feeUsd)}</td>
              <td className="num">
                <Pnl value={t.realizedPnl} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollRegion>
  );
}

function NumHead({ children }: { children: ReactNode }) {
  return (
    <th scope="col" className="num">
      {children}
    </th>
  );
}
