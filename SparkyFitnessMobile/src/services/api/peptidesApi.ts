import { apiFetch } from './apiClient';
import type {
  CreatePeptidePayload,
  Injection,
  LevelSeriesResponse,
  LogInjectionPayload,
  Peptide,
  PeptideLevel,
} from '../../types/peptides';

const SERVICE_NAME = 'Peptides API';

/** Lists all of the user's peptides. */
export const fetchPeptides = async (): Promise<Peptide[]> =>
  apiFetch<Peptide[]>({
    endpoint: '/api/peptides',
    serviceName: SERVICE_NAME,
    operation: 'fetch peptides',
  });

/** Current estimated remaining level for every peptide. */
export const fetchPeptideLevels = async (): Promise<PeptideLevel[]> =>
  apiFetch<PeptideLevel[]>({
    endpoint: '/api/peptides/levels',
    serviceName: SERVICE_NAME,
    operation: 'fetch peptide levels',
  });

/** Decay time-series for charting a single peptide. */
export const fetchPeptideSeries = async (
  peptideId: string,
  params?: { start?: string; end?: string; resolutionMinutes?: number },
): Promise<LevelSeriesResponse> => {
  const query = new URLSearchParams();
  if (params?.start) query.set('start', params.start);
  if (params?.end) query.set('end', params.end);
  if (params?.resolutionMinutes != null) {
    query.set('resolutionMinutes', String(params.resolutionMinutes));
  }
  const qs = query.toString();
  return apiFetch<LevelSeriesResponse>({
    endpoint: `/api/peptides/${peptideId}/series${qs ? `?${qs}` : ''}`,
    serviceName: SERVICE_NAME,
    operation: 'fetch peptide series',
  });
};

/** Injection history for a single peptide. */
export const fetchInjections = async (peptideId: string): Promise<Injection[]> =>
  apiFetch<Injection[]>({
    endpoint: `/api/peptides/${peptideId}/injections`,
    serviceName: SERVICE_NAME,
    operation: 'fetch injections',
  });

/** Creates a new peptide. */
export const createPeptide = async (
  data: CreatePeptidePayload,
): Promise<Peptide> =>
  apiFetch<Peptide>({
    endpoint: '/api/peptides',
    serviceName: SERVICE_NAME,
    operation: 'create peptide',
    method: 'POST',
    body: data,
  });

/** Updates an existing peptide. */
export const updatePeptide = async (
  id: string,
  data: Partial<CreatePeptidePayload & { is_active: boolean }>,
): Promise<Peptide> =>
  apiFetch<Peptide>({
    endpoint: `/api/peptides/${id}`,
    serviceName: SERVICE_NAME,
    operation: 'update peptide',
    method: 'PUT',
    body: data,
  });

/** Deletes a peptide and its injections. */
export const deletePeptide = async (
  id: string,
): Promise<{ deleted: boolean }> =>
  apiFetch<{ deleted: boolean }>({
    endpoint: `/api/peptides/${id}`,
    serviceName: SERVICE_NAME,
    operation: 'delete peptide',
    method: 'DELETE',
  });

/** Logs an injection for a peptide. */
export const logInjection = async (
  peptideId: string,
  data: LogInjectionPayload,
): Promise<Injection> =>
  apiFetch<Injection>({
    endpoint: `/api/peptides/${peptideId}/injections`,
    serviceName: SERVICE_NAME,
    operation: 'log injection',
    method: 'POST',
    body: data,
  });

/** Deletes a single injection. */
export const deleteInjection = async (
  injectionId: string,
): Promise<{ deleted: boolean }> =>
  apiFetch<{ deleted: boolean }>({
    endpoint: `/api/peptides/injections/${injectionId}`,
    serviceName: SERVICE_NAME,
    operation: 'delete injection',
    method: 'DELETE',
  });
