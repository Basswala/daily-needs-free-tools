export interface DiscountInputs {
  /** Full retail price ($) */
  price: number;
  /** Product COGS ($) */
  cogs: number;
  /** Shipping & packaging cost per order ($) */
  shipping: number;
  /** Gateway fee percentage (e.g. 2.9 for 2.9%) */
  paymentPct: number;
  /** Proposed discount percentage (e.g. 20 for 20%) */
  discountPct: number;
  /** Monthly volume in units sold */
  unitsSold: number;
}

export interface DiscountLadderRow {
  discount: number;
  priceCharged: number;
  contribution: number;
  vsFullPrice: number;
}

export interface DiscountResult {
  variableRate: number;
  fullPriceContribution: number;
  discountedPrice: number;
  discountedContribution: number;
  marginPerOrderLost: number;
  maxDiscountPct: number;
  monthlyMarginNow: number;
  monthlyMarginAtFullPrice: number;
  monthlyMarginLost: number;
  extraUnitsToBreakEven: number | null;
  verdict: 'ok' | 'tight' | 'lose';
  ladder: DiscountLadderRow[];
}

const DEFAULT_LADDER = [5, 10, 15, 20, 25, 30, 40, 50];
const TIGHT_THRESHOLD = 0.75;

/**
 * Calculates the deepest discount an order can carry before turning negative,
 * and the additional unit volume required to recover lost margin.
 */
export function computeDiscountDepth(input: DiscountInputs): DiscountResult {
  const variableRate = input.paymentPct / 100;
  const fullPriceRevenue = input.price;
  const fullPriceCost = input.cogs + input.shipping;
  const fullPriceContribution = fullPriceRevenue * (1 - variableRate) - fullPriceCost;

  const discountedPrice = input.price * (1 - input.discountPct / 100);
  const discountedContribution = discountedPrice * (1 - variableRate) - fullPriceCost;
  const marginPerOrderLost = fullPriceContribution - discountedContribution;

  const netOfFees = input.price * (1 - variableRate);
  const rawMaxDiscountPct = netOfFees > 0 ? (1 - fullPriceCost / netOfFees) * 100 : 0;
  const maxDiscountPct = Math.max(0, rawMaxDiscountPct);

  const monthlyMarginNow = discountedContribution * input.unitsSold;
  const monthlyMarginAtFullPrice = fullPriceContribution * input.unitsSold;
  const monthlyMarginLost = monthlyMarginAtFullPrice - monthlyMarginNow;

  const volumeCanRecover = discountedContribution > 0;
  const extraUnitsToBreakEven = volumeCanRecover
    ? Math.max(0, Math.ceil(monthlyMarginLost / discountedContribution))
    : null;

  const verdict: DiscountResult['verdict'] =
    input.discountPct >= maxDiscountPct
      ? 'lose'
      : input.discountPct > TIGHT_THRESHOLD * maxDiscountPct
        ? 'tight'
        : 'ok';

  const ladder: DiscountLadderRow[] = DEFAULT_LADDER.map((d) => {
    const priceCharged = input.price * (1 - d / 100);
    const contribution = priceCharged * (1 - variableRate) - fullPriceCost;
    return {
      discount: d,
      priceCharged,
      contribution,
      vsFullPrice: contribution - fullPriceContribution,
    };
  });

  return {
    variableRate,
    fullPriceContribution,
    discountedPrice,
    discountedContribution,
    marginPerOrderLost,
    maxDiscountPct,
    monthlyMarginNow,
    monthlyMarginAtFullPrice,
    monthlyMarginLost,
    extraUnitsToBreakEven,
    verdict,
    ladder,
  };
}
