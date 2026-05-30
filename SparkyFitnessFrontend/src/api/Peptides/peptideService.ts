import { apiCall } from '@/api/api';

export interface Peptide {
  id: string;
  user_id: string;
  name: string;
  half_life_hours: number;
  default_dose: number | null;
  dose_unit: string;
  color: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Injection {
  id: string;
  peptide_id: string;
  dose: number;
  dose_unit: string;
  injection_site: string | null;
  injected_at: string;
  notes: string | null;
  created_at: string;
}

export interface PeptideLevel {
  peptide_id: string;
  name: string;
  dose_unit: string;
  half_life_hours: number;
  color: string | null;
  is_active: boolean;
  currentLevel: number;
  lastDose: number | null;
  lastDoseAtMs: number | null;
  hoursSinceLastDose: number | null;
  percentOfLastDoseRemaining: number | null;
}

export interface LevelSeriesResponse {
  peptide_id: string;
  name: string;
  dose_unit: string;
  half_life_hours: number;
  series: { timestamp: number; level: number; dose?: number }[];
}

export const getPeptides = (): Promise<Peptide[]> => apiCall('/peptides');

export const createPeptide = (
  data: Partial<Omit<Peptide, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<Peptide> => apiCall('/peptides', { method: 'POST', body: data });

export const updatePeptide = (
  id: string,
  data: Partial<Peptide>
): Promise<Peptide> =>
  apiCall(`/peptides/${id}`, { method: 'PUT', body: data });

export const deletePeptide = (id: string): Promise<{ deleted: boolean }> =>
  apiCall(`/peptides/${id}`, { method: 'DELETE' });

export const getCurrentLevels = (): Promise<PeptideLevel[]> =>
  apiCall('/peptides/levels');

export const getLevelSeries = (
  id: string,
  params?: { start?: string; end?: string; resolutionMinutes?: number }
): Promise<LevelSeriesResponse> =>
  apiCall(`/peptides/${id}/series`, { params });

export const getInjections = (peptideId: string): Promise<Injection[]> =>
  apiCall(`/peptides/${peptideId}/injections`);

export const logInjection = (
  peptideId: string,
  data: {
    dose: number;
    injection_site?: string;
    injected_at?: string;
    notes?: string;
  }
): Promise<Injection> =>
  apiCall(`/peptides/${peptideId}/injections`, { method: 'POST', body: data });

export const deleteInjection = (
  injectionId: string
): Promise<{ deleted: boolean }> =>
  apiCall(`/peptides/injections/${injectionId}`, { method: 'DELETE' });

// Approximate published elimination half-lives (hours) for quick add.
// Estimates only — confirm against current prescribing information.
export const HALF_LIFE_PRESETS: {
  name: string;
  halfLifeHours: number;
  unit: string;
}[] = [
  { name: 'Semaglutide', halfLifeHours: 165, unit: 'mg' },
  { name: 'Tirzepatide', halfLifeHours: 120, unit: 'mg' },
  { name: 'Dulaglutide', halfLifeHours: 108, unit: 'mg' },
  { name: 'Retatrutide', halfLifeHours: 150, unit: 'mg' },
  { name: 'Liraglutide', halfLifeHours: 13, unit: 'mg' },
];
