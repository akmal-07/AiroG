/**
 * Domain types for AiroG — GenAI Air Quality Assistant for Indian Families.
 * Strict TypeScript without 'any'.
 */

export type CpcbBandKey =
  | 'Good'
  | 'Satisfactory'
  | 'Moderate'
  | 'Poor'
  | 'Very Poor'
  | 'Severe';

export interface AqiBandInfo {
  readonly key: CpcbBandKey;
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly rangeText: string;
  readonly colorHex: string;
  readonly badgeBg: string;
  readonly badgeText: string;
  readonly badgeBorder: string;
  readonly dotColor: string;
  readonly healthAdvisory: string;
}

export interface ForecastHour {
  readonly time: string;
  readonly aqi: number;
  readonly pm25?: number;
  readonly pm10?: number;
}

export interface OutdoorWindowInfo {
  readonly startHour: string;
  readonly endHour: string;
  readonly windowText: string;
  readonly averageAqi: number;
  readonly category: CpcbBandKey;
  readonly peakHour: string;
  readonly peakAqi: number;
  readonly peakCategory: CpcbBandKey;
}

export interface AqiPollutants {
  readonly pm25?: number;
  readonly pm10?: number;
  readonly no2?: number;
  readonly o3?: number;
  readonly co?: number;
  readonly so2?: number;
}

export interface AqiReading {
  readonly city: string;
  readonly aqi: number;
  readonly pm25?: number;
  readonly pm10?: number;
  readonly category: CpcbBandKey;
  readonly updatedAt: string;
  readonly forecast?: readonly ForecastHour[];
  readonly isDemo?: boolean;
  readonly pollutants?: AqiPollutants;
}

export interface AqiFetchResult {
  readonly reading: AqiReading;
  readonly bestWindow: OutdoorWindowInfo;
  readonly isDemo: boolean;
}

export interface Household {
  readonly adults: number;
  readonly children: number;
  readonly elders: number;
  readonly hasAsthma: boolean;
  readonly hasPurifier: boolean;
}

export type PlanCategory = 'routines' | 'indoor hacks' | 'greener alternatives';

export type ImpactLevel = 'High' | 'Medium' | 'Low' | 'Comfort';

export interface ItemImpact {
  readonly level: ImpactLevel;
  readonly line: string;
  readonly ruleTrace: string;
}

export interface PlanItem {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly impact: string;
  readonly category: PlanCategory;
  readonly computedImpact?: ItemImpact;
}

export interface DayImpactSummary {
  readonly exposureScore: number; // 0–100 deterministic scale
  readonly headline: string; // One sentence plain words summary derived from AQI band + household
  readonly methodLine: string; // Explicit methodology line
  readonly riskCategory: 'Minimal' | 'Moderate' | 'Elevated' | 'High' | 'Severe';
}

export interface DayPlan {
  readonly date: string;
  readonly city: string;
  readonly aqi: number;
  readonly items: readonly PlanItem[];
  readonly planType: 'ai-generated' | 'standard plan';
  readonly isFallback: boolean;
  readonly summary?: DayImpactSummary;
}

export interface PlanRequestBody {
  readonly city: string;
  readonly aqi: number;
  readonly pm25?: number;
  readonly pm10?: number;
  readonly category: CpcbBandKey;
  readonly bestWindow: OutdoorWindowInfo;
  readonly peak: {
    readonly hour: string;
    readonly aqi: number;
  };
  readonly household: Household;
}

export interface StorageStateV1 {
  readonly version: 1;
  readonly household: Household;
  readonly updatedAt: string;
}
