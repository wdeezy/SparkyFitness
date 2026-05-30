import peptideRepository from '../models/peptideRepository.js';
import { log } from '../config/logging.js';
import {
  generateLevelSeries,
  statusNow,
  estimateSteadyState,
  InjectionPoint,
} from '../utils/halfLifeEngine.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createPeptide(userId: any, data: any) {
  if (
    !data?.name ||
    data.half_life_hours === null ||
    data.half_life_hours === undefined
  ) {
    throw new Error('name and half_life_hours are required.');
  }
  if (Number(data.half_life_hours) <= 0) {
    throw new Error('half_life_hours must be greater than 0.');
  }
  try {
    return await peptideRepository.createPeptide(userId, data);
  } catch (error) {
    log('error', `Error creating peptide for user ${userId}:`, error);
    throw error;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getPeptides(userId: any) {
  return await peptideRepository.getPeptidesByUserId(userId);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updatePeptide(id: any, userId: any, data: any) {
  return await peptideRepository.updatePeptide(id, userId, data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function deletePeptide(id: any, userId: any) {
  return await peptideRepository.deletePeptide(id, userId);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logInjection(userId: any, data: any) {
  if (!data?.peptide_id || data.dose === null || data.dose === undefined) {
    throw new Error('peptide_id and dose are required.');
  }
  // Ensure the peptide belongs to the user (RLS also enforces this).
  const peptide = await peptideRepository.getPeptideById(
    data.peptide_id,
    userId
  );
  if (!peptide) throw new Error('Peptide not found.');
  try {
    return await peptideRepository.createInjection(userId, {
      dose_unit: peptide.dose_unit,
      ...data,
    });
  } catch (error) {
    log('error', `Error logging injection for user ${userId}:`, error);
    throw error;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getInjections(userId: any, peptideId: any) {
  return await peptideRepository.getInjectionsByPeptide(userId, peptideId);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function deleteInjection(id: any, userId: any) {
  return await peptideRepository.deleteInjection(id, userId);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toInjectionPoints(rows: any[]): InjectionPoint[] {
  return rows.map((r) => ({
    dose: Number(r.dose),
    injectedAtMs: new Date(r.injected_at).getTime(),
  }));
}

/**
 * Current estimated level + percent-of-last-dose remaining for every
 * active peptide. Looks back ~10 half-lives (effectively cleared) per peptide.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getCurrentLevels(userId: any) {
  const peptides = await peptideRepository.getPeptidesByUserId(userId);
  const now = Date.now();
  const results = [];
  for (const p of peptides) {
    const halfLife = Number(p.half_life_hours);
    const lookbackMs = halfLife * 10 * 60 * 60 * 1000;
    const sinceIso = new Date(now - lookbackMs).toISOString();
    const rows = await peptideRepository.getInjectionsSince(
      userId,
      p.id,
      sinceIso
    );
    const status = statusNow(toInjectionPoints(rows), halfLife, now);
    results.push({
      peptide_id: p.id,
      name: p.name,
      dose_unit: p.dose_unit,
      half_life_hours: halfLife,
      color: p.color,
      is_active: p.is_active,
      ...status,
    });
  }
  return results;
}

/**
 * Decay time-series for one peptide, for charting. Defaults to a window of
 * the last 30 days through 7 days into the future (projected decay).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getLevelSeries(userId: any, peptideId: any, query: any) {
  const peptide = await peptideRepository.getPeptideById(peptideId, userId);
  if (!peptide) throw new Error('Peptide not found.');
  const halfLife = Number(peptide.half_life_hours);

  const now = Date.now();
  const startMs = query?.start
    ? new Date(query.start).getTime()
    : now - 30 * 24 * 60 * 60 * 1000;
  const endMs = query?.end
    ? new Date(query.end).getTime()
    : now + 7 * 24 * 60 * 60 * 1000;
  const resolutionMinutes = query?.resolutionMinutes
    ? Number(query.resolutionMinutes)
    : 360; // 6h steps by default

  // Pull all injections from before the window start so their tails count.
  const lookbackIso = new Date(
    startMs - halfLife * 10 * 60 * 60 * 1000
  ).toISOString();
  const rows = await peptideRepository.getInjectionsSince(
    userId,
    peptideId,
    lookbackIso
  );

  return {
    peptide_id: peptideId,
    name: peptide.name,
    dose_unit: peptide.dose_unit,
    half_life_hours: halfLife,
    series: generateLevelSeries(toInjectionPoints(rows), halfLife, {
      startMs,
      endMs,
      resolutionMinutes,
    }),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSteadyState(peptide: any, intervalHours: any) {
  return estimateSteadyState(
    Number(peptide.default_dose || 0),
    Number(peptide.half_life_hours),
    Number(intervalHours)
  );
}

export default {
  createPeptide,
  getPeptides,
  updatePeptide,
  deletePeptide,
  logInjection,
  getInjections,
  deleteInjection,
  getCurrentLevels,
  getLevelSeries,
  getSteadyState,
};
