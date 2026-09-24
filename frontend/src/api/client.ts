import type {
  ErrorBody,
  ImportResponse,
  PortfolioResponse,
  TransactionsResponse,
  ValidationIssue,
} from './types';

/** A failed request: the HTTP status (0 when the server could not be reached) and its body. */
export class ApiError extends Error {
  readonly issues: ValidationIssue[];
  readonly totalIssues: number;

  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    issues: ValidationIssue[] = [],
    totalIssues?: number,
  ) {
    super(message);
    this.name = 'ApiError';
    this.issues = issues;
    this.totalIssues = totalIssues ?? issues.length;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      headers: { accept: 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiError(
      0,
      'network_error',
      'The server could not be reached. Check your connection and try again.',
    );
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as Partial<ErrorBody> | null;
    throw new ApiError(
      response.status,
      body?.code ?? 'http_error',
      body?.message ?? `The server answered ${response.status}.`,
      body?.issues,
      body?.totalIssues,
    );
  }
  return (await response.json()) as T;
}

export const api = {
  portfolio: () => request<PortfolioResponse>('/portfolio'),
  transactions: (query: URLSearchParams) =>
    request<TransactionsResponse>(`/transactions?${query.toString()}`),
  importTrades: (file: File) =>
    request<ImportResponse>('/import', {
      method: 'POST',
      headers: { 'content-type': 'text/csv', 'x-file-name': encodeURIComponent(file.name) },
      body: file,
    }),
  reset: () => request<ImportResponse>('/reset', { method: 'POST' }),
};
