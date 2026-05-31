/**
 * Peptide / injection tracking types.
 *
 * These mirror the web client contract in
 * `SparkyFitnessFrontend/src/api/Peptides/peptideService.ts`, which is the
 * source of truth for the `/api/peptides` response shapes. Keep them aligned.
 */

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

export interface LevelSeriesPoint {
  timestamp: number;
  level: number;
  dose?: number;
}

export interface LevelSeriesResponse {
  peptide_id: string;
  name: string;
  dose_unit: string;
  half_life_hours: number;
  series: LevelSeriesPoint[];
}

export interface CreatePeptidePayload {
  name: string;
  half_life_hours: number;
  default_dose?: number | null;
  dose_unit: string;
  color?: string | null;
  notes?: string | null;
}

export interface LogInjectionPayload {
  dose: number;
  injection_site?: string;
  injected_at?: string;
  notes?: string;
}

/**
 * Approximate published elimination half-lives (hours) for quick add. Mirrors
 * the web `HALF_LIFE_PRESETS`. Estimates only — confirm against current
 * prescribing information.
 */
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
