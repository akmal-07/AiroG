# AiroG — System Architecture & Technical Specifications

> **Urban Air Quality Assistant for Indian Families**  
> Technical documentation of data flow, deterministic math, AI orchestration, and performance architecture.

---

## 1. High-Level Architectural Philosophy

AiroG is engineered around one foundational constraint:

> **Use GenAI for natural language habit synthesis; use deterministic TypeScript math for all calculations, classifications, and safety guarantees.**

Large language models can hallucinate numerical thresholds, invent medical percentages, or drift on regulatory scales. In public health contexts—such as extreme winter smog in North India—families make decisions that directly affect vulnerable members (children, asthmatics, elders). 

AiroG strictly separates concerns:
1. **Deterministic Core:** Regulatory CPCB sub-index math, diurnal minimum/peak detection, 0–100 exposure scores, and rule traces run entirely in pure TypeScript functions with zero AI involvement.
2. **AI Layer:** Google Gemini 2.5 Flash is used solely as a creative synthesis engine for localized, practical lifestyle habits and routines.
3. **Safety Gate:** All AI outputs pass through strict runtime Zod schemas. If any requirement fails, the engine instantly drops the AI output and substitutes a deterministic rule-based plan ("standard plan"). Unvalidated AI output is never rendered.

---

## 2. End-to-End System Data Flow

```
                                      [ User Interaction ]
                               (City Name + Household Demographics)
                                                │
                                                ▼
                                   ┌──────────────────────────┐
                                   │       Client Shell       │
                                   │ (React 18 + Strict TS)   │
                                   └────────────┬─────────────┘
                                                │
                     ┌──────────────────────────┴──────────────────────────┐
                     ▼                                                     ▼
      ┌─────────────────────────────┐                       ┌─────────────────────────────┐
      │   fetchAqiData(city)        │                       │   Household Form Storage    │
      │   (10-minute session cache) │                       │   (localStorage: airog_v1)  │
      └──────────────┬──────────────┘                       └──────────────┬──────────────┘
                     │                                                     │
                     ▼                                                     │
      ┌─────────────────────────────┐                                      │
      │  /api/aqi (Vercel Function) │                                      │
      │  OpenWeather Geocode + AQI  │                                      │
      └──────────────┬──────────────┘                                      │
                     │ (Fallback if key/network fails)                     │
                     ├─────────────────────────► [ Curated Demo Data ]     │
                     ▼                           (10 Indian Metros)        │
      ┌─────────────────────────────┐                                      │
      │  Deterministic CPCB Math    │                                      │
      │  - Linear interpolation     │                                      │
      │  - Sub-index max selection  │                                      │
      │  - 2h best window detection │                                      │
      │  - Peak inversion hour      │                                      │
      └──────────────┬──────────────┘                                      │
                     │                                                     │
                     └──────────────────────────┬──────────────────────────┘
                                                │
                                                ▼
                                   ┌──────────────────────────┐
                                   │  /api/plan (Gemini 2.5)  │
                                   │  Strict JSON Generation  │
                                   └────────────┬─────────────┘
                                                │ (Timeout / Validation failure)
                                                ├─────────────────────────► [ Rule-Based Generator ]
                                                ▼                           ("standard plan")
                                   ┌──────────────────────────┐
                                   │   Zod Schema Validator   │
                                   │   (PlanResponseSchema)   │
                                   └────────────┬─────────────┘
                                                │
                                                ▼
                                   ┌──────────────────────────┐
                                   │ Deterministic Impact     │
                                   │  - 0–100 Exposure Score  │
                                   │  - High/Med/Low Badges   │
                                   │  - Plain-Word Traces     │
                                   └────────────┬─────────────┘
                                                │
                                                ▼
                                   ┌──────────────────────────┐
                                   │  Accessible Presentation │
                                   │  (AqiBadge, ImpactBar,   │
                                   │   PlanSection, Legend)   │
                                   └──────────────────────────┘
```

---

## 3. Regulatory CPCB NAQI Formulation

Most global weather APIs return air pollution as an abstracted 1–5 scale (derived from the US EPA standard). For Indian families, this scale is misleading: an EPA level "5" spans everything from Moderate smog to life-threatening Hazardous inversion.

AiroG implements the official **Central Pollution Control Board (CPCB) National Air Quality Index (NAQI)** standard using linear sub-index interpolation.

### A. Sub-Index Formula
For a given pollutant concentration $C_p$, the sub-index $I_p$ is calculated as:

$$I_p = \frac{I_{\text{hi}} - I_{\text{lo}}}{B_{\text{hi}} - B_{\text{lo}}} \times (C_p - B_{\text{lo}}) + I_{\text{lo}}$$

Where:
- $B_{\text{hi}}$: Breakpoint concentration greater than or equal to $C_p$
- $B_{\text{lo}}$: Breakpoint concentration less than or equal to $C_p$
- $I_{\text{hi}}$: AQI sub-index corresponding to $B_{\text{hi}}$
- $I_{\text{lo}}$: AQI sub-index corresponding to $B_{\text{lo}}$

### B. Official CPCB Breakpoints Table

| Category | AQI Range ($I_{\text{lo}} - I_{\text{hi}}$) | PM2.5 ($\mu\text{g/m}^3$) | PM10 ($\mu\text{g/m}^3$) | Hex Color | Theme Class |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Good** | 0 – 50 | 0.0 – 30.0 | 0.0 – 50.0 | `#16a34a` | `bg-emerald-50 text-emerald-800` |
| **Satisfactory** | 51 – 100 | 30.1 – 60.0 | 50.1 – 100.0 | `#65a30d` | `bg-lime-50 text-lime-800` |
| **Moderate** | 101 – 200 | 60.1 – 90.0 | 100.1 – 250.0 | `#ca8a04` | `bg-amber-50 text-amber-800` |
| **Poor** | 201 – 300 | 90.1 – 120.0 | 250.1 – 350.0 | `#ea580c` | `bg-orange-50 text-orange-800` |
| **Very Poor** | 301 – 400 | 120.1 – 250.0 | 350.1 – 430.0 | `#dc2626` | `bg-rose-50 text-rose-800` |
| **Severe** | 401 – 500 | 250.1+ | 430.1+ | `#7f1d1d` | `bg-red-950 text-red-100` |

### C. Overall AQI Selection
Following CPCB guidelines, the overall AQI is governed by the maximum sub-index among primary particulate drivers:

$$\text{Overall AQI} = \max\Big(\text{SubIndex}(PM_{2.5}), \text{SubIndex}(PM_{10})\Big)$$

*Example (Delhi winter benchmark):*  
With $PM_{2.5} = 135.3\,\mu\text{g/m}^3$ and $PM_{10} = 275.0\,\mu\text{g/m}^3$:
- $PM_{2.5}$ falls in $[120.1, 250.0]$: $\text{SubIndex} = \frac{400 - 301}{250 - 120.1} \times (135.3 - 120.1) + 301 \approx 312$
- $PM_{10}$ falls in $[250.1, 350.0]$: $\text{SubIndex} = \frac{300 - 201}{350 - 250.1} \times (275.0 - 250.1) + 201 \approx 225$
- $\max(312, 225) = 312$ $\rightarrow$ **Very Poor** category.

---

## 4. Diurnal Windowing & Peak Detection Algorithm

Urban winter smog exhibits strong diurnal patterns driven by thermal inversions: surface cooling traps emissions during early morning and late evening, while mid-day solar heating causes mixing and temporary ventilation.

AiroG’s `detectOutdoorWindow` utility analyzes the 24-hour forecast curve deterministically:
1. **Best Window Detection:**
   - Evaluates all contiguous rolling windows of length $\ge 2$ hours.
   - Calculates the average AQI across each window.
   - Selects the slice with the minimum average AQI (typically early afternoon, e.g., *2:00 PM – 4:00 PM*).
2. **Peak Smog Hour:**
   - Scans the vector for the global maximum AQI point (typically late evening, e.g., *Around 8:00 PM*).
3. **Plan Anchoring:**
   - Any outdoor activity in the generated action plan is programmatically injected with the identified window text, preventing vulnerable individuals from venturing out during peak hours.

---

## 5. Deterministic Exposure & Impact Model

To protect users from synthetic or misleading "percentage reductions," AiroG uses an idempotent, traceable scoring model.

### A. Daily Exposure Score ($0 \le S \le 100$)
The daily exposure score represents the net atmospheric and demographic exposure burden for the household:

$$S = \text{clamp}\Big(B_{\text{env}} + \sum V_{\text{household}} - \sum M_{\text{actions}},\, 0,\, 100\Big)$$

1. **Environmental Base ($B_{\text{env}} \le 60$):**
   - Good: $10$
   - Satisfactory: $20$
   - Moderate: $35$
   - Poor: $45$
   - Very Poor: $55$
   - Severe: $60$
2. **Vulnerability Modifiers ($\sum V \le 34$):**
   - Asthmatic present: $+14$
   - Children present: $+10$
   - Elders present: $+10$
3. **Mitigation Credits ($\sum M \le 35$):**
   - HEPA Air Purifier in use: $-14$
   - Shifting outdoor chores to best window: $-8$
   - Wearing N95 particulate mask: $-8$
   - Wet-mopping dust suppression: $-5$

*Property:* **Strict Idempotency** — $S(a, h, p) = S(a, h, p)$. Repeating calculation with identical state produces identical output.

### B. Qualitative Impact Badges & Rule Traces
Each action item is categorized into one of four deterministic tiers:
- **High:** Critical physical barrier to fine particulates (HEPA purifiers in Very Poor air, shifting routines from peak smog to best window).
- **Medium:** Secondary particle reduction (wet mopping, sealing drafty doors, transit shift).
- **Low:** Marginal particulate impact (dietary hydration, localized fan positioning).
- **Comfort:** Non-exposure wellness advice. Formatted honestly as `"Comfort, not exposure."`

---

## 6. Bundle Optimization & Code Splitting Architecture

AiroG satisfies strict performance budgets ($\le 190$ kB initial critical JS) while retaining runtime Zod schema validation:

```
[ initial page load ]
   ├── index-*.js (184.32 kB / 57.11 kB gzip)
   │     ├── React 18 & ReactDOM
   │     ├── AqiBadge, AqiLegend, Header, Footer
   │     ├── HouseholdForm (steppers & storage)
   │     └── CPCB NAQI math & window detection
   │
[ deferred code-split chunks ]
   ├── PlanSection-*.js (11.77 kB / 3.25 kB gzip)
   │     └── React.lazy loaded below-the-fold plan UI
   │
   └── plan-*.js (87.10 kB / 26.02 kB gzip)
         ├── Zod runtime library
         ├── Gemini fetch & retry logic
         └── Deterministic rule fallback engine
```

### Key Invariants:
1. **Dynamic Import for Plan Engine:** `src/features/plan/api/plan.ts` is only fetched when the client initiates plan generation (`await import('@/features/plan/api/plan')`). This isolates `zod` entirely from the critical rendering path.
2. **No Barrel Leakage:** `src/features/plan/` purposefully omits a top-level `index.ts` to prevent bundler tree-shaking failures from pulling heavy validation dependencies into `main`.
3. **Session Cache:** `fetchAqiData` maintains an in-memory 10-minute cache with city-key normalization, eliminating redundant API round-trips.

---

## 7. Security & Privacy Guarantees

1. **Zero Secret Leakage:** Neither `GEMINI_API_KEY` nor `OPENWEATHER_API_KEY` is ever bundled in client code. All external requests route through serverless edge functions (`api/aqi.ts`, `api/plan.ts`).
2. **Input Sanitization:** User city inputs are sanitized against regex `/[^\w\s,.-]/gi` and clamped to 60 characters. Household demographics are bounded between 0 and 20.
3. **Local Storage Privacy:** Household demographic counts and toggles are stored exclusively on the user’s device under `localStorage['airog_v1']`. Zero personal data is transmitted to external telemetry or third-party trackers.
