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

  // 1. HEPA Mechanical Air Purifiers vs Clean Room Sanctuary vs Passive Filtration
  if (/purifier|hepa|air\s*cleaner/.test(text)) {
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
      line: 'Running DIY fan-filter assemblies or localized air cleaners captures recirculating indoor dust.',
      ruleTrace: 'Rule: Mechanical particle capture without dedicated purifier',
    };
  }

  if (/clean\s*room|sanctuary|isolated\s*room|bedroom\s*seal/.test(text)) {
    return {
      level: 'Medium',
      line: 'Creating an isolated clean room with draft seals limits passive ambient smog infiltration into sleeping areas.',
      ruleTrace: 'Rule: Passive infiltration barrier without mechanical purifier',
    };
  }

  // 2. Personal Respiratory Protection (N95 / Respirators)
  if (/n95|kn95|ffp2|respirator|mask/.test(text)) {
    const isSpareOrCarry = /spare|carry|pack|handy|bag/.test(text);
    return {
      level: 'High',
      line: isSpareOrCarry
        ? 'Carrying spare N95 masks ensures continuous protection if outdoor straps loosen or filters become humid.'
        : 'A tight-fitting N95 respirator filters >=95% of airborne fine soot and roadside PM2.5 before it reaches deep lungs.',
      ruleTrace: 'Rule: Personal respiratory barrier protection against fine particulates',
    };
  }

  // 3. Asthma / Airway Stabilization & Bronchial Medication
  if (/asthma|inhaler|spacer|bronchodilator|medication|rescue\s*dose/.test(text)) {
    return {
      level: 'High',
      line: 'Prompt access to prescribed rescue inhalers prevents sudden particulate-induced bronchospasms and airway inflammation.',
      ruleTrace: 'Rule: Bronchial stabilization and acute airway symptom prevention',
    };
  }

  // 4. Vulnerable Groups: Children vs Elders vs Vigorous Exercise
  if (/child|children|kid|infant|toddler/.test(text)) {
    return {
      level: isHighSmog ? 'High' : 'Medium',
      line: isHighSmog
        ? 'Shields developing pediatric lungs and higher respiratory rates from acute roadway and smog peaks.'
        : 'Reduces cumulative particulate exposure during sensitive developmental stages.',
      ruleTrace: 'Rule: Exposure avoidance for developing pediatric airways',
    };
  }

  if (/recess|school|playground|sports/.test(text)) {
    return {
      level: isHighSmog ? 'High' : 'Medium',
      line: isHighSmog
        ? 'Moving outdoor school sports and recess indoors prevents deep lung intake during peak inversion hours.'
        : 'Reduces cumulative particulate exposure during sensitive developmental and cardiovascular exertion.',
      ruleTrace: 'Rule: Exposure avoidance for vulnerable age groups',
    };
  }

  if (/elder|senior|grandparent|cardiac|cardiovascular|hypertension/.test(text)) {
    return {
      level: isHighSmog ? 'High' : 'Medium',
      line: isHighSmog
        ? 'Protects aging cardiovascular systems and fragile bronchial pathways from smog-triggered cardiac stress.'
        : 'Limits exertion-related cardiovascular load during morning and evening particulate elevations.',
      ruleTrace: 'Rule: Cardiovascular and respiratory protection for elderly members',
    };
  }

  if (/vulnerable|jog|run\b|workout|exercise/.test(text)) {
    return {
      level: isHighSmog ? 'High' : 'Medium',
      line: isHighSmog
        ? 'Postponing vigorous physical exertion outdoors prevents deep lung inhalation of concentrated toxic smog.'
        : 'Moderates aerobic respiratory intake while ambient particulate levels remain elevated.',
      ruleTrace: 'Rule: Exposure avoidance during physical exertion and sensitive hours',
    };
  }

  // 5. Window Sealing vs Draft Stoppers vs Controlled Ventilation
  if (/draft|towel|stopper|weatherstrip|gap|bottom\s*of\s*door/.test(text)) {
    return {
      level: 'Medium',
      line: 'Placing rolled towels or draft guards under exterior doors stops ground-level street dust from creeping indoors.',
      ruleTrace: 'Rule: Threshold draft sealing and infiltration barrier',
    };
  }

  if (/ventilat|airing|open\s*window|fresh\s*air/.test(text)) {
    return {
      level: isHighSmog ? 'High' : 'Medium',
      line: isHighSmog
        ? 'Brief, controlled ventilation during midday warmth refreshes indoor oxygen while keeping particle ingress manageable.'
        : 'Controlled ventilation refreshes indoor oxygen while keeping particle ingress manageable.',
      ruleTrace: 'Rule: Physical boundary ventilation management',
    };
  }

  if (/seal|shut|close/.test(text)) {
    return {
      level: isHighSmog ? 'High' : 'Medium',
      line: isHighSmog
        ? 'Keeping windows sealed tightly blocks heavy morning and evening vehicular inversion plumes.'
        : 'Maintains a physical envelope to prevent outdoor road dust and ambient particles from drifting inside.',
      ruleTrace: 'Rule: Physical boundary window sealing',
    };
  }

  // 6. Outdoor Timing & Grocery/Errand Alignment
  if (/grocery|market|shopping|vegetable/.test(text)) {
    return {
      level: isHighSmog ? 'High' : 'Medium',
      line: isHighSmog
        ? 'Timing grocery shopping strictly to the afternoon window ensures exposure happens when sunlight has dispersed ground smog.'
        : 'Minimizes inhaled particulate volume by completing shopping during the day’s cleanest hours.',
      ruleTrace: 'Rule: Temporal avoidance of peak ambient pollutant concentration',
    };
  }

  if (/best\s*window|errand|chore|task/.test(text)) {
    return {
      level: isHighSmog ? 'High' : 'Medium',
      line: isHighSmog
        ? 'Shifting outdoor errands strictly to the afternoon window avoids peak morning and evening inversion smog spikes.'
        : 'Minimizes inhaled particulate volume by timing outdoor activities during the day’s cleanest hours.',
      ruleTrace: 'Rule: Temporal avoidance of peak ambient pollutant concentration',
    };
  }

  if (/outdoor|outside|walk\b|stepping\s*out/.test(text)) {
    return {
      level: isHighSmog ? 'High' : 'Medium',
      line: isHighSmog
        ? 'Restricting general outdoor exposure to warmest daylight hours circumvents cold ground-level smog traps.'
        : 'Reduces cumulative ambient exposure by limiting unnecessary outdoor duration.',
      ruleTrace: 'Rule: Ambient outdoor exposure minimization',
    };
  }

  // 7. Dust Suppression: Wet Mopping vs Damp Wiping/Microfiber Dusting vs Sweeping
  if (/mop|mopping|wash\s*floor|wet\s*clean/.test(text)) {
    return {
      level: 'Medium',
      line: 'Damp wet-mopping traps settled fine dust on hard floors without kicking particles back into breathing zones.',
      ruleTrace: 'Rule: Surface dust suppression without mechanical resuspension',
    };
  }

  if (/wipe|microfiber|cloth|surface|table|sill/.test(text)) {
    return {
      level: 'Medium',
      line: 'Wiping sills and surfaces with damp microfiber cloths lifts settled particulate film without dry resuspension.',
      ruleTrace: 'Rule: Surface particulate removal with damp cloth',
    };
  }

  if (/sweep|broom|dusting|dust/.test(text)) {
    return {
      level: 'Medium',
      line: 'Avoiding dry sweeping prevents settled PM10 and PM2.5 particles from being resuspended into breathing zones.',
      ruleTrace: 'Rule: Avoidance of dry particulate resuspension',
    };
  }

  // 8. Low-Emission Transit & Commuter Micro-Environments
  if (/metro|train|rail|subway/.test(text)) {
    return {
      level: 'Medium',
      line: 'Enclosed metro transit cuts direct roadway tailpipe exposure compared to open two-wheelers and auto-rickshaws.',
      ruleTrace: 'Rule: Commuter micro-environment exposure reduction',
    };
  }

  if (/carpool|cab|taxi|ride\s*share/.test(text)) {
    return {
      level: 'Medium',
      line: 'Sharing enclosed vehicles with recirculating cabin air filters reduces per-commute tailpipe exposure and road congestion.',
      ruleTrace: 'Rule: Commuter cabin air filtration and ride sharing',
    };
  }

  if (/bus|transit|public\s*transport/.test(text)) {
    return {
      level: 'Medium',
      line: 'Riding high-capacity public transit lowers per-capita emissions while keeping commuters sheltered from direct exhaust plumes.',
      ruleTrace: 'Rule: Commuter public transit exposure reduction',
    };
  }

  if (/two\s*wheeler|scooter|motorcycle|bike|cycling/.test(text)) {
    return {
      level: isHighSmog ? 'High' : 'Medium',
      line: isHighSmog
        ? 'Avoiding open two-wheeler rides eliminates direct face-level inhalation of toxic diesel exhaust and brake dust.'
        : 'Minimizes exposure to high-concentration vehicular exhaust plumes during commute hours.',
      ruleTrace: 'Rule: Avoidance of open-air vehicular exhaust plumes',
    };
  }

  if (/vehicle|commute/.test(text)) {
    return {
      level: 'Medium',
      line: 'Optimizing daily commute timing and routes avoids peak traffic congestion and stagnant exhaust corridors.',
      ruleTrace: 'Rule: Commuter micro-environment exposure reduction',
    };
  }

  // 9. Elimination of Domestic Smoke & Combustion
  if (/incense|agarbatti|dhoop/.test(text)) {
    return {
      level: 'High',
      line: 'Refraining from burning incense and agarbatti eliminates a major indoor source of fine soot, benzene, and carbon monoxide.',
      ruleTrace: 'Rule: Elimination of smoldering indoor aromatic combustion',
    };
  }

  if (/coil|mosquito/.test(text)) {
    return {
      level: 'High',
      line: 'Switching from mosquito coils to vaporizers eliminates dense smoldering particulate emissions in sleeping rooms.',
      ruleTrace: 'Rule: Elimination of smoldering insecticidal particulate emissions',
    };
  }

  if (/burn|waste|trash|leaves|biomass|garbage|fire/.test(text)) {
    return {
      level: 'High',
      line: 'Eliminating outdoor biomass and waste burning prevents severe localized spikes in toxic polycyclic aromatic hydrocarbons and soot.',
      ruleTrace: 'Rule: Elimination of open waste and biomass combustion emissions',
    };
  }

  if (/smoke|smoking|tobacco|chulha/.test(text)) {
    return {
      level: 'High',
      line: 'Eliminating indoor smoke and secondhand tobacco prevents concentrated ultrafine particle buildup in enclosed living rooms.',
      ruleTrace: 'Rule: Elimination of supplementary indoor combustion emissions',
    };
  }

  // 10. Non-exposure or Supportive Comfort Actions (Honest Labeling)
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
