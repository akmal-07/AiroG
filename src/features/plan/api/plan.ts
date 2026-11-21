import { z } from 'zod';
import type { DayPlan, PlanItem, PlanRequestBody } from '@/types';

/**
 * Strict Zod validation schemas for AI-generated and fallback daily plans.
 */
export const PlanCategorySchema = z.preprocess(
  (val) => (typeof val === 'string' ? val.trim().toLowerCase() : val),
  z.enum(['routines', 'indoor hacks', 'greener alternatives'])
);

export const PlanItemSchema = z.object({
  id: z
    .unknown()
    .optional()
    .transform((v) => (typeof v === 'string' && v.trim() ? v.trim() : Math.random().toString(36).substring(2, 9))),
  title: z.string().min(1, 'Title is required'),
  detail: z.string().min(1, 'Detail is required'),
  impact: z.string().min(1, 'Impact description is required'),
  category: PlanCategorySchema,
});

export const PlanResponseSchema = z.object({
  items: z.array(PlanItemSchema).min(1, 'Must provide at least 1 item'),
});

/**
 * In-memory 5-minute plan cache to eliminate duplicate AI generation latency.
 * Capped at 30 entries (FIFO eviction).
 * ONLY caches successful AI-tailored plans (never caches fallback standard plans).
 */
interface CachedPlan {
  readonly plan: DayPlan;
  readonly timestamp: number;
}

const PLAN_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_ENTRIES = 30;
const planCache = new Map<string, CachedPlan>();

export function clearPlanCache(): void {
  planCache.clear();
}

export function createPlanCacheKey(req: PlanRequestBody): string {
  const normCity = req.city.trim().toLowerCase();
  const h = req.household;
  const householdKey = `${h.adults}_${h.children}_${h.elders}_${h.hasAsthma ? 1 : 0}_${h.hasPurifier ? 1 : 0}`;
  const windowKey = req.bestWindow.windowText.trim().toLowerCase();
  const catKey = req.category.trim().toLowerCase();
  return `${normCity}|${req.aqi}|${catKey}|${windowKey}|${householdKey}`;
}

/**
 * Deterministically generates a sensible, rule-based day plan tailored to:
 * - CPCB AQI band
 * - Household demographics (kids, elders, asthma, air purifier)
 * - Best outdoor window and peak smog hour
 *
 * Labeled "standard plan" (not AI-generated). Zero AI hallucination.
 */
export function generateRuleBasedPlan(req: PlanRequestBody): DayPlan {
  const { city, aqi, category, bestWindow, peak, household } = req;
  const items: PlanItem[] = [];

  const isSevereOrVeryPoor = category === 'Very Poor' || category === 'Severe';
  const isPoorOrWorse = isSevereOrVeryPoor || category === 'Poor';

  // 1. ROUTINES
  // Rule A: Outdoor Window Scheduling
  items.push({
    id: 'rb-routine-outdoor',
    title: 'Align Outdoor Activity to Best Window',
    detail: `Schedule any essential grocery runs or outdoor tasks strictly between ${bestWindow.windowText}, when smog dips to around ${bestWindow.averageAqi} AQI.`,
    impact: 'Avoids heavy ambient particulate inhalation by shifting exertion to the day’s lowest pollution dip.',
    category: 'routines',
  });

  // Rule B: Window Ventilation Timing
  if (isPoorOrWorse) {
    items.push({
      id: 'rb-routine-windows',
      title: 'Keep Windows Sealed During Peak Smog',
      detail: `Keep external doors and windows sealed tight, particularly around peak smog at ${peak.hour} and during early morning inversion hours.`,
      impact: 'Prevents toxic outdoor particulate plumes from penetrating and lingering in living quarters.',
      category: 'routines',
    });
  } else {
    items.push({
      id: 'rb-routine-windows-mod',
      title: 'Ventilate During Clean Afternoon Window',
      detail: `Open cross-ventilation windows briefly between ${bestWindow.windowText} to refresh indoor air while outdoor pollutants are lowest.`,
      impact: 'Allows stale indoor air to flush out without introducing heavy roadway particulate matter.',
      category: 'routines',
    });
  }

  // Rule C: Vulnerable Members (Children & Elders)
  if (household.children > 0 || household.elders > 0) {
    items.push({
      id: 'rb-routine-vulnerable',
      title: 'Protect Children and Elders Indoors',
      detail: `Keep children and elderly family members indoors during morning exercise hours and evening transit peaks, substituting outdoor playtime with indoor games.`,
      impact: 'Shields developing lungs and cardiovascular systems from acute particulate-induced inflammation.',
      category: 'routines',
    });
  }

  // 2. INDOOR HACKS
  // Rule D: Air Purifier vs Clean Room
  if (household.hasPurifier) {
    items.push({
      id: 'rb-indoor-purifier',
      title: 'Run HEPA Purifier on Continuous Auto/High',
      detail: `Place the purifier centrally in the family room during the day and move it to bedrooms overnight with doors and windows closed.`,
      impact: 'Continuously scrubs airborne microscopic particles, maintaining safe indoor air quality throughout the night.',
      category: 'indoor hacks',
    });
  } else {
    items.push({
      id: 'rb-indoor-barrier',
      title: 'Create a Clean Isolation Rest Zone',
      detail: `Designate the least drafty bedroom as a family safe room; seal window gaps with damp towels or masking tape to minimize drafts.`,
      impact: 'Creates a low-infiltration resting sanctuary that reduces baseline particulate exposure during sleep.',
      category: 'indoor hacks',
    });
  }

  // Rule E: Asthma Management
  if (household.hasAsthma) {
    items.push({
      id: 'rb-indoor-asthma',
      title: 'Prepare Rescue Medication and Masking',
      detail: `Keep prescribed rescue inhalers readily accessible at room temperature and wear a snug-fitting N95 mask if stepping out or opening external doors.`,
      impact: 'Prevents sudden bronchial spasms caused by cold, particulate-laden winter smog.',
      category: 'indoor hacks',
    });
  } else {
    // Rule F: Wet Mopping (dust suppression)
    items.push({
      id: 'rb-indoor-mopping',
      title: 'Switch from Dry Sweeping to Wet Mopping',
      detail: `Clean tiled and hardwood floors using a damp microfiber mop instead of a traditional broom to avoid stirring settled dust back into breathing zones.`,
      impact: 'Prevents settled fine particles from being resuspended into the indoor air volume.',
      category: 'indoor hacks',
    });
  }

  // 3. GREENER ALTERNATIVES
  // Rule G: Transport mode shift
  items.push({
    id: 'rb-green-transit',
    title: 'Choose Enclosed Metro or Shared Transit',
    detail: `Avoid open two-wheelers and auto-rickshaws along congested corridors; take the metro, an electric bus, or carpool with windows rolled up.`,
    impact: 'Protects commuters from direct vehicle exhaust plumes and cuts overall vehicular emissions.',
    category: 'greener alternatives',
  });

  // Rule H: Zero Domestic Burning
  items.push({
    id: 'rb-green-burning',
    title: 'Eliminate Indoor Smoke and Backyard Burning',
    detail: `Avoid burning garden leaves or waste, and refrain from lighting mosquito coils, agarbatti, or open flame room heaters today.`,
    impact: 'Prevents dangerous spikes of indoor carbon monoxide, volatile organics, and fine particulates.',
    category: 'greener alternatives',
  });

  const finalItems = items.slice(0, 8);

  return {
    date: new Date().toISOString().split('T')[0] ?? 'Today',
    city,
    aqi,
    items: finalItems,
    planType: 'standard plan',
    isFallback: true,
  };
}

const CLIENT_PLAN_TIMEOUT_MS = 28_000;

/**
 * Calls /api/plan to generate an AI plan.
 * Validates output against Zod schema.
 * Caches successful AI plans in memory for 5 minutes (0ms return on cache hit).
 * Retries once if AI output is malformed or invalid.
 * Falls back to deterministic rule-based plan if proxy is unavailable or validation fails twice.
 */
export async function fetchDayPlan(req: PlanRequestBody, signal?: AbortSignal): Promise<DayPlan> {
  const cacheKey = createPlanCacheKey(req);
  const cached = planCache.get(cacheKey);

  if (cached) {
    if (Date.now() - cached.timestamp < PLAN_CACHE_TTL_MS) {
      return cached.plan;
    }
    planCache.delete(cacheKey);
  }

  const tryFetchFromApi = async (): Promise<PlanItem[] | null> => {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CLIENT_PLAN_TIMEOUT_MS);
    if (signal) {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
        signal: controller.signal,
      });

      if (!res.ok) {
        return null;
      }

      const rawJson = (await res.json()) as unknown;
      const parseResult = PlanResponseSchema.safeParse(rawJson);

      if (parseResult.success) {
        return parseResult.data.items;
      }

      return null;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError' && signal?.aborted) throw err;
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  // Attempt 1
  let items: PlanItem[] | null = null;
  try {
    items = await tryFetchFromApi();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError' && signal?.aborted) throw err;
  }

  // Retry once if failed or invalid shape
  if (!items && !signal?.aborted) {
    try {
      items = await tryFetchFromApi();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError' && signal?.aborted) throw err;
    }
  }

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  // If valid AI items received after retry (accepting at least 1 item and capping to 8)
  if (items && items.length > 0) {
    const aiPlan: DayPlan = {
      date: new Date().toISOString().split('T')[0] ?? 'Today',
      city: req.city,
      aqi: req.aqi,
      items: items.slice(0, 8),
      planType: 'ai-generated',
      isFallback: false,
    };

    // Cache successful AI plan in memory (never cache fallback standard plans)
    if (planCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = planCache.keys().next().value;
      if (oldestKey) planCache.delete(oldestKey);
    }
    planCache.set(cacheKey, { plan: aiPlan, timestamp: Date.now() });

    return aiPlan;
  }

  // Fallback to deterministic rule-based plan (never cached)
  return generateRuleBasedPlan(req);
}
