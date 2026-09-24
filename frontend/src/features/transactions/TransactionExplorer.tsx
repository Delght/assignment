import './transactions.css';

import { ApiError } from '@/api/client';
import { useTransactions } from '@/api/queries';
import { usd } from '@/format/format';
import { Alert } from '@/shared/Alert';
import { Facts } from '@/shared/Facts';
import { Pnl } from '@/shared/Pnl';
import { useCompactLayout } from '@/shared/useMediaQuery';

import { rangeError, toQuery } from './filters';
import { Pagination } from './Pagination';
import { TransactionFilters } from './TransactionFilters';
import { TransactionList } from './TransactionList';
import { TransactionTable } from './TransactionTable';
import { TRANSACTION_LABELS as L } from './transactionFields';
import { useTransactionFilters } from './useTransactionFilters';

export function TransactionExplorer() {
  const { goToPage, ...filterControls } = useTransactionFilters();
  const { filters, update } = filterControls;
  const invalidRange = rangeError(filters);
  const result = useTransactions(toQuery(filters), invalidRange === null);
  const data = result.data;
  const compact = useCompactLayout();

  return (
    <div className="explorer">
      <TransactionFilters {...filterControls} />

      {invalidRange ? <Alert tone="error">{invalidRange}</Alert> : null}
      {result.isError ? (
        <Alert tone="error" title="Transactions could not be loaded.">
          {result.error instanceof ApiError && result.error.issues.length > 0
            ? result.error.issues.map((issue) => issue.message).join(' ')
            : result.error.message}
        </Alert>
      ) : null}

      {data ? (
        <div role="status">
          <Facts
            label="Totals for the current filters"
            items={[
              { label: 'Trades', value: data.total },
              { label: L.grossValue, value: usd(data.totals.grossValue) },
              { label: 'Fees', value: usd(data.totals.fees) },
              { label: L.realizedPnl, value: <Pnl value={data.totals.realizedPnl} /> },
            ]}
          />
        </div>
      ) : result.isPending && !invalidRange ? (
        <p className="muted" role="status">
          Loading transactions…
        </p>
      ) : null}

      {data && data.items.length === 0 ? (
        <p className="empty">No transactions match these filters.</p>
      ) : null}
      {data && data.items.length > 0 ? (
        <>
          {compact ? (
            <TransactionList
              items={data.items}
              sort={filters.sort}
              onSortChange={(sort) => update({ sort })}
            />
          ) : (
            <TransactionTable
              items={data.items}
              sort={filters.sort}
              onSortChange={(sort) => update({ sort })}
              busy={result.isFetching}
            />
          )}
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            pageSize={filters.pageSize}
            onPageChange={goToPage}
            onPageSizeChange={(pageSize) => update({ pageSize })}
          />
        </>
      ) : null}
    </div>
  );
}
