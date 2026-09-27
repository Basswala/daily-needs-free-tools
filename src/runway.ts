export interface RunwayInputs {
  /** Available cash reserves ($) */
  cash: number;
  /** Monthly revenue ($) */
  revenue: number;
  /** Variable costs as percentage of revenue (e.g. 40 for 40%) */
  variableCostPct: number;
  /** Monthly fixed operating expenses ($) */
  fixedCosts: number;
  /** Monthly founder / owner draw ($) */
  ownerDraw: number;
}

export interface RunwayResult {
  variableCost: number;
  contribution: number;
  netMonthly: number;
  burn: number;
  runwayMonths: number | null;
  breakevenRevenue: number;
  revenueGap: number;
  cash6mo: number;
  cash12mo: number;
  cashOutDate: Date | null;
  status: 'Cash positive' | 'Comfortable' | 'Watch it' | 'Act now' | 'Critical';
}

function addMonths(base: Date, months: number): Date {
  const d = new Date(base.getTime());
  const whole = Math.floor(months);
  const frac = months - whole;
  d.setMonth(d.getMonth() + whole);
  if (frac > 0) d.setDate(d.getDate() + Math.round(frac * 30));
  return d;
}

/**
 * Calculates net monthly burn, cash runway in months, zero-cash projected date,
 * and exact revenue needed to break even.
 */
export function computeCashRunway(input: RunwayInputs, now: Date = new Date()): RunwayResult {
  const variableRate = input.variableCostPct / 100;
  const variableCost = input.revenue * variableRate;
  const contribution = input.revenue - variableCost;
  const netMonthly = contribution - input.fixedCosts - input.ownerDraw;
  const burn = netMonthly < 0 ? -netMonthly : 0;
  const runwayMonths = burn > 0 ? input.cash / burn : null;
  const breakevenRevenue = (1 - variableRate) > 0 ? (input.fixedCosts + input.ownerDraw) / (1 - variableRate) : 0;
  const revenueGap = Math.max(0, breakevenRevenue - input.revenue);

  let status: RunwayResult['status'] = 'Cash positive';
  if (netMonthly < 0) {
    if (runwayMonths !== null && runwayMonths >= 12) status = 'Comfortable';
    else if (runwayMonths !== null && runwayMonths >= 6) status = 'Watch it';
    else if (runwayMonths !== null && runwayMonths >= 3) status = 'Act now';
    else status = 'Critical';
  }

  return {
    variableCost,
    contribution,
    netMonthly,
    burn,
    runwayMonths,
    breakevenRevenue,
    revenueGap,
    cash6mo: input.cash + netMonthly * 6,
    cash12mo: input.cash + netMonthly * 12,
    cashOutDate: runwayMonths === null ? null : addMonths(now, runwayMonths),
    status,
  };
}
