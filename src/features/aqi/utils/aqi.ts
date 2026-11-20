import type { AqiBandInfo } from '@/types';

/**
 * Standard CPCB (Central Pollution Control Board, India) AQI Bands.
 * Strictly 0-500 scale with 6 distinct bands.
 * Each band pairs an identifiable color indicator with high-contrast text and explicit label.
 */
export const CPCB_BANDS: readonly AqiBandInfo[] = [
  {
    key: 'Good',
    label: 'Good',
    min: 0,
    max: 50,
    rangeText: '0–50',
    colorHex: '#00b050',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-900',
    badgeBorder: 'border-emerald-300',
    dotColor: 'bg-emerald-600',
    healthAdvisory: 'Minimal health impact; clean and safe air for outdoor activities.',
  },
  {
    key: 'Satisfactory',
    label: 'Satisfactory',
    min: 51,
    max: 100,
    rangeText: '51–100',
    colorHex: '#92d050',
    badgeBg: 'bg-lime-50',
    badgeText: 'text-lime-950',
    badgeBorder: 'border-lime-300',
    dotColor: 'bg-lime-600',
    healthAdvisory: 'Minor breathing discomfort to sensitive people; generally acceptable.',
  },
  {
    key: 'Moderate',
    label: 'Moderate',
    min: 101,
    max: 200,
    rangeText: '101–200',
    colorHex: '#eab308',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-950',
    badgeBorder: 'border-amber-300',
    dotColor: 'bg-amber-500',
    healthAdvisory: 'Breathing discomfort to people with lungs, asthma, and heart diseases.',
  },
  {
    key: 'Poor',
    label: 'Poor',
    min: 201,
    max: 300,
    rangeText: '201–300',
    colorHex: '#ff9900',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-950',
    badgeBorder: 'border-orange-300',
    dotColor: 'bg-orange-600',
    healthAdvisory: 'Breathing discomfort to most people on prolonged exposure.',
  },
  {
    key: 'Very Poor',
    label: 'Very Poor',
    min: 301,
    max: 400,
    rangeText: '301–400',
    colorHex: '#ff0000',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-950',
    badgeBorder: 'border-rose-300',
    dotColor: 'bg-rose-600',
    healthAdvisory: 'Respiratory illness on prolonged exposure; severe effect on sensitive groups.',
  },
  {
    key: 'Severe',
    label: 'Severe',
    min: 401,
    max: 500,
    rangeText: '401–500+',
    colorHex: '#c00000',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-950',
    badgeBorder: 'border-red-400',
    dotColor: 'bg-red-900',
    healthAdvisory: 'Affects healthy people and seriously impacts those with existing diseases.',
  },
] as const;

/**
 * Deterministically computes the CPCB AQI band for any numeric AQI.
 * Handles fractional numbers (rounding) and clamps extreme or boundary values.
 */
export function getAqiBand(aqi: number): AqiBandInfo {
  const rounded = Math.round(Number.isFinite(aqi) ? Math.max(0, aqi) : 0);

  if (rounded <= 50) return CPCB_BANDS[0]!;
  if (rounded <= 100) return CPCB_BANDS[1]!;
  if (rounded <= 200) return CPCB_BANDS[2]!;
  if (rounded <= 300) return CPCB_BANDS[3]!;
  if (rounded <= 400) return CPCB_BANDS[4]!;
  return CPCB_BANDS[5]!;
}

// CPCB official pollutant concentration breakpoint definitions
interface Breakpoint {
  readonly bLo: number;
  readonly bHi: number;
  readonly iLo: number;
  readonly iHi: number;
}

const PM25_BREAKPOINTS: readonly Breakpoint[] = [
  { bLo: 0, bHi: 30, iLo: 0, iHi: 50 },
  { bLo: 31, bHi: 60, iLo: 51, iHi: 100 },
  { bLo: 61, bHi: 90, iLo: 101, iHi: 200 },
  { bLo: 91, bHi: 120, iLo: 201, iHi: 300 },
  { bLo: 121, bHi: 250, iLo: 301, iHi: 400 },
  { bLo: 251, bHi: 380, iLo: 401, iHi: 500 },
];

const PM10_BREAKPOINTS: readonly Breakpoint[] = [
  { bLo: 0, bHi: 50, iLo: 0, iHi: 50 },
  { bLo: 51, bHi: 100, iLo: 51, iHi: 100 },
  { bLo: 101, bHi: 250, iLo: 101, iHi: 200 },
  { bLo: 251, bHi: 350, iLo: 201, iHi: 300 },
  { bLo: 351, bHi: 430, iLo: 301, iHi: 400 },
  { bLo: 431, bHi: 510, iLo: 401, iHi: 500 },
];

/**
 * Calculates sub-index for a single pollutant based on CPCB linear interpolation formula:
 * Ip = ((Ihi - Ilo) / (Bhi - Blo)) * (Cp - Blo) + Ilo
 */
function calculateSubIndex(concentration: number, breakpoints: readonly Breakpoint[]): number {
  if (concentration < 0 || !Number.isFinite(concentration)) return 0;

  for (const bp of breakpoints) {
    if (concentration >= bp.bLo && concentration <= bp.bHi) {
      const slope = (bp.iHi - bp.iLo) / (bp.bHi - bp.bLo);
      return Math.round(slope * (concentration - bp.bLo) + bp.iLo);
    }
  }

  // Concentration exceeds highest breakpoint (Severe / Off the scale)
  const last = breakpoints[breakpoints.length - 1]!;
  if (concentration > last.bHi) {
    const slope = (last.iHi - last.iLo) / (last.bHi - last.bLo);
    const extrapolated = Math.round(slope * (concentration - last.bLo) + last.iLo);
    return Math.min(500, Math.max(401, extrapolated));
  }

  return 0;
}

/**
 * Deterministically computes overall CPCB AQI from PM2.5 and PM10 concentrations (ug/m3).
 * Never uses OpenWeather's 1-5 scale. CPCB NAQI considers the maximum sub-index of key pollutants.
 */
export function calculateCpcbAqi(pm25?: number, pm10?: number): number {
  let subPm25 = 0;
  let subPm10 = 0;

  if (typeof pm25 === 'number' && Number.isFinite(pm25) && pm25 >= 0) {
    subPm25 = calculateSubIndex(pm25, PM25_BREAKPOINTS);
  }

  if (typeof pm10 === 'number' && Number.isFinite(pm10) && pm10 >= 0) {
    subPm10 = calculateSubIndex(pm10, PM10_BREAKPOINTS);
  }

  const overall = Math.max(subPm25, subPm10);
  return overall > 0 ? overall : 0;
}

// Re-export forecast windowing logic from specialized modular sub-utility
export { formatTimeLabel, findBestOutdoorWindow } from './forecastWindow';
