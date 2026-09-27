export interface AutomationRoiInputs {
  /** Weekly hours spent on repetitive support & customer tickets (e.g. 8) */
  weeklySupportHours: number;
  /** Weekly hours spent on store checks, ad sweeps, and inventory audits (e.g. 6) */
  weeklyOpsHours: number;
  /** Operator estimated hourly value / rate ($ e.g. 100) */
  hourlyRate: number;
}

export interface AutomationRoiResult {
  savedHoursWeek: number;
  savedHoursMonth: number;
  savedHoursYear: number;
  annualValueRecovered: number;
  monthlyValueRecovered: number;
}

/**
 * Calculates operator hours eliminated and annual dollar value recovered
 * by deploying deterministic automation loops.
 */
export function computeAutomationRoi(input: AutomationRoiInputs): AutomationRoiResult {
  // Proven efficiency gains: ~75% on support drafting & ~80% on routine ops sweeps
  const savedHoursWeek = input.weeklySupportHours * 0.75 + input.weeklyOpsHours * 0.8;
  const savedHoursMonth = Math.round(savedHoursWeek * 4.33);
  const savedHoursYear = savedHoursMonth * 12;
  const annualValueRecovered = Math.round(savedHoursYear * input.hourlyRate);
  const monthlyValueRecovered = Math.round(savedHoursMonth * input.hourlyRate);

  return {
    savedHoursWeek,
    savedHoursMonth,
    savedHoursYear,
    annualValueRecovered,
    monthlyValueRecovered,
  };
}
