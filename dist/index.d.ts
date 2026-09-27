export interface RoasInputs {
  aov: number;
  cogs: number;
  shipping: number;
  feePct: number;
  feeFixed: number;
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
export declare function computeRoas(input: RoasInputs): RoasResult;

export interface ShippingInputs {
  aov: number;
  shippingCost: number;
  cogsPct: number;
  paymentPct: number;
  ordersPerMonth: number;
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
export declare function computeShipping(input: ShippingInputs): ShippingResult;

export interface DiscountInputs {
  price: number;
  cogs: number;
  shipping: number;
  paymentPct: number;
  discountPct: number;
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
export declare function computeDiscountDepth(input: DiscountInputs): DiscountResult;

export interface LtvInputs {
  aov: number;
  marginPct: number;
  ordersPerCustomer: number;
  ordersPerMonth: number;
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
export declare function computeLtv(input: LtvInputs): LtvResult;

export interface FatigueInputs {
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  conversions: number;
  ageWeeks: number;
  threshold: number;
}
export interface FatigueResult {
  frequency: number;
  frequencyPerWeek: number;
  ctr: number;
  conversionRate: number;
  cpm: number;
  costPerClick: number;
  costPerConversion: number;
  weeksToCrossover: number | null;
  ageBand: string;
  verdict: 'fatigued' | 'unlikely' | 'borderline';
}
export declare function computeFatigue(input: FatigueInputs): FatigueResult;

export interface RunwayInputs {
  cash: number;
  revenue: number;
  variableCostPct: number;
  fixedCosts: number;
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
export declare function computeCashRunway(input: RunwayInputs, now?: Date): RunwayResult;

export interface RopInputs {
  avgDaily: number;
  leadTimeDays: number;
  leadTimeStdDev: number;
  serviceLevel: 90 | 95 | 98 | 99;
  onHand: number;
  onOrder: number;
}
export interface RopResult {
  z: number;
  serviceLevel: number;
  leadTimeDemand: number;
  safetyStock: number;
  reorderPoint: number;
  projectedStock: number;
  daysOfCover: number;
  newProjectedStock: number;
  newDaysOfCover: number;
  atRisk: boolean;
  unitGap: number;
  status: string;
  statusKey: 'overstock' | 'healthy' | 'reorder' | 'risk';
}
export declare function computeRop(input: RopInputs): RopResult;

export interface AutomationRoiInputs {
  weeklySupportHours: number;
  weeklyOpsHours: number;
  hourlyRate: number;
}
export interface AutomationRoiResult {
  savedHoursWeek: number;
  savedHoursMonth: number;
  savedHoursYear: number;
  annualValueRecovered: number;
  monthlyValueRecovered: number;
}
export declare function computeAutomationRoi(input: AutomationRoiInputs): AutomationRoiResult;

export interface EffectiveRateInputs {
  fee: number;
  actualHours: number;
  billedHours: number;
  costPerHour: number;
  targetMarginPct: number;
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
export declare function computeEffectiveRate(input: EffectiveRateInputs): EffectiveRateResult;

export interface ChurnInputs {
  clients: number;
  revPerClient: number;
  churnPct: number;
  statedTenure: number;
  marginPct: number;
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
export declare function computeChurn(input: ChurnInputs): ChurnResult;

export interface UtmInputs {
  url: string;
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
}
export declare function buildUtmUrl(input: UtmInputs): string;

export type Platform =
  | 'pure'
  | 'linkedin'
  | 'twitter'
  | 'facebook'
  | 'threads'
  | 'instagram'
  | 'tiktok'
  | 'whatsapp';
export interface CleanOptions {
  platform?: Platform;
  stripPreambles?: boolean;
  stripInvisibleUnicode?: boolean;
  cleanMultipleSpaces?: boolean;
  formatBullets?: boolean;
  collapseDeadSpace?: boolean;
  convertUnicodeBold?: boolean;
}
export interface CleanResult {
  text: string;
  stats: {
    invisibleCharactersRemoved: number;
    preamblesStripped: number;
    linesSaved: number;
  };
}
export declare function cleanAiContent(raw: string, options?: CleanOptions): CleanResult;
