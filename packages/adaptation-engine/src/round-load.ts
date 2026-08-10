import type { LoadUnit } from "@titan/domain/load-unit";
import { loadStep } from "@titan/domain/load-unit";

/** Round a barbell load to the nearest plate step in its unit (2.5 kg for metric
 *  loading, 5 lb for imperial — the smallest standard plate pair). Increments
 *  are already on-grid; this exists for percentage-based deloads that land off
 *  it (10% of 102.5 kg = 92.25 → 92.5). */
export const roundLoad = (weight: number, unit: LoadUnit): number => {
  const step = loadStep(unit);
  return Math.round(weight / step) * step;
};
