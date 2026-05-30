import {
  getPeptides,
  getCurrentLevels,
  getLevelSeries,
  getInjections,
  createPeptide,
  updatePeptide,
  deletePeptide,
  logInjection,
  deleteInjection,
} from '@/api/Peptides/peptideService';

// Re-export the peptide types and presets through the hooks layer so pages
// consume them here rather than importing from '@/api/**' directly (the repo
// restricts direct API imports to src/hooks, src/tests, and src/api).
export { HALF_LIFE_PRESETS } from '@/api/Peptides/peptideService';
export type {
  Peptide,
  Injection,
  PeptideLevel,
  LevelSeriesResponse,
} from '@/api/Peptides/peptideService';

/**
 * Exposes the peptide API surface to components. The underlying functions are
 * module-level references, so identities stay stable across renders.
 */
export function usePeptideApi() {
  return {
    getPeptides,
    getCurrentLevels,
    getLevelSeries,
    getInjections,
    createPeptide,
    updatePeptide,
    deletePeptide,
    logInjection,
    deleteInjection,
  };
}
