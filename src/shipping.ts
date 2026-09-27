export interface ShippingInputs {
  /** Average Order Value ($) */
  aov: number;
  /** Actual shipping & carrier cost per order ($) */
  shippingCost: number;
  /** COGS as a percentage of revenue (e.g. 35 for 35%) */
  cogsPct: number;
  /** Gateway payment processing fee percentage (e.g. 2.9 for 2.9%) */
  paymentPct: number;
  /** Estimated or actual orders per month */
  ordersPerMonth: number;
  /** Current free shipping threshold ($) */
  threshold?: number;
}

export interface ShippingResult {
  variableCostRate: number;
  contributionRate: number;
  contributionPerOrder: number;
  breakEvenOrderValue: number;
  monthlyShippingCost: number;
  monthlyRevenue: number;
  shippingAsPctOfRevenue: number;
  averageMarginPerOrder: number;
  marginIfChargedAtCost: number;
  aovForOnePctShipping: number;
  perTenPercentSubsidy: number;
  threshold: number;
  verdict: 'Shipping is not your leak' | 'Material but manageable' | 'Shipping is eating your margin';
}

const TARGET_SHIPPING_PCT = 0.01;
const SUBSIDY_STEP = 0.1;
const BAND_EPSILON = 1e-9;

/**
 * Calculates the exact order value where free shipping stops eroding margin,
 * and benchmarks shipping cost as a percentage of revenue.
 */
export function computeShipping(input: ShippingInputs): ShippingResult {
  const threshold = input.threshold ?? input.aov;
  const variableCostRate = (input.cogsPct + input.paymentPct) / 100;
  const contributionRate = 1 - variableCostRate;
  const contributionPerOrder = input.aov * contributionRate;
  const breakEvenOrderValue = contributionRate > 0 ? input.shippingCost / contributionRate : 0;
  const monthlyShippingCost = input.shippingCost * input.ordersPerMonth;
  const monthlyRevenue = input.aov * input.ordersPerMonth;
  const shippingAsPctOfRevenue = monthlyRevenue > 0 ? (monthlyShippingCost / monthlyRevenue) * 100 : 0;
  const averageMarginPerOrder = contributionPerOrder - input.shippingCost;
  const marginIfChargedAtCost = contributionPerOrder;
  const aovForOnePctShipping = input.shippingCost / TARGET_SHIPPING_PCT;
  const perTenPercentSubsidy = input.shippingCost * input.ordersPerMonth * SUBSIDY_STEP;

  let verdict: ShippingResult['verdict'] = 'Shipping is not your leak';
  if (shippingAsPctOfRevenue > 12 + BAND_EPSILON) {
    verdict = 'Shipping is eating your margin';
  } else if (shippingAsPctOfRevenue >= 6 - BAND_EPSILON) {
    verdict = 'Material but manageable';
  }

  return {
    variableCostRate,
    contributionRate,
    contributionPerOrder,
    breakEvenOrderValue,
    monthlyShippingCost,
    monthlyRevenue,
    shippingAsPctOfRevenue,
    averageMarginPerOrder,
    marginIfChargedAtCost,
    aovForOnePctShipping,
    perTenPercentSubsidy,
    threshold,
    verdict,
  };
}
