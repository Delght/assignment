import { EXCHANGES, SIDES, SYMBOLS } from '@/api/types';

import { type Filters, isFiltered } from './filters';
import { TRANSACTION_LABELS as L } from './transactionFields';
import type { useTransactionFilters } from './useTransactionFilters';

type Props = Omit<ReturnType<typeof useTransactionFilters>, 'goToPage'>;

export function TransactionFilters({ filters, search, setSearch, update, clear }: Props) {
  return (
    <form
      className="filters"
      onSubmit={(event) => event.preventDefault()}
      aria-label="Transaction filters"
    >
      <Choice
        label={L.asset}
        value={filters.symbol}
        all="All assets"
        options={SYMBOLS}
        onChange={(symbol) => update({ symbol: symbol as Filters['symbol'] })}
      />
      <Choice
        label={L.exchange}
        value={filters.exchange}
        all="All exchanges"
        options={EXCHANGES}
        onChange={(exchange) => update({ exchange: exchange as Filters['exchange'] })}
      />
      <Choice
        label={L.side}
        value={filters.side}
        all="Buys and sells"
        options={SIDES}
        onChange={(side) => update({ side: side as Filters['side'] })}
      />
      <label>
        {L.tradeId}
        <input
          type="search"
          value={search}
          placeholder="e.g. TRD-0042"
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      <label>
        From (UTC)
        <input
          type="date"
          value={filters.from}
          max={filters.to || undefined}
          onChange={(e) => update({ from: e.target.value })}
        />
      </label>
      <label>
        To (UTC)
        <input
          type="date"
          value={filters.to}
          min={filters.from || undefined}
          onChange={(e) => update({ to: e.target.value })}
        />
      </label>
      {isFiltered(filters) ? (
        <button type="button" className="secondary" onClick={clear}>
          Clear filters
        </button>
      ) : null}
    </form>
  );
}

function Choice({
  label,
  value,
  all,
  options,
  onChange,
}: {
  label: string;
  value: string;
  all: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{all}</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
