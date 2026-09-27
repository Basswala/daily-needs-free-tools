export interface ChurnInputs {
  /** Active client count */
  clients: number;
  /** Average monthly revenue per client ($) */
  revPerClient: number;
  /** Monthly churn rate percentage (e.g. 5 for 5%) */
  churnPct: number;
  /** Stated average client tenure in months (e.g. 18) */
  statedTenure: number;
  /** Gross profit margin percentage (e.g. 60 for 60%) */
  marginPct: number;
  /** Customer acquisition / replacement cost per client ($) */
  replacementCost: number;
}

export interface ChurnResult {
  monthlyRevenue: number;
  clientsLostPerMonth: number;
  annualRevenueLost: number;
  annualMarginLost: number;
  impliedTenure: number;
  clientsToReplacePerYear: number;
  replacementCostPerYear: number;
  impliedLifetimeValue: number;
  churnHalvedSavings: number;
  tenureGapPct: number;
  status: 'Healthy' | 'Watch It' | 'Losing Real Revenue' | 'The Business Is Shrinking';
}

/**
 * Calculates annual revenue and profit destroyed by monthly client churn,
 * and the cost to acquire replacements just to stay flat.
 */
export function computeChurn(input: ChurnInputs): ChurnResult {
  const rate = input.churnPct / 100;
  const monthlyRevenue = input.clients * input.revPerClient;
  const clientsLostPerMonth = input.clients * rate;
  const annualRevenueLost = clientsLostPerMonth * input.revPerClient * 12;
  const annualMarginLost = annualRevenueLost * (input.marginPct / 100);
  const impliedTenure = rate > 0 ? 1 / rate : 0;
  const clientsToReplacePerYear = clientsLostPerMonth * 12;
  const replacementCostPerYear = clientsToReplacePerYear * input.replacementCost;
  const impliedLifetimeValue = input.revPerClient * (input.marginPct / 100) * input.statedTenure;
  const churnHalvedSavings = annualRevenueLost / 2;
  const tenureGapPct = impliedTenure > 0 ? (Math.abs(input.statedTenure - impliedTenure) / impliedTenure) * 100 : 0;

  let status: ChurnResult['status'] = 'Healthy';
  if (input.churnPct > 10) status = 'The Business Is Shrinking';
  else if (input.churnPct > 6) status = 'Losing Real Revenue';
  else if (input.churnPct >= 3) status = 'Watch It';

  return {
    monthlyRevenue,
    clientsLostPerMonth,
    annualRevenueLost,
    annualMarginLost,
    impliedTenure,
    clientsToReplacePerYear,
    replacementCostPerYear,
    impliedLifetimeValue,
    churnHalvedSavings,
    tenureGapPct,
    status,
  };
}
