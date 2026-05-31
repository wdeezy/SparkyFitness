import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createPeptide,
  deleteInjection,
  deletePeptide,
  fetchInjections,
  fetchPeptideLevels,
  fetchPeptideSeries,
  fetchPeptides,
  logInjection,
} from '../services/api/peptidesApi';
import {
  peptideInjectionsQueryKey,
  peptideLevelsQueryKey,
  peptideSeriesQueryKey,
  peptidesQueryKey,
} from './queryKeys';
import { useRefetchOnFocus } from './useRefetchOnFocus';
import type {
  CreatePeptidePayload,
  LogInjectionPayload,
} from '../types/peptides';

interface EnabledOption {
  enabled?: boolean;
}

/** Current estimated levels for all peptides. */
export function usePeptideLevels({ enabled = true }: EnabledOption = {}) {
  const query = useQuery({
    queryKey: peptideLevelsQueryKey,
    queryFn: fetchPeptideLevels,
    enabled,
  });
  useRefetchOnFocus(query.refetch, enabled);
  return query;
}

/** Full list of the user's peptides. */
export function usePeptides({ enabled = true }: EnabledOption = {}) {
  const query = useQuery({
    queryKey: peptidesQueryKey,
    queryFn: fetchPeptides,
    enabled,
  });
  useRefetchOnFocus(query.refetch, enabled);
  return query;
}

/** Decay time-series for a single peptide. */
export function usePeptideSeries(
  peptideId: string | null,
  { enabled = true }: EnabledOption = {},
) {
  return useQuery({
    queryKey: peptideSeriesQueryKey(peptideId ?? ''),
    queryFn: () => fetchPeptideSeries(peptideId as string),
    enabled: enabled && !!peptideId,
  });
}

/** Injection history for a single peptide. */
export function usePeptideInjections(
  peptideId: string | null,
  { enabled = true }: EnabledOption = {},
) {
  return useQuery({
    queryKey: peptideInjectionsQueryKey(peptideId ?? ''),
    queryFn: () => fetchInjections(peptideId as string),
    enabled: enabled && !!peptideId,
  });
}

/**
 * Mutations for peptides + injections. Each invalidates the level cache (which
 * every screen reads) plus the affected per-peptide caches.
 */
export function usePeptideMutations() {
  const queryClient = useQueryClient();

  const invalidateLevelsAndList = () => {
    queryClient.invalidateQueries({ queryKey: peptideLevelsQueryKey });
    queryClient.invalidateQueries({ queryKey: peptidesQueryKey });
  };

  const createPeptideMutation = useMutation({
    mutationFn: (data: CreatePeptidePayload) => createPeptide(data),
    onSuccess: invalidateLevelsAndList,
  });

  const deletePeptideMutation = useMutation({
    mutationFn: (id: string) => deletePeptide(id),
    onSuccess: (_result, id) => {
      invalidateLevelsAndList();
      queryClient.invalidateQueries({ queryKey: peptideSeriesQueryKey(id) });
      queryClient.invalidateQueries({ queryKey: peptideInjectionsQueryKey(id) });
    },
  });

  const logInjectionMutation = useMutation({
    mutationFn: ({
      peptideId,
      data,
    }: {
      peptideId: string;
      data: LogInjectionPayload;
    }) => logInjection(peptideId, data),
    onSuccess: (_result, { peptideId }) => {
      invalidateLevelsAndList();
      queryClient.invalidateQueries({
        queryKey: peptideSeriesQueryKey(peptideId),
      });
      queryClient.invalidateQueries({
        queryKey: peptideInjectionsQueryKey(peptideId),
      });
    },
  });

  const deleteInjectionMutation = useMutation({
    mutationFn: ({ injectionId }: { injectionId: string; peptideId: string }) =>
      deleteInjection(injectionId),
    onSuccess: (_result, { peptideId }) => {
      invalidateLevelsAndList();
      queryClient.invalidateQueries({
        queryKey: peptideSeriesQueryKey(peptideId),
      });
      queryClient.invalidateQueries({
        queryKey: peptideInjectionsQueryKey(peptideId),
      });
    },
  });

  return {
    createPeptideMutation,
    deletePeptideMutation,
    logInjectionMutation,
    deleteInjectionMutation,
  };
}
