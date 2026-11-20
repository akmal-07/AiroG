import type {
  CpcbBandKey,
  DayImpactSummary,
  Household,
  ItemImpact,
  PlanItem,
} from '@/types';

export const METHOD_LINE = 'Impact is estimated from the AQI band and your household — not measured.';

/**
 * Computes a transparent, deterministic impact badge and plain-words explanation for a plan item.
 * Pure TypeScript math and rules — zero AI decision, zero fake decimal percentages.
 *
 * If an item provides supportive comfort rather than particulate reduction, states "Comfort, not exposure".
 */
export function computeItemImpact(
  item: PlanItem,
  category: CpcbBandKey,
  household: Household
): ItemImpact {
  const text = `${item.title} ${item.detail} ${item.category}`.toLowerCase();
  const isHighSmog = category === 'Very Poor' || category === 'Severe' || category === 'Poor';

  // 1. HEPA Air Filtration & Clean Sanctuary
  if (/purifier|hepa|filtration|clean\s*room/.test(text)) {
    if (household.hasPurifier) {
      return {
        level: isHighSmog ? 'High' : 'Medium',
        line: isHighSmog
          ? 'Continuous mechanical HEPA filtration actively strips circulating fine particulate matter from indoor air.'
          : 'Maintains low indoor background particulate concentrations and prevents outdoor dust buildup.',
        ruleTrace: 'Rule: Mechanical HEPA indoor particulate filtration',
      };
    }
    return {
      level: 'Medium',
      line: 'Creating an isolated clean room with draft seals limits passive ambient smog infiltration into sleeping areas.',
      ruleTrace: 'Rule: Passive infiltration barrier without mechanical purifier',
    };
  }

  // 2. Vulnerable Members Protection (Children & Elders)
  if (/children|child|kid|elder|vulnerable|recess|sports/.test(text)) {
    return {
      level: isHighSmog ? 'High' : 'Medium',
      line: isHighSmog
        ? 'Shields developing lungs and sensitive cardiovascular systems from acute roadway and smog peaks.'
        : 'Reduces cumulative particulate exposure during sensitive developmental and cardiovascular exertion.',
      ruleTrace: 'Rule: Exposure avoidance for vulnerable age groups',
    };
  }

  // 3. Window Infiltration & Ventilation
  if (/seal|shut|close|draft|ventilat/.test(text)) {
    return {
      level: isHighSmog ? 'High' : 'Medium',
      line: isHighSmog
        ? 'Keeping windows sealed tightly blocks heavy morning and evening vehicular inversion plumes.'
        : 'Controlled ventilation refreshes indoor oxygen while keeping particle ingress manageable.',
      ruleTrace: 'Rule: Physical boundary ventilation management',
    };
  }

  // 4. Outdoor Window Alignment
  if (/outdoor|errand|chore|grocery|best\s*window/.test(text)) {
    if (isHighSmog) {
      return {
        level: 'High',
        line: 'Shifting outdoor errands strictly to the afternoon window avoids peak morning and evening inversion smog spikes.',
        ruleTrace: 'Rule: Temporal avoidance of peak ambient pollutant concentration',
      };
    }
    return {
      level: 'Medium',
      line: 'Minimizes inhaled particulate volume by timing outdoor activities during the day’s cleanest hours.',
      ruleTrace: 'Rule: Midday ambient particulate avoidance',
    };
  }

  // 4. Asthma / Respiratory Stabilization & N95 Masking
  if (/asthma|inhaler|spacer|n95|mask|respirator/.test(text)) {
    return {
      level: 'High',
      line: 'N95 respirators and prompt medication access prevent sudden particulate-induced bronchospasms.',
      ruleTrace: 'Rule: Personal respiratory barrier protection and bronchial stabilization',
    };
  }

  // 5. Dust Suppression / Wet Mopping
  if (/mop|sweep|dust|clean\s*floor/.test(text)) {
    return {
      level: 'Medium',
      line: 'Damp cleaning traps settled fine dust on floors without kicking particles back into breathing zones.',
      ruleTrace: 'Rule: Surface dust suppression without mechanical resuspension',
    };
  }

  // 6. Low-Emission Transit & Metro
  if (/metro|transit|bus|carpool|vehicle|commute/.test(text)) {
    return {
      level: 'Medium',
      line: 'Enclosed metro transit cuts direct roadway tailpipe exposure compared to open two-wheelers.',
      ruleTrace: 'Rule: Commuter micro-environment exposure reduction',
    };
  }

  // 7. Elimination of Domestic Smoke & Combustion
  if (/burn|smoke|incense|agarbatti|fire|waste/.test(text)) {
    return {
      level: 'High',
      line: 'Eliminating indoor burning prevents dangerous spikes in carbon monoxide and ultrafine soot.',
      ruleTrace: 'Rule: Elimination of supplementary indoor combustion emissions',
    };
  }

  // 9. Non-exposure or Supportive Comfort Actions
  return {
    level: 'Comfort',
    line: 'Comfort, not exposure.',
    ruleTrace: 'Rule: Supportive wellness measure without direct particulate mitigation',
  };
}

/**
 * Computes a deterministic daily exposure score (0–100).
 * Lower is better. Strictly idempotent: identical inputs always produce the exact same score.
 *
 * Model:
 *  - Environmental Load: AQI scaled 0–60
 *  - Vulnerability Additions: Kids (+8), Elders (+8), Asthma (+14), Adults (+4) -> max 34
 *  - Mitigations Subtracted: Purifier (-12), High impact items (-4 each), Medium (-2 each)
 */
export function computeDailyExposureScore(
  aqi: number,
  _category: CpcbBandKey,
  household: Household,
  items: readonly PlanItem[]
): number {
  const boundedAqi = Math.max(0, Math.min(500, aqi));
  const environmentalLoad = Math.round((boundedAqi / 500) * 60);

  let vulnerability = 0;
  if (household.children > 0) vulnerability += 8;
  if (household.elders > 0) vulnerability += 8;
  if (household.hasAsthma) vulnerability += 14;
  if (household.adults > 0) vulnerability += 4;

  let mitigations = 0;
  if (household.hasPurifier) mitigations += 12;

  for (const item of items) {
    const impact = item.computedImpact ?? computeItemImpact(item, _category, household);
    if (impact.level === 'High') mitigations += 4;
    else if (impact.level === 'Medium') mitigations += 2;
  }

  const cappedMitigations = Math.min(35, mitigations);

  const rawScore = environmentalLoad + vulnerability - cappedMitigations;
  return Math.max(5, Math.min(100, Math.round(rawScore)));
}

/**
 * Derives a one-sentence plain-words day summary strictly from the AQI band and household context.
 * No AI decision.
 */
export function generateDayHeadline(
  category: CpcbBandKey,
  household: Household
): string {
  if (category === 'Very Poor' || category === 'Severe') {
    if (household.hasAsthma) {
      return 'Today is a high-risk smog day; sensitive airways should remain strictly indoors with mechanical filtration.';
    }
    if (household.children > 0 && household.elders > 0) {
      return 'Today is a stay-indoors day for children and elders due to severe winter smog.';
    }
    if (household.children > 0) {
      return 'Today is a stay-indoors day for the kids.';
    }
    if (household.elders > 0) {
      return 'Today is a stay-indoors day for elderly family members.';
    }
    return 'Heavy winter smog today; keep outdoor exposure restricted strictly to the afternoon window.';
  }

  if (category === 'Poor') {
    if (household.children > 0 || household.hasAsthma) {
      return 'Poor air quality today; limit outdoor exercise for children and sensitive individuals.';
    }
    return 'Poor air quality today; shift strenuous outdoor errands to the cleanest midday window.';
  }

  if (category === 'Moderate') {
    if (household.hasAsthma) {
      return 'Moderate air quality; keep rescue medication handy during evening outdoor periods.';
    }
    return 'Moderate air conditions today; normal daily activities are acceptable with mindful ventilation.';
  }

  if (category === 'Satisfactory') {
    return 'Satisfactory air quality today; outdoor routines and fresh ventilation are generally safe.';
  }

  return 'Air quality is clean and safe today for outdoor exercise and open ventilation.';
}

/**
 * Builds the complete DayImpactSummary bundle.
 */
export function generateDaySummary(
  aqi: number,
  category: CpcbBandKey,
  household: Household,
  items: readonly PlanItem[]
): DayImpactSummary {
  const exposureScore = computeDailyExposureScore(aqi, category, household, items);
  const headline = generateDayHeadline(category, household);

  let riskCategory: DayImpactSummary['riskCategory'] = 'Minimal';
  if (exposureScore >= 80) riskCategory = 'Severe';
  else if (exposureScore >= 65) riskCategory = 'High';
  else if (exposureScore >= 45) riskCategory = 'Elevated';
  else if (exposureScore >= 25) riskCategory = 'Moderate';

  return {
    exposureScore,
    headline,
    methodLine: METHOD_LINE,
    riskCategory,
  };
}
