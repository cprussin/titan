/** Round a barbell load to the nearest `step` pounds (default 5 — the smallest
 *  standard plate pair). Increments are already multiples of 5; this exists for
 *  percentage-based deloads that land off-grid (10% of 225 = 202.5 → 200). */
export const roundLoad = (weightLb: number, step = 5): number =>
  Math.round(weightLb / step) * step;
