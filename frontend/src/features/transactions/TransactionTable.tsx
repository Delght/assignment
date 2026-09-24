import { useId } from 'react';

import type { Transaction } from '@/api/types';
import { quantity, unitPrice, usd, utcCompact } from '@/format/format';
import { AssetLabel } from '@/shared/AssetLabel';
import { Pnl } from '@/shared/Pnl';
import { ScrollRegion } from '@/shared/ScrollRegion';

import type { Filters } from './filters';

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
                Time (UTC) <span aria-hidden="true">{ascending ? '↑' : '↓'}</span>
                <span className="visually-hidden">
                  , sorted {ascending ? 'oldest' : 'newest'} first. Change order.
                </span>
              </button>
            </th>
            <th scope="col">Trade ID</th>
            <th scope="col">Exchange</th>
            <th scope="col">Asset</th>
            <th scope="col">Side</th>
            <th scope="col" className="num">
              Quantity
            </th>
            <th scope="col" className="num">
              Price
            </th>
            <th scope="col" className="num">
              Gross value
            </th>
            <th scope="col" className="num">
              Fee
            </th>

            <th scope="col" className="num">
              Realized P&amp;L
            </th>
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
