import './app.css';

import { usePortfolio } from '@/api/queries';
import { Alert } from '@/shared/Alert';

import { PortfolioView } from './PortfolioView';

export function App() {
  const portfolio = usePortfolio();

  return (
    <main className="page">
      <header>
        <h1>Coinance</h1>
      </header>

      {portfolio.isPending ? (
        <p className="muted" role="status">
          Loading portfolio…
        </p>
      ) : portfolio.isError ? (
        <Alert tone="error" title="The portfolio could not be loaded.">
          <p>{portfolio.error.message}</p>
          <button
            type="button"
            onClick={() => void portfolio.refetch()}
            disabled={portfolio.isFetching}
          >
            {portfolio.isFetching ? 'Retrying…' : 'Try again'}
          </button>
        </Alert>
      ) : (
        <PortfolioView portfolio={portfolio.data} />
      )}
    </main>
  );
}
