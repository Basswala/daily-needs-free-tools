export interface RopInputs {
  /** Average daily sales volume (units) */
  avgDaily: number;
  /** Supplier lead time in days */
  leadTimeDays: number;
  /** Standard deviation / supplier variance in days */
  leadTimeStdDev: number;
  /** Target service level percentage (e.g. 90, 95, 98, 99) */
  serviceLevel: 90 | 95 | 98 | 99;
  /** Current stock on hand (units) */
  onHand: number;
  /** Stock currently on order / in transit (units) */
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

const SERVICE_Z: Record<number, number> = {
  90: 1.28,
  95: 1.645,
  98: 2.05,
  99: 2.33,
};

const STATUS: Record<RopResult['statusKey'], string> = {
  overstock: 'Overstocked (>150% ROP)',
  healthy: 'Healthy stock level',
  reorder: 'Reorder point reached',
  risk: 'Stockout risk (below safety buffer)',
};

/**
 * Calculates statistical safety stock, dynamic reorder point (ROP),
 * and days of inventory cover.
 */
export function computeRop(input: RopInputs): RopResult {
  const avgDaily = Math.max(0.1, input.avgDaily);
  const leadTimeDays = Math.max(0, input.leadTimeDays);
  const leadTimeStdDev = Math.max(0, input.leadTimeStdDev);
  const z = SERVICE_Z[input.serviceLevel] ?? SERVICE_Z[95];

  const leadTimeDemand = avgDaily * leadTimeDays;
  const safetyStock = Math.ceil(z * avgDaily * leadTimeStdDev);
  const reorderPoint = Math.ceil(leadTimeDemand + safetyStock);
  const projectedStock = Math.max(0, input.onHand) + Math.max(0, input.onOrder);

  const daysOfCover = Math.max(0, input.onHand) / avgDaily;
  const newProjectedStock = projectedStock + reorderPoint;
  const newDaysOfCover = newProjectedStock / avgDaily;

  const atRisk = projectedStock - safetyStock < leadTimeDemand;

  let statusKey: RopResult['statusKey'];
  if (projectedStock > reorderPoint * 1.5) statusKey = 'overstock';
  else if (projectedStock >= reorderPoint) statusKey = 'healthy';
  else if (projectedStock >= safetyStock) statusKey = 'reorder';
  else statusKey = 'risk';

  return {
    z,
    serviceLevel: input.serviceLevel,
    leadTimeDemand,
    safetyStock,
    reorderPoint,
    projectedStock,
    daysOfCover,
    newProjectedStock,
    newDaysOfCover,
    atRisk,
    unitGap: reorderPoint - projectedStock,
    status: STATUS[statusKey],
    statusKey,
  };
}
