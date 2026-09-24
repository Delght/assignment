import {
  keepPreviousData,
  type MutationFunction,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { api } from './client';
import type { ImportResponse } from './types';

export function usePortfolio() {
  return useQuery({ queryKey: ['portfolio'], queryFn: api.portfolio });
}

export function useTransactions(query: URLSearchParams, enabled = true) {
  return useQuery({
    queryKey: ['transactions', query.toString()],
    queryFn: () => api.transactions(query),
    enabled,
    placeholderData: keepPreviousData,
  });
}

/** Import and reset replace the whole dataset, so every cached view is refetched. */
function useReplaceDataset<TVariables>(mutationFn: MutationFunction<ImportResponse, TVariables>) {
  const client = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => client.invalidateQueries() });
}

export const useImportTrades = () => useReplaceDataset(api.importTrades);
export const useResetSample = () => useReplaceDataset<void>(api.reset);
