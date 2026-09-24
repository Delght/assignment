import { type ChangeEvent, useRef, useState } from 'react';

import { ApiError } from '@/api/client';
import { useImportTrades, useResetSample } from '@/api/queries';
import { Alert } from '@/shared/Alert';

import { ImportIssues } from './ImportIssues';

/** Same limit as the server, checked first to save an upload. */
const MAX_FILE_BYTES = 2 * 1024 * 1024;

export function DatasetActions() {
  const input = useRef<HTMLInputElement>(null);
  const importTrades = useImportTrades();
  const reset = useResetSample();
  const [tooLarge, setTooLarge] = useState<string | null>(null);
  const busy = importTrades.isPending || reset.isPending;

  const clearMessages = () => {
    importTrades.reset();
    reset.reset();
    setTooLarge(null);
  };

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // so choosing the same file again imports it again
    if (!file) return;
    clearMessages();
    if (file.size > MAX_FILE_BYTES) {
      setTooLarge(`${file.name} is larger than 2 MB and was not uploaded. Nothing was changed.`);
      return;
    }
    importTrades.mutate(file);
  };

  const error = importTrades.error ?? reset.error;

  return (
    <>
      <div className="dataset-actions">
        <input
          ref={input}
          className="visually-hidden"
          // Opened by the button below, which carries the label; not a stop of its own.
          tabIndex={-1}
          aria-hidden="true"
          type="file"
          accept=".csv,text/csv"
          onChange={onFile}
          disabled={busy}
        />
        <button type="button" onClick={() => input.current?.click()} disabled={busy}>
          {importTrades.isPending ? 'Importing…' : 'Import trades.csv'}
        </button>
        <button
          type="button"
          className="secondary"
          disabled={busy}
          onClick={() => {
            clearMessages();
            reset.mutate();
          }}
        >
          {reset.isPending ? 'Resetting…' : 'Reset to sample data'}
        </button>
      </div>

      {importTrades.data ? (
        <Alert tone="success" title="Trades imported.">
          {importTrades.data.dataset.tradeCount} trades from{' '}
          {importTrades.data.dataset.fileName ?? 'the file'} replaced the previous data.
        </Alert>
      ) : null}
      {reset.isSuccess ? <Alert tone="success" title="Sample data restored." /> : null}
      {tooLarge ? (
        <Alert tone="error" title="Import failed.">
          {tooLarge}
        </Alert>
      ) : null}
      {error instanceof ApiError && error.issues.length > 0 ? (
        <ImportIssues error={error} />
      ) : error ? (
        <Alert tone="error" title={importTrades.error ? 'Import failed.' : 'Reset failed.'}>
          {error.message}
        </Alert>
      ) : null}
    </>
  );
}
