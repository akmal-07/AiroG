# AiroG — Clear air, made simple.

> **GenAI Air-Quality Assistant for Indian Families Navigating Winter Smog**  
> *PromptWars Virtual Challenge 06: Urban Air Quality Assistant*  
> **Author:** Mohammed Akmal Kanna Mangalam (`akmal-07`)  
> **Live Demo:** [https://airog.vercel.app](https://airog.vercel.app) *(Deploy URL placeholder)*  
> **Repository:** [https://github.com/akmal-07/AiroG](https://github.com/akmal-07/AiroG)

---

## 1. Problem & Chosen Vertical
During North Indian winter months, severe atmospheric temperature inversions trap vehicular emissions, crop residue smoke, and industrial particulates close to ground level. Metropolitan cities routinely plunge into hazardous air quality conditions (e.g., Delhi AQI ~312 **Very Poor** or **Severe** 400+).

While existing weather portals present raw pollutant numbers or abstract US-EPA categories, **Indian families struggle to answer practical daily questions:**
- *“When is it safe to send my children out to play?”*
- *“When should I seal our windows and when should we ventilate?”*
- *“My elderly parent has asthma—what specific routine changes will protect them today?”*

**AiroG** bridges this gap. It turns abstract CPCB AQI numbers into an actionable, tailored daily action plan for the entire household, identifying the day's safest outdoor activity window and backing every suggestion with transparent, deterministic impact explanations.

---

## 2. Approach & Architecture

AiroG follows a core design principle: **Use GenAI for natural language habit synthesis; use deterministic TypeScript math for all calculations.** The AI is never trusted with a number.

```
                                  [ User Input ]
                           (City Name + Household Profile)
                                        │
                                        ▼
                           ┌──────────────────────────┐
                           │   /api/aqi (OpenWeather) │ ──(Proxy failure)──► [ Curated Demo Data ]
                           │ Geocoding & Pollution    │                      (10 Indian Cities)
                           └──────────────────────────┘
                                        │
                                        ▼
                           ┌──────────────────────────┐
                           │  Deterministic CPCB Math │
                           │  - Sub-index breakpoints │
                           │  - Best Outdoor Window   │
                           │  - Peak Smog Inversion   │
                           └──────────────────────────┘
                                        │
                                        ▼
                           ┌──────────────────────────┐
                           │  /api/plan (Gemini 1.5)  │ ──(Retry / Invalid)──► [ Rule-Based Plan ]
                           │  Strict JSON Generation  │                        ("standard plan")
                           └──────────────────────────┘
                                        │
                                        ▼
                           ┌──────────────────────────┐
                           │   Zod Schema Validation  │
                           └──────────────────────────┘
                                        │
                                        ▼
                           ┌──────────────────────────┐
                           │ Deterministic Impact     │
                           │  - 0–100 Exposure Score  │
                           │  - High/Med/Low Badges   │
                           │  - Transparent Traces    │
                           └──────────────────────────┘
                                        │
                                        ▼
                                [ Accessible UI ]
                      (Header, Hero AQI, ImpactBar, Plan)
```

### A. Central Pollution Control Board (CPCB) NAQI Math
Standard international APIs (such as OpenWeather) return air pollution on a 1–5 US-EPA-style index. AiroG **strictly ignores and never displays that scale**. Instead, it computes the official Indian National Air Quality Index (NAQI) using linear sub-index interpolation across CPCB breakpoints:

$$I_p = \frac{I_{hi} - I_{lo}}{B_{hi} - B_{lo}} \times (C_p - B_{lo}) + I_{lo}$$

$$\text{Overall AQI} = \max\Big(\text{SubIndex}(PM_{2.5}), \text{SubIndex}(PM_{10})\Big)$$

For Delhi ($PM_{2.5} = 135.3\,\mu\text{g/m}^3, PM_{10} = 275.0\,\mu\text{g/m}^3$), the engine computes $AQI = 312$ (**Very Poor** band), matching official CPCB guidelines and competition benchmarks.

### B. Deterministic Best Outdoor Window & Peak Smog Detection
Rather than presenting a static single number, AiroG analyzes 24-hour hourly forecast curves deterministically:
- **Best Window:** Identifies the lowest-AQI contiguous stretch of 2+ hours (e.g., *2:00 PM – 4:00 PM* during the afternoon thermal dip).
- **Peak Smog:** Identifies the nocturnal inversion spike (e.g., *Around 8:00 PM* at 368 AQI).
- Outdoor plan routines are programmatically anchored to this window.

### C. Gemini 1.5 Flash + Zod Validation + Rule-Based Fallback
- Gemini 1.5 Flash generates 5 to 8 practical action items across three categories: `routines`, `indoor hacks`, and `greener alternatives`.
- **Strict plain-words constraint:** The AI prompt forbids percentages or invented statistics.
- **Validation:** Responses are validated through strict Zod schemas (`PlanResponseSchema`). If the provider returns invalid JSON, the client retries once.
- **Deterministic Rule Fallback:** If the API key is unconfigured, network fails, or validation fails twice, the system falls back seamlessly to a local deterministic rule engine (`generateRuleBasedPlan`) labeled `"standard plan"`. Unvalidated AI output is never rendered.

### D. Deterministic 0–100 Exposure & Impact Model
- **Exposure Score (0–100):** A transparent, idempotent formula combining base environmental load ($\le 60$), household vulnerability additions ($\le 34$ for children, elders, asthma), minus active mitigation points ($\le 35$ for HEPA filtration, window shifting, N95 masks). Identical inputs always yield the exact same integer score.
- **Traceable Badges:** Each card displays `High`, `Medium`, `Low`, or `Comfort` badges pairing color with text labels, complete with transparent rule traces.
- **Honesty Principle:** Non-exposure actions state plainly: `"Comfort, not exposure."`
- **Methodology Line:** Explicitly displayed across the UI:
  > *"Impact is estimated from the AQI band and your household — not measured."*

---

## 3. Performance & Bundle Efficiency

To achieve a 95+ Efficiency rating, AiroG employs aggressive code splitting and session-level caching:

| Metric | Before Optimization | After Optimization | Improvement |
| :--- | :--- | :--- | :--- |
| **Initial Critical JS (`index-*.js`)** | **279.98 kB** (84.81 kB gzip) | **184.32 kB** (57.13 kB gzip) | **-95.66 kB (-34.2%) reduction** |
| **Lazy Plan Engine (`plan-*.js`)** | *bundled in main* | **87.10 kB** (26.02 kB gzip) | Loaded dynamically on calculation |
| **Lazy Plan UI (`PlanSection-*.js`)** | *bundled in main* | **11.77 kB** (3.25 kB gzip) | Code-split below the fold |
| **CSS Bundle (`index-*.css`)** | 22.25 kB (4.74 kB gzip) | **23.10 kB** (4.85 kB gzip) | Purged utility CSS |
| **Session Cache** | None | 10-minute in-memory cache | Prevents duplicate city refetches |

---

## 4. Accessibility & Security

- **Accessibility (WCAG 2.1 AA/AAA):**
  - Full keyboard navigation across all interactive elements (City search $\rightarrow$ Quick-select pills $\rightarrow$ Steppers $\rightarrow$ Toggles $\rightarrow$ Plan cards).
  - Visible high-contrast focus rings (`focus-visible:outline-2 focus-visible:outline-teal-600`).
  - Dual color-text pairing: AQI bands and impact levels are never conveyed by color alone.
  - Complete ARIA attributes: `role="progressbar"`, `role="status"`, `aria-live="polite"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.
- **Security & Quality:**
  - Zero hardcoded API keys or secrets in the repository.
  - Zero instances of `dangerouslySetInnerHTML`.
  - Zero occurrences of TypeScript `any`.
  - Input sanitization and clamping on all city strings ($\le 60$ chars) and household member counts ($0 \le n \le 20$).

---

## 5. End-to-End Data Flow

1. **User Input:** User enters an Indian city or clicks a quick-select pill (e.g., Delhi, Mumbai, Bengaluru, Tirupati) and configures their household demographics in `HouseholdForm` (automatically persisted to `localStorage` under `airog_v1`).
2. **AQI Retrieval:** `/api/aqi` geocodes the city and queries OpenWeather Air Pollution endpoints. If unconfigured or offline, it falls back seamlessly to curated demo data (`src/data/demo.ts`) labeled with a visible `"demo data"` tag.
3. **CPCB Computation:** Pollutant concentrations ($PM_{2.5}, PM_{10}$) are converted into standard CPCB bands via deterministic math.
4. **Forecast Windowing:** Hourly forecast vectors are analyzed to find the 2+ hour minimum-AQI window and peak smog hour.
5. **Plan Synthesis:** `/api/plan` queries Google Gemini 1.5 Flash to synthesize practical routines. Outdoor items are strictly scheduled within the best window.
6. **Zod Gate:** Incoming plan JSON is validated through Zod schemas. On failure or timeout, the deterministic rule generator steps in.
7. **Impact Scoring:** Every action item is assigned a qualitative impact tier (`High` | `Medium` | `Low` | `Comfort`) and an overall 0–100 exposure score is calculated.
8. **Render:** The UI displays the Hero AQI Card, `ImpactBar`, and categorized plan cards with zero layout shift.

---

## 6. Assumptions Made

1. **CPCB Standard Priority:** The Indian Central Pollution Control Board (CPCB) NAQI scale is the governing standard; US EPA / WHO scales are deliberately mapped to CPCB for domestic relevance.
2. **Key Smog Drivers:** For Indian winter smog, $PM_{2.5}$ and $PM_{10}$ are the primary driving pollutants determining the maximum sub-index.
3. **Indoor Filtration:** Having an air purifier is assumed to provide active mechanical HEPA filtration in enclosed rooms, whereas households without purifiers rely on clean-room isolation and wet dust suppression.
4. **No Direct Biological Measurement:** The daily exposure score (0–100) is a relative mathematical proxy derived from ambient AQI, demographic vulnerability, and protective actions—not an in-vivo biological measurement.

---

## 7. Local Setup & Testing

### Prerequisites
- Node.js $\ge 18$
- npm $\ge 9$

### Installation
```bash
# 1. Clone repository
git clone https://github.com/akmal-07/AiroG.git
cd AiroG

# 2. Install dependencies
npm install

# 3. Configure environment variables (optional — demo mode works out-of-the-box)
cp .env.example .env
# Edit .env and supply your OPENWEATHER_API_KEY and GEMINI_API_KEY
```

### Development & Verification
```bash
# Start local development server
npm run dev

# Run Vitest unit test suite (19 tests)
npm test

# Run strict TypeScript type-checking
npx tsc --noEmit

# Create optimized production build
npm run build
```

---

## 8. Test Suite Summary

The automated Vitest test suite (`npm test`) verifies 19 distinct requirements across 3 test modules:
- `src/lib/__tests__/aqi.test.ts`: CPCB breakpoints, Delhi AQI 312 Very Poor verification, 6-band color-text pairing, 2-hour best window detection, peak smog hour detection, and 10-minute session caching.
- `src/lib/__tests__/plan.test.ts`: Deterministic fallback generation for vulnerable households, outdoor window scheduling, child/asthma protections, Zod schema validation, and plain-words impact rules.
- `src/lib/__tests__/impact.test.ts`: Exposure score idempotency ($f(x) = f(x)$), transparent rule traces, `"Comfort, not exposure"` fallback, one-sentence headline generation, and methodology disclosure.

---

## 9. Submission Metadata
- **Challenge:** PromptWars Virtual Challenge 06 (Urban Air Quality Assistant)
- **Built with:** Google Antigravity, React 18, Vite, TypeScript (strict), Tailwind CSS, Zod, Google Gemini 1.5 Flash, OpenWeather API.
- **License:** MIT
