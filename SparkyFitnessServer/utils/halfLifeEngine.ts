/**
 * halfLifeEngine.ts
 *
 * Single-compartment, first-order elimination pharmacokinetics.
 * Each dose decays independently as C(t) = C0 * (1/2)^(t / t_half),
 * and the total estimated level at any instant is the superposition
 * (sum) of every prior dose still in the system.
 *
 * These are standard textbook PK formulas. This is an ESTIMATE for
 * visualization only and is not medical or dosing guidance.
 */

export interface InjectionPoint {
  dose: number; // amount in the peptide's dose_unit
  injectedAtMs: number; // epoch milliseconds
}

export interface LevelSeriesOptions {
  startMs: number;
  endMs: number;
  resolutionMinutes?: number; // default 60
}

export interface LevelSeriesPoint {
  timestamp: number; // epoch ms
  level: number; // estimated remaining amount
  dose?: number; // present when an injection lands on/near this step
}

const MS_PER_HOUR = 60 * 60 * 1000;

/** Remaining amount of a single dose after `hoursSinceDose`. */
export function concentrationAtTime(
  dose: number,
  halfLifeHours: number,
  hoursSinceDose: number
): number {
  if (halfLifeHours <= 0) return 0;
  if (hoursSinceDose < 0) return 0;
  return dose * Math.pow(0.5, hoursSinceDose / halfLifeHours);
}

/** Total estimated level at `timestampMs` from all prior injections. */
export function levelAtTime(
  injections: InjectionPoint[],
  halfLifeHours: number,
  timestampMs: number
): number {
  return injections.reduce((total, inj) => {
    const hoursSince = (timestampMs - inj.injectedAtMs) / MS_PER_HOUR;
    return total + concentrationAtTime(inj.dose, halfLifeHours, hoursSince);
  }, 0);
}

/** Time-series of estimated levels for charting. */
export function generateLevelSeries(
  injections: InjectionPoint[],
  halfLifeHours: number,
  options: LevelSeriesOptions
): LevelSeriesPoint[] {
  const { startMs, endMs, resolutionMinutes = 60 } = options;
  const stepMs = resolutionMinutes * 60 * 1000;
  const points: LevelSeriesPoint[] = [];

  for (let t = startMs; t <= endMs; t += stepMs) {
    const level = levelAtTime(injections, halfLifeHours, t);
    const landed = injections.find(
      (inj) => Math.abs(inj.injectedAtMs - t) < stepMs / 2
    );
    points.push({
      timestamp: t,
      level: Number(level.toFixed(4)),
      dose: landed ? landed.dose : undefined,
    });
  }
  return points;
}

/**
 * Percent of the most recent dose still estimated to remain right now,
 * plus the absolute current level and hours since that last dose.
 */
export function statusNow(
  injections: InjectionPoint[],
  halfLifeHours: number,
  nowMs: number = Date.now()
): {
  currentLevel: number;
  lastDose: number | null;
  lastDoseAtMs: number | null;
  hoursSinceLastDose: number | null;
  percentOfLastDoseRemaining: number | null;
} {
  if (injections.length === 0) {
    return {
      currentLevel: 0,
      lastDose: null,
      lastDoseAtMs: null,
      hoursSinceLastDose: null,
      percentOfLastDoseRemaining: null,
    };
  }
  const sorted = [...injections].sort(
    (a, b) => b.injectedAtMs - a.injectedAtMs
  );
  const last = sorted[0];
  const hoursSinceLastDose = (nowMs - last.injectedAtMs) / MS_PER_HOUR;
  const remainingOfLast = concentrationAtTime(
    last.dose,
    halfLifeHours,
    hoursSinceLastDose
  );
  return {
    currentLevel: Number(
      levelAtTime(injections, halfLifeHours, nowMs).toFixed(4)
    ),
    lastDose: last.dose,
    lastDoseAtMs: last.injectedAtMs,
    hoursSinceLastDose: Number(hoursSinceLastDose.toFixed(2)),
    percentOfLastDoseRemaining:
      last.dose > 0
        ? Number(((remainingOfLast / last.dose) * 100).toFixed(1))
        : null,
  };
}

/**
 * Estimated steady-state trough/peak for a regular interval (hours).
 * C_ss accumulation factor = 1 / (1 - e^(-lambda * tau)).
 */
export function estimateSteadyState(
  dose: number,
  halfLifeHours: number,
  intervalHours: number
): { peak: number; trough: number; accumulationFactor: number } {
  if (halfLifeHours <= 0 || intervalHours <= 0) {
    return { peak: dose, trough: 0, accumulationFactor: 1 };
  }
  const lambda = Math.LN2 / halfLifeHours;
  const accumulationFactor = 1 / (1 - Math.exp(-lambda * intervalHours));
  const peak = dose * accumulationFactor;
  const trough = peak * Math.exp(-lambda * intervalHours);
  return {
    peak: Number(peak.toFixed(4)),
    trough: Number(trough.toFixed(4)),
    accumulationFactor: Number(accumulationFactor.toFixed(3)),
  };
}
