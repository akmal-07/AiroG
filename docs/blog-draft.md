# Engineering AiroG: How We Built an Accessible, Deterministic GenAI Air-Quality Assistant for Indian Smog

*By Mohammed Akmal Kanna Mangalam (`akmal-07`)*  
*Target Platforms: Dev.to / Medium*

---

Every November, millions of families across North India wake up to the same sight: a dense, yellowish haze smothering the horizon. They check a weather app on their phones. It shows a scary number: **AQI 312 — Very Poor**.

Then comes the real dilemma.

Does an AQI of 312 mean schools should close? Can your 8-year-old go out for football practice? Should you keep the windows shut all day, or will indoor air turn stale? What if your grandmother has asthma and you don't own an expensive air purifier?

Existing portals stop at raw numbers or display a generic 1–5 scale designed for Western cities. For a parent, an isolated number is useless without an actionable decision framework.

For **PromptWars Virtual Challenge 06 (Urban Air Quality Assistant)**, I set out to build **AiroG** (*Airo* for air + *G* for guardian)—an assistant engineered specifically for Indian families that turns smog data into a personalized, low-emission daily routine.

In Challenge 05, my project *Planovent* scored 94.47/100 (Rank #559 of 51,762). Our biggest point loss was in **Efficiency (80/100)** and **Code Quality (89/100)**. For Challenge 06, we set our sights on Rank #1.

Here is the deep technical breakdown of how AiroG was built, where GenAI fits into the equation, and why deterministic mathematics must always govern environmental health decisions.

---

## 1. The Core Architectural Philosophy: AI for Prose, Math for Numbers

One of the most dangerous anti-patterns in modern LLM applications is asking an AI to compute environmental or health numbers. 

If you prompt an LLM:
> *"How much does wearing an N95 mask reduce PM2.5 exposure for a child in Delhi today?"*

The model will confidently hallucinate an exact number: *"It reduces exposure by 43.7%."* That number looks convincing, but it has no empirical or mathematical basis.

In AiroG, we established a strict architectural boundary:
- **Google Gemini 1.5 Flash drafts the action items only:** Suggesting intuitive routines, indoor hacks, and greener alternatives in plain words under strict Zod validation schemas.
- **Deterministic TypeScript models calculate every single number:** The CPCB AQI band, the day's best outdoor window, the peak smog inversion hour, the 0–100 daily exposure score, and individual qualitative impact tiers (`High`, `Medium`, `Low`, `Comfort`).

The AI is never allowed to invent a number, and unvalidated AI output is never rendered on screen.

---

## 2. Implementing CPCB NAQI Math (Why US-EPA Breaks in India)

Global air quality APIs (including OpenWeather) frequently report air pollution on a simplified 1–5 scale based on US EPA guidelines. In India, this scale misleads users because the Central Pollution Control Board (CPCB) National Air Quality Index (NAQI) uses different breakpoint curves tailored to subcontinent particulate concentrations.

In AiroG, we discard OpenWeather's 1–5 scale and compute CPCB sub-indices directly from 24-hour $PM_{2.5}$ and $PM_{10}$ concentrations using piecewise linear interpolation:

$$I_p = \frac{I_{hi} - I_{lo}}{B_{hi} - B_{lo}} \times (C_p - B_{lo}) + I_{lo}$$

$$\text{Overall AQI} = \max\Big(\text{SubIndex}(PM_{2.5}), \text{SubIndex}(PM_{10})\Big)$$

### CPCB Breakpoint Mapping in TypeScript:
```typescript
interface Breakpoint {
  readonly bLo: number;
  readonly bHi: number;
  readonly iLo: number;
  readonly iHi: number;
}

const PM25_BREAKPOINTS: readonly Breakpoint[] = [
  { bLo: 0, bHi: 30, iLo: 0, iHi: 50 },       // Good
  { bLo: 31, bHi: 60, iLo: 51, iHi: 100 },    // Satisfactory
  { bLo: 61, bHi: 90, iLo: 101, iHi: 200 },   // Moderate
  { bLo: 91, bHi: 120, iLo: 201, iHi: 300 },  // Poor
  { bLo: 121, bHi: 250, iLo: 301, iHi: 400 }, // Very Poor
  { bLo: 251, bHi: 380, iLo: 401, iHi: 500 }, // Severe
];
```

When tested with Delhi's typical winter smog scenario ($PM_{2.5} = 135.3\,\mu\text{g/m}^3, PM_{10} = 275.0\,\mu\text{g/m}^3$), our engine deterministically yields:
$$I_{PM2.5} = \frac{400 - 301}{250 - 121} \times (135.3 - 121) + 301 = \frac{99}{129} \times 14.3 + 301 = 311.97 \approx 312$$
Matching the CPCB **Very Poor** band exactly.

---

## 3. The "Best Outdoor Window": The True Differentiator

Most air quality apps treat the day as a single flat number. In reality, winter smog exhibits dramatic diurnal fluctuations. During winter nights, surface cooling causes a **thermal inversion layer**, trapping pollutants close to the ground; peak smog typically occurs between 7:00 PM and 10:00 PM. By 1:00 PM to 4:00 PM, midday solar radiation warms the surface, breaking the inversion and temporarily dropping particulate levels.

AiroG leverages this phenomenon algorithmically:
```typescript
export function findBestOutdoorWindow(forecast: readonly ForecastHour[]): OutdoorWindowInfo {
  // 1. Identify peak smog hour
  let peakIndex = 0;
  let maxAqi = -1;
  for (let i = 0; i < forecast.length; i++) {
    if (forecast[i]!.aqi > maxAqi) {
      maxAqi = forecast[i]!.aqi;
      peakIndex = i;
    }
  }

  // 2. Locate lowest-AQI contiguous 2-hour window [i, i + 1]
  let bestStartIndex = 0;
  let minWindowSum = Infinity;
  for (let i = 0; i <= forecast.length - 2; i++) {
    const sum = forecast[i]!.aqi + forecast[i + 1]!.aqi;
    if (sum < minWindowSum) {
      minWindowSum = sum;
      bestStartIndex = i;
    }
  }
  
  return {
    windowText: `${formatTimeLabel(forecast[bestStartIndex]!.time)} – ${formatTimeLabel(forecast[bestStartIndex + 1]!.time)}`,
    averageAqi: Math.round(minWindowSum / 2),
    peakHour: formatTimeLabel(forecast[peakIndex]!.time),
    peakAqi: Math.round(forecast[peakIndex]!.aqi),
    // ...
  };
}
```

When Gemini drafts the daily routine, any outdoor errand (groceries, commuting, pet walking) is **programmatically anchored** into this window:
> *“Schedule essential errands strictly between 2:00 PM – 4:00 PM when particulate levels dip to ~235 AQI.”*

---

## 4. Zod Validation & Deterministic Rule Fallbacks

A serverless proxy (`/api/plan`) invokes Google Gemini 1.5 Flash with strict formatting instructions. But LLMs can hallucinate malformed JSON or drop categories. 

AiroG uses a 3-tier safety net:
1. **Zod Schema Gate:**
   ```typescript
   export const PlanResponseSchema = z.object({
     items: z.array(PlanItemSchema).min(5).max(8),
   });
   ```
2. **One-Shot Retry:** If parsing fails or the LLM returns an invalid schema, the client retries once immediately.
3. **Local Rule-Based Fallback:** If the retry fails or the user is offline/unauthenticated, `generateRuleBasedPlan()` deterministically constructs an expert-reviewed plan matching the AQI band and household profile, labeled with an honest `"standard plan"` badge.

---

## 5. The Deterministic 0–100 Exposure Model

Instead of inventing fake percentages (e.g. *"Reduces asthma risk by 38%"*), AiroG calculates an idempotent **Daily Exposure Score (0–100)**:

$$\text{Score} = \text{EnvironmentalLoad}_{(0-60)} + \text{Vulnerability}_{(0-34)} - \text{Mitigations}_{(0-35)}$$

- **Environmental Load:** Direct scaling of the CPCB AQI up to 60 points.
- **Vulnerability Additions:** Children (+8), Elders (+8), Asthma (+14).
- **Active Mitigations:** Mechanical HEPA purifier (-12), High-impact plan adoptions (-4 each, capped at 35).

Furthermore, non-exposure actions (such as drinking warm water) are tagged with radical honesty:
> **Impact:** *“Comfort, not exposure.”*

And every summary includes our transparent methodology disclosure:
> *“Impact is estimated from the AQI band and your household — not measured.”*

---

## 6. Optimization: Slashing Bundle Size by 34.2%

In Challenge 05, our bundle efficiency score was 80/100 because heavy dependencies were compiled directly into the root bundle.

In AiroG, we implemented aggressive architectural code splitting:
1. **Lazy Loading Below the Fold:** The entire plan presentation layer (`PlanSection.tsx` and `PlanCard.tsx`) is wrapped in `React.lazy()` and `<Suspense>`.
2. **Dynamic Logic Import:** `src/lib/plan.ts` (which imports `zod`) is imported dynamically (`await import('./lib/plan')`) only when a plan calculation is triggered.
3. **10-Minute In-Memory Session Cache:** In `fetchAqiData()`, cities searched within the last 10 minutes return cached data instantly, eliminating redundant network traffic.

### The Measurements:
- **Before Optimization:** `index-*.js` = **279.98 kB** (84.81 kB gzip)
- **After Optimization:** `index-*.js` = **184.32 kB** (57.13 kB gzip)
- **Net Reduction:** **-95.66 kB (-34.2%)**
- **Lazy Plan Engine Chunk:** 87.10 kB (loaded asynchronously)

---

## 7. Testing & Verification

AiroG includes a full Vitest test suite (`npm test`) covering **19 automated unit tests**:
- CPCB piecewise interpolation accuracy (including the Delhi AQI 312 benchmark).
- Diurnal forecast window detection.
- Zod schema validation boundaries and rule fallback generation.
- Idempotency of the 0–100 daily exposure score ($f(x) = f(x)$ across all identical runs).

Running `npm test`, `npx tsc --noEmit`, and `npm run build` yields zero errors, zero warnings, and zero `any` types.

---

## 8. Summary & Key Takeaways

Building AiroG reinforced three vital engineering principles for GenAI products:
1. **Never trust an LLM with numbers:** LLMs are linguistic engines, not calculators. Put domain formulas in TypeScript.
2. **Actionability trumps information:** Giving users a single number induces anxiety; giving them an hourly window and practical indoor hacks empowers them.
3. **Code splitting is non-negotiable:** Moving heavy validation schemas out of the critical paint path dropped our initial bundle size by a third.

Check out the live app, test your city, and explore the repository:
- **Live Demo:** [https://airog.vercel.app](https://airog.vercel.app)
- **GitHub Repo:** [https://github.com/akmal-07/AiroG](https://github.com/akmal-07/AiroG)

*Clear air, made simple.*
