# AiroG — Clear air, made simple.

> **GenAI Air-Quality Assistant for Indian Families Navigating Winter Smog**  
> *PromptWars Virtual Challenge 06: Urban Air Quality Assistant*  
> **Author:** Mohammed Akmal Kanna Mangalam (`akmal-07`)  
> **Live Demo:** [https://airog.vercel.app](https://airog.vercel.app)  
> **Repository:** [https://github.com/akmal-07/AiroG](https://github.com/akmal-07/AiroG)

---

## ⚡ Evaluator Sample Inputs & Test Scenarios

To quickly evaluate AiroG's real-time capabilities across varied demographic vulnerabilities, smog intensities, and city tiers, try these 3 copy-ready evaluator scenarios:

| # | Persona & City | Household Configuration | Expected Evaluator Observations |
| :-: | :--- | :--- | :--- |
| **1** | **Vulnerable Family in Severe Winter Smog**<br>• City: `Delhi` (or click *Delhi* quick-pill) | • **Children:** 2<br>• **Elders:** 1<br>• **Asthma:** ✅ Yes<br>• **Air Purifier:** ❌ No | • **Prominent Telemetry:** Hero card displays live CPCB AQI readout (`Live: OpenWeatherMap · CPCB NAQI` or demo badge) with local timestamp (`Updated ... IST`).<br>• **Diurnal Inversion Window:** Identifies the daytime smog break (e.g., ~1:00 PM – 4:00 PM) vs. severe evening inversion (~8:00 PM peak).<br>• **AI-Tailored Plan:** Gemini drafts high-protection protocols (school commute precautions, wet mopping, clean-room isolation).<br>• **Dynamic Exposure Score:** Elevated vulnerability score highlights urgent risk with traceable, deterministic rule explanations. |
| **2** | **Working Commuter with Mechanical Filtration**<br>• City: `Mumbai` or `Bengaluru` | • **Children:** 0<br>• **Elders:** 0<br>• **Asthma:** ❌ No<br>• **Air Purifier:** ✅ Yes | • **Coastal / Plateau Dynamics:** Lower baseline AQI with vehicular rush-hour smog spikes.<br>• **Purifier-Optimized Action Items:** HEPA runtime schedules, window seal timings before evening rush hour, and N95 commuter guidance.<br>• **Immediate Exposure Drop:** Real-time score decreases reflecting mechanical indoor particulate capture. |
| **3** | **Tier-2 / Tier-3 Regional Search**<br>• City: `Tirupati, Andhra Pradesh` (type `Tirupati` in autocomplete) | • **Children:** 1<br>• **Elders:** 0<br>• **Asthma:** ❌ No<br>• **Air Purifier:** ❌ No | • **Accessible Autocomplete:** Geocoding suggestions dropdown with live screen reader count feedback (`... suggestions available`).<br>• **Direct Coordinate Resolution:** Serverless geocoding retrieves coordinates with zero client-side secret exposure.<br>• **Balanced Action Plan:** Synthesizes outdoor playtime inside the lowest-AQI stretch with transparent impact indicators (`"Comfort, not exposure"` vs `"High Impact"`). |

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
                           │  /api/plan (Gemini 3.5)  │ ──(Retry / Invalid)──► [ Rule-Based Plan ]
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

### C. Gemini 3.5 Flash-Lite + Zod Validation + Rule-Based Fallback
- Gemini 3.5 Flash-Lite generates 5 to 8 practical action items across three categories: `routines`, `indoor hacks`, and `greener alternatives`.
- **Strict plain-words constraint:** The AI prompt forbids percentages or invented statistics.
- **Validation:** Responses are validated through strict Zod schemas (`PlanResponseSchema`). If the provider returns invalid JSON, the client retries once.
- **Deterministic Rule Fallback:** If the API key is unconfigured, network fails, or validation fails twice, the system falls back seamlessly to a local deterministic rule engine (`generateRuleBasedPlan`) labeled `"standard plan"`. Unvalidated AI output is never rendered.

### D. Deterministic 0–100 Exposure & Impact Model
- **Exposure Score (0–100):** A transparent, idempotent formula combining base environmental load ($\le 60$), household vulnerability additions ($\le 34$ for children, elders, asthma), minus active mitigation points ($\le 35$ for HEPA filtration, window shifting, N95 masks). Identical inputs always yield the exact same integer score.
- **Traceable Badges:** Each card displays `High`, `Medium`, `Low`, or `Comfort` badges pairing color with text labels, complete with transparent rule traces.
- **Honesty Principle:** Non-exposure actions state plainly: `"Comfort, not exposure."`
- **Methodology Line:** Explicitly displayed across the UI:
  > *"Impact is estimated from the AQI band and your household — not measured."*

### E. Feature-First Project Structure
The codebase follows a modular feature-first architecture with `@/*` path aliases:

```text
AiroG/
├── README.md
├── .env.example
├── vercel.json                      # SPA + /api/* routing
├── index.html
├── package.json
├── tsconfig.json                    # includes "@/*": ["src/*"] path alias
├── vite.config.ts                   # includes "@" resolve alias
├── api/                             # Vercel serverless proxies (env secrets only)
│   ├── _utils.ts                    # DRY CORS allowlisting, error responses, env & timeout guards
│   ├── aqi.ts                       # OpenWeather geocode + current/forecast
│   ├── suggest.ts                   # Geocoding autocomplete proxy
│   └── plan.ts                      # Gemini 3.5 Flash-Lite strict JSON draft & runtime guards
├── docs/                            # Judging & Dual Submission assets
│   ├── ARCHITECTURE.md              # Data flow, CPCB math, deterministic vs AI split
│   ├── PROMPTS.md                   # System prompts & Zod schema rules
│   ├── blog-draft.md                # Medium / Dev.to post
│   └── linkedin-draft.md            # Build-in-public post
└── src/
    ├── app/                         # App shell & global styles
    │   ├── App.tsx                  # Modular root shell (< 120 lines)
    │   ├── index.css
    │   └── hooks/
    │       └── useAirQualityDashboard.ts # Dashboard state, sequence guard & AbortControllers
    ├── components/                  # Shared global layout components
    │   ├── Header.tsx
    │   ├── Footer.tsx
    │   └── ErrorBoundary.tsx        # React component crash isolation
    ├── features/                    # Feature-first modular domain architecture
    │   ├── aqi/                     # CPCB calculation & real-time monitoring
    │   │   ├── api/fetchAqi.ts      # 5-minute session cache + OpenWeather proxy
    │   │   ├── components/          # AqiBadge, AqiLegend, AqiHeroCard, CitySearchBar, AqiStatusBanner, CitySearchAutocomplete
    │   │   ├── data/demo.ts         # 10-city curated Indian fallback dataset
    │   │   ├── utils/aqi.ts         # Deterministic CPCB NAQI math
    │   │   ├── utils/forecastWindow.ts # Diurnal best window & peak smog detection
    │   │   ├── __tests__/           # CPCB unit tests
    │   │   └── index.ts             # Public feature export barrel
    │   ├── household/               # Household demographics & local persistence
    │   │   ├── components/          # HouseholdForm (steppers & toggles)
    │   │   └── utils/storage.ts     # Versioned localStorage ('airog_v1')
    │   ├── plan/                    # AI plan generation & deterministic impact
    │   │   ├── api/plan.ts          # Gemini fetch, Zod schemas & rule fallback
    │   │   ├── components/          # PlanSection, PlanCard, ImpactBar
    │   │   ├── utils/impact.ts      # 0–100 exposure score & rule traces
    │   │   └── __tests__/           # Plan & impact unit tests
    │   └── theme/                   # Theme toggle & dark mode persistence
    │       ├── components/ThemeToggle.tsx
    │       └── hooks/useTheme.ts
    ├── types/                       # Shared domain TypeScript declarations
    │   └── index.ts
    └── main.tsx                     # React entry point
```

> For deep architectural details, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).  
> For Gemini prompt templates and validation schemas, see [docs/PROMPTS.md](docs/PROMPTS.md).

---

## 3. Performance & Bundle Efficiency

To achieve a 95+ Efficiency rating, AiroG employs aggressive code splitting and session-level caching:

| Metric | Before Optimization | After Optimization | Improvement |
| :--- | :--- | :--- | :--- |
| **Initial Critical JS (`index-*.js`)** | **279.98 kB** (84.81 kB gzip) | **183.04 kB** (57.74 kB gzip) | **-96.94 kB (-34.6%) reduction (under 183.5 kB)** |
| **Lazy Plan Engine (`plan-*.js`)** | *bundled in main* | **87.46 kB** (26.09 kB gzip) | Loaded dynamically on calculation |
| **Lazy Household Form (`HouseholdForm-*.js`)** | *bundled in main* | **9.25 kB** (1.69 kB gzip) | Code-split below the fold |
| **Lazy Plan UI (`PlanSection-*.js`)** | *bundled in main* | **14.86 kB** (4.48 kB gzip) | Code-split below the fold |
| **Lazy AQI Legend (`AqiLegend-*.js`)** | *bundled in main* | **2.27 kB** (0.93 kB gzip) | Code-split below the fold |
| **CSS Bundle (`index-*.css`)** | 22.25 kB (4.74 kB gzip) | **29.24 kB** (5.87 kB gzip) | Purged utility CSS + Apple themes |
| **Session Cache** | None | 5-minute in-memory cache | Prevents duplicate city refetches |

---

## 4. Accessibility & Security

- **Accessibility (WCAG 2.1 AA compliant):**
  - **Skip Link:** Accessible `<a href="#main-content">` jump link for instant keyboard navigation.
  - **Persistent Screen Reader Announcements:** Dedicated `role="status" aria-live="polite" aria-atomic="true"` live region announcing state changes, city updates, and plan synthesis results.
  - **Live Autocomplete Feedback:** Screen readers are immediately alerted of available search suggestion counts.
  - **Sequential Heading Order:** Strict semantic progression (`h1` brand $\rightarrow$ `h2` sections $\rightarrow$ `h3` plan categories $\rightarrow$ `h4` action items).
  - **Busy State Indications:** `aria-busy` flags on the plan section during AI synthesis.
  - **Reduced Motion Support:** Global `@media (prefers-reduced-motion: reduce)` removes animations for vestibular-sensitive users.
  - **Full Keyboard Navigation:** Across all interactive elements with visible high-contrast focus rings (`outline: 2px solid var(--accent-blue)`).
  - **Dual Color-Text Pairing:** AQI bands and impact levels are never conveyed by color alone.
- **Security & Hardening:**
  - **Hardened CORS:** Strict origin allowlist (`https://airog.vercel.app`, exact preview deployment origin `https://${process.env.VERCEL_URL}`, and `localhost:5173`/`localhost:3000` in development) with `Vary: Origin`—zero wildcard `*` headers.
  - **Zero Secret Leakage:** Neither `GEMINI_API_KEY` nor `OPENWEATHER_API_KEY` is ever exposed to the client bundle.
  - **Zero instances of `dangerouslySetInnerHTML`** and **zero occurrences of TypeScript `any`**.
  - **Defensive Error Boundaries:** Graceful React `ErrorBoundary` wrappers around lazy chunks with fallback UIs and retry controls.
  - **Input Sanitization:** City queries sanitized against regex `/[^\w\s,.-]/gi` and clamped to $\le 60$ characters. Household demographics bounded between 0 and 20.

---

## 5. End-to-End Data Flow

1. **User Input:** User enters an Indian city or clicks a quick-select pill (e.g., Delhi, Mumbai, Bengaluru, Tirupati) and configures their household demographics in `HouseholdForm` (automatically persisted to `localStorage` under `airog_v1`).
2. **AQI Retrieval:** `/api/aqi` geocodes the city and queries OpenWeather Air Pollution endpoints. If unconfigured or offline, it falls back seamlessly to curated demo data (`src/features/aqi/data/demo.ts`) labeled with a visible `"demo data"` tag.
3. **CPCB Computation:** Pollutant concentrations ($PM_{2.5}, PM_{10}$) are converted into standard CPCB bands via deterministic math.
4. **Forecast Windowing:** Hourly forecast vectors are analyzed to find the 2+ hour minimum-AQI window and peak smog hour.
5. **Plan Synthesis:** `/api/plan` queries Google Gemini 3.5 Flash-Lite to synthesize practical routines. Outdoor items are strictly scheduled within the best window.
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

# Run Vitest unit test suite (84 tests across 9 files)
npm test

# Run strict TypeScript type-checking across both src/ and api/
npm run typecheck

# Create optimized production build
npm run build
```

---

## 8. Test Suite Summary

The automated Vitest test suite (`npm test`) verifies **84 distinct requirements** across 9 test modules:
- `api/__tests__/utils.test.ts` (10 tests): Hardened CORS allowlist, preview origin reflection, exact VERCEL_URL isolation, untrusted vercel subdomain rejection, `Vary: Origin`, method guards (405 + Allow), query sanitization, and environment variable safety.
- `api/__tests__/aqi.test.ts` (12 tests): Serverless AQI endpoint, preflight OPTIONS, city sanitization, direct lat/lon bypass, and error propagation.
- `api/__tests__/suggest.test.ts` (10 tests): Geocoding autocomplete, short query suppression, rate limit edge caching, and fallback Indian locations.
- `api/__tests__/plan.test.ts` (12 tests): Gemini 3.5 Flash-Lite serverless handler, minimal thinking level, payload size limits, category validation, malformed household/window/peak validation, upstream retry on 503, and fallback synthesis.
- `src/features/aqi/__tests__/aqi.test.ts` (17 tests): CPCB breakpoints, boundary edge cases (PM2.5 = 30, 60, 90, 120, 250, 380; PM10 = 50, 100, 250, 350, 430, 510), Delhi AQI 312 Very Poor verification, dominant pollutant evaluation, 6-band color-text pairing, 2-hour best window detection, peak smog hour detection, coordinate handling, suggestion label prefix matching, shouldFetchSuggestions typing guards, sequence concurrency check, and conservative live fallback.
- `src/features/aqi/__tests__/cache.test.ts` (4 tests): In-memory 5-minute session caching and normalized city key deduplication.
- `src/features/plan/__tests__/plan.test.ts` (9 tests): Deterministic fallback generation for vulnerable households, outdoor window scheduling, child/asthma protections, Zod schema validation, category casing normalization, fallback ID generation, and plain-words impact rules.
- `src/features/plan/__tests__/impact.test.ts` (5 tests): Exposure score idempotency ($f(x) = f(x)$), transparent rule traces, `"Comfort, not exposure"` fallback, one-sentence headline generation, and methodology disclosure.
- `src/components/__tests__/ErrorBoundary.test.ts` (5 tests): Class error boundaries, state derivation, graceful fallback UI, and manual retry handlers.

---

## 9. Submission Metadata
- **Challenge:** PromptWars Virtual Challenge 06 (Urban Air Quality Assistant)
- **Built with:** Google Antigravity, React 18, Vite, TypeScript (strict), Tailwind CSS, Zod, Google Gemini 3.5 Flash-Lite, OpenWeather API.
- **License:** MIT
