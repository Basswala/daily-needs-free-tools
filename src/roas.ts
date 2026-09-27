export interface RoasInputs {
  /** Average Order Value ($) */
  aov: number;
  /** Product Cost / COGS per order ($) */
  cogs: number;
  /** Pick, pack, and shipping cost per order ($) */
  shipping: number;
  /** Gateway fee percentage (e.g. 2.9 for 2.9%) */
  feePct: number;
  /** Fixed gateway fee per transaction ($ e.g. 0.30) */
  feeFixed: number;
  /** Target net profit margin percentage (e.g. 20 for 20%) */
  targetMarginPct: number;
}

export interface RoasResult {
  paymentFee: number;
  totalUnitCost: number;
  contributionMarginDollars: number;
  contributionMarginPct: number;
  maxCac: number;
  breakevenRoas: number;
  targetProfitDollars: number;
  targetMaxCac: number;
  targetRoas: number;
}

/**
 * Calculates exact Break-Even ROAS, Target ROAS, and Maximum Allowable CAC
 * based on real unit economics rather than ad-platform reported vanity numbers.
 */
export function computeRoas(input: RoasInputs): RoasResult {
  const feePctRate = input.feePct / 100;
  const targetMarginRate = input.targetMarginPct / 100;

  const paymentFee = input.aov * feePctRate + input.feeFixed;
  const totalUnitCost = input.cogs + input.shipping + paymentFee;
  const contributionMarginDollars = input.aov - totalUnitCost;
  const contributionMarginPct = input.aov > 0 ? (contributionMarginDollars / input.aov) * 100 : 0;
  const maxCac = Math.max(0, contributionMarginDollars);
  const breakevenRoas = maxCac > 0 ? input.aov / maxCac : 999;
  const targetProfitDollars = input.aov * targetMarginRate;
  const targetMaxCac = Math.max(0.01, contributionMarginDollars - targetProfitDollars);
  const targetRoas = targetMaxCac > 0 ? input.aov / targetMaxCac : 999;

  return {
    paymentFee,
    totalUnitCost,
    contributionMarginDollars,
    contributionMarginPct,
    maxCac,
    breakevenRoas,
    targetProfitDollars,
    targetMaxCac,
    targetRoas,
  };
}
