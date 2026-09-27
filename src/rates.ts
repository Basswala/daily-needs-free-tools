export interface EffectiveRateInputs {
  /** Quoted project fee or fixed retainer ($) */
  fee: number;
  /** Actual total hours worked on the project / client */
  actualHours: number;
  /** Hours originally billed or scoped */
  billedHours: number;
  /** Internal labor / subcontractor cost per hour ($) */
  costPerHour: number;
  /** Target gross margin percentage (e.g. 50 for 50%) */
  targetMarginPct: number;
  /** Duration of project in weeks (e.g. 4) */
  weeks: number;
}

export interface EffectiveRateResult {
  nominalRate: number;
  effectiveRate: number;
  rateGap: number;
  unbilledHours: number;
  unbilledValue: number;
  costToDeliver: number;
  grossMarginPct: number;
  marginLostToUnbilled: number;
  recommendedFloor: number;
  hoursPerWeek: number;
}

/**
 * Calculates real hourly earnings after unpaid revisions, scope creep,
 * and admin work are factored into fixed fee projects.
 */
export function computeEffectiveRate(input: EffectiveRateInputs): EffectiveRateResult {
  const billed = Math.min(input.billedHours, input.actualHours);

  const nominalRate = billed > 0 ? input.fee / billed : 0;
  const effectiveRate = input.actualHours > 0 ? input.fee / input.actualHours : 0;
  const rateGap = nominalRate - effectiveRate;

  const unbilledHours = Math.max(0, input.actualHours - billed);
  const unbilledValue = unbilledHours * nominalRate;

  const costToDeliver = input.actualHours * input.costPerHour;
  const grossMarginPct = input.fee > 0 ? ((input.fee - costToDeliver) / input.fee) * 100 : 0;

  const marginLostToUnbilled = unbilledHours * input.costPerHour;
  const markup = 1 + input.targetMarginPct / 100;
  const recommendedFloor = billed > 0 ? (input.actualHours * input.costPerHour * markup) / billed : 0;

  const hoursPerWeek = input.weeks > 0 ? input.actualHours / input.weeks : 0;

  return {
    nominalRate,
    effectiveRate,
    rateGap,
    unbilledHours,
    unbilledValue,
    costToDeliver,
    grossMarginPct,
    marginLostToUnbilled,
    recommendedFloor,
    hoursPerWeek,
  };
}
