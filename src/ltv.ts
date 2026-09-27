export interface LtvInputs {
  /** Average Order Value ($) */
  aov: number;
  /** Gross Margin Percentage (e.g. 60 for 60%) */
  marginPct: number;
  /** Average orders per customer lifetime (e.g. 2.4) */
  ordersPerCustomer: number;
  /** Average orders per month per customer (e.g. 0.6) */
  ordersPerMonth: number;
  /** Blended Customer Acquisition Cost ($) */
  cac: number;
}

export interface LtvResult {
  contributionPerOrder: number;
  ltv: number;
  ratio: number;
  paybackOrders: number;
  paybackMonths: number;
  monthlyContribution: number;
  monthsToRecover: number;
  status: 'Healthy' | 'Moderate' | 'Unsustainable';
}

/**
 * Computes Customer Lifetime Value, LTV:CAC Ratio, and Payback Velocity in months.
 */
export function computeLtv(input: LtvInputs): LtvResult {
  const contributionPerOrder = (input.aov * input.marginPct) / 100;
  const ltv = contributionPerOrder * input.ordersPerCustomer;
  const ratio = input.cac > 0 ? ltv / input.cac : 0;
  const paybackOrders = contributionPerOrder > 0 ? input.cac / contributionPerOrder : 0;
  const paybackMonths = input.ordersPerMonth > 0 ? paybackOrders / input.ordersPerMonth : 0;
  const monthlyContribution = contributionPerOrder * input.ordersPerMonth;
  const monthsToRecover = monthlyContribution > 0 ? input.cac / monthlyContribution : 0;

  let status: LtvResult['status'] = 'Healthy';
  if (ratio < 2) {
    status = 'Unsustainable';
  } else if (ratio < 3) {
    status = 'Moderate';
  }

  return {
    contributionPerOrder,
    ltv,
    ratio,
    paybackOrders,
    paybackMonths,
    monthlyContribution,
    monthsToRecover,
    status,
  };
}
