export interface FatigueInputs {
  /** Ad spend ($) */
  spend: number;
  /** Total impressions */
  impressions: number;
  /** Unique reach */
  reach: number;
  /** Total clicks */
  clicks: number;
  /** Total conversions */
  conversions: number;
  /** Age of creative in weeks */
  ageWeeks: number;
  /** Frequency threshold per week where ad fatigue sets in (e.g. 2.5) */
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

const WEEKS_PER_MONTH = 4.33;

function creativeAgeBand(weeks: number): string {
  if (weeks < 2) return 'Fresh';
  if (weeks <= 4) return 'Settling';
  if (weeks <= 8) return 'Fatiguing';
  return 'Almost certainly burned';
}

/**
 * Calculates ad frequency velocity and projects how many weeks remain until
 * creative fatigue causes audience burnout.
 */
export function computeFatigue(input: FatigueInputs): FatigueResult {
  const frequency = input.reach > 0 ? input.impressions / input.reach : 0;
  const frequencyPerWeek = frequency / WEEKS_PER_MONTH;

  const ctr = input.impressions > 0 ? (input.clicks / input.impressions) * 100 : 0;
  const conversionRate = input.clicks > 0 ? (input.conversions / input.clicks) * 100 : 0;
  const cpm = input.impressions > 0 ? (input.spend / input.impressions) * 1000 : 0;
  const costPerClick = input.clicks > 0 ? input.spend / input.clicks : 0;
  const costPerConversion = input.conversions > 0 ? input.spend / input.conversions : 0;

  let weeksToCrossover: number | null = null;
  if (frequencyPerWeek > 0) {
    weeksToCrossover =
      frequencyPerWeek >= input.threshold
        ? 0
        : (input.threshold - frequencyPerWeek) / (frequencyPerWeek / WEEKS_PER_MONTH);
  }

  const ageBand = creativeAgeBand(input.ageWeeks);

  let verdict: FatigueResult['verdict'] = 'unlikely';
  if (frequencyPerWeek >= input.threshold && (ageBand === 'Fatiguing' || ageBand === 'Almost certainly burned')) {
    verdict = 'fatigued';
  } else if (frequencyPerWeek >= input.threshold * 0.8) {
    verdict = 'borderline';
  }

  return {
    frequency,
    frequencyPerWeek,
    ctr,
    conversionRate,
    cpm,
    costPerClick,
    costPerConversion,
    weeksToCrossover,
    ageBand,
    verdict,
  };
}
