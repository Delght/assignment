import { Component, type ErrorInfo, type ReactNode } from 'react';

import { Alert } from './Alert';

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  override state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unexpected rendering error', error, info.componentStack);
  }

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="page">
        <Alert tone="error" title="Something went wrong while showing the portfolio.">
          <p>{this.state.error.message}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload
          </button>
        </Alert>
      </main>
    );
  }
}
