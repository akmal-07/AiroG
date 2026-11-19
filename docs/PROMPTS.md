# AiroG — GenAI Prompts & Validation Specification

> **Prompt engineering, schema constraints, and validation gates governing the AiroG daily action plan engine.**

---

## 1. Prompt Engineering Strategy

In AiroG, the Large Language Model (Google Gemini 1.5 Flash) is treated as an **untrusted creative drafting tool**. While LLMs excel at generating contextually varied, empathetic domestic advice, they are prone to inventing quantitative impact metrics (e.g., claiming "this tea cleanses 34% of PM2.5 from lungs").

To maintain absolute scientific and medical integrity:
1. **The prompt explicitly forbids numbers and percentages in the impact field.** All numerical calculations (AQI sub-indices, 0–100 exposure scores, reduction points) are computed deterministically in TypeScript.
2. **The prompt enforces anchoring to the diurnal best window.** Any outdoor activity must be scheduled within the mathematically proven lowest-smog interval.
3. **The output is constrained to strict JSON** conforming to a pre-defined Zod schema.

---

## 2. Gemini 1.5 Flash System Prompt (`api/plan.ts`)

```text
You are AiroG, a specialized urban air quality advisor helping an Indian family navigate winter smog.
Generate a tailored daily action plan for:
- City: {{city}}
- AQI: {{aqi}} (CPCB Category: {{category}})
- PM2.5: {{pm25}} µg/m³, PM10: {{pm10}} µg/m³
- Best Outdoor Window: {{bestWindow.windowText}} (Avg AQI: {{bestWindow.averageAqi}})
- Peak Smog Hour: {{peak.hour}} (Peak AQI: {{peak.aqi}})
- Household: {{household.adults}} adult(s), {{household.children}} child(ren), {{household.elders}} elder(s)
- Asthma/Respiratory Sensitivity: {{household.hasAsthma ? 'YES' : 'NO'}}
- HEPA Air Purifier: {{household.hasPurifier ? 'YES' : 'NO'}}

REQUIREMENTS:
1. Provide exactly 5 to 8 concrete, practical plan items distributed across these 3 categories:
   - "routines" (daily habits, window opening/closing schedule, shifting errands)
   - "indoor hacks" (air purifier usage, wet mopping, cooking ventilation, indoor isolation)
   - "greener alternatives" (commute modes, avoiding open burning, reducing household emissions)
2. CRITICAL: Any outdoor activity (errands, walking, commuting) MUST be scheduled strictly inside the best window: "{{bestWindow.windowText}}" and the detail MUST explicitly name this window.
3. Protect vulnerable family members ({{vulnerabilitySummary}}) by restricting morning/evening outdoor exposure.
4. Detail must be 1-2 actionable, concise sentences in plain words.
5. STRICT NUMBERS RULE: In the "impact" field, provide a short plain-words explanation of what the action changes and why. DO NOT USE ANY NUMBERS OR PERCENTAGES in the impact field. Numbers will be calculated separately by deterministic code.
6. Return ONLY valid JSON in this schema:
{
  "items": [
    {
      "id": "string",
      "title": "string",
      "detail": "string",
      "impact": "string",
      "category": "routines" | "indoor hacks" | "greener alternatives"
    }
  ]
}
```

### Generation Configuration:
- **Model:** `gemini-1.5-flash`
- **Temperature:** `0.2` (low temperature for deterministic adherence to rules)
- **Response MIME Type:** `application/json`

---

## 3. Runtime Zod Schema Definition

All responses returned from the serverless edge proxy are passed through runtime Zod validators in `src/features/plan/api/plan.ts`:

```typescript
import { z } from 'zod';

export const PlanItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(3).max(120),
  detail: z.string().min(10).max(300),
  impact: z.string().min(3).max(180),
  category: z.enum(['routines', 'indoor hacks', 'greener alternatives']),
});

export const PlanResponseSchema = z.object({
  items: z.array(PlanItemSchema).min(5).max(8),
});
```

### Validation Gates & Error Handling:
1. **Category Whitelist:** Only `'routines'`, `'indoor hacks'`, and `'greener alternatives'` are permitted. Any unexpected category triggers rejection.
2. **Item Count Boundary:** Responses with fewer than 5 or more than 8 items are rejected.
3. **Automatic Client Retry:** If the first API response fails schema parsing, the client automatically executes one retry.
4. **Deterministic Rule Fallback:** If the retry fails or the server returns an error (e.g., missing API key, network timeout), the engine immediately invokes `generateRuleBasedPlan()`.

---

## 4. Deterministic Rule-Based Fallback Engine

When Gemini is unavailable, the deterministic fallback engine (`src/features/plan/api/plan.ts`) constructs an expert-curated plan based on fixed rules:

1. **Outdoor Activity Constraint:**
   - Always builds an item titled *"Shift Outdoor Chores to Best Window"*.
   - Detail explicitly embeds `bestWindow.windowText` (e.g., `"Schedule all grocery runs and outdoor errands between 2:00 PM – 4:00 PM when atmospheric inversion lifts."`).
2. **Indoor Protection:**
   - If `household.hasPurifier === true`: Builds *"Run HEPA Air Purifier continuously in living and sleep areas"*.
   - If `household.hasPurifier === false`: Builds *"Create a sealed clean room with damp cloth door barriers and wet mopping"*.
3. **Vulnerable Group Protection:**
   - If `household.children > 0`: Builds *"Indoor play schedule during morning and evening smog peaks"*.
   - If `household.hasAsthma === true`: Builds *"Keep prescribed inhalers accessible and avoid cold morning outdoor drafts"*.
   - If `household.elders > 0`: Builds *"Gentle indoor breathing exercises and warm steam hydration"*.
4. **Greener Alternatives:**
   - Builds *"Switch to metro/shared public transit and avoid personal vehicle idling"*.
   - Builds *"Ensure kitchen exhaust is active; avoid burning incense or mosquito coils"*.

The fallback plan is tagged with `planType: "standard plan"` and `isFallback: true` for complete user transparency.

---

## 5. Sample Input and Validated Output

### Sample Input Payload to `/api/plan`:
```json
{
  "city": "Delhi",
  "aqi": 312,
  "pm25": 135.3,
  "pm10": 275.0,
  "category": "Very Poor",
  "bestWindow": {
    "windowText": "2:00 PM – 4:00 PM",
    "averageAqi": 235,
    "category": "Poor"
  },
  "peak": {
    "hour": "8:00 PM",
    "aqi": 368
  },
  "household": {
    "adults": 2,
    "children": 2,
    "elders": 1,
    "hasAsthma": true,
    "hasPurifier": true
  }
}
```

### Sample Validated Response:
```json
{
  "items": [
    {
      "id": "item-1",
      "title": "Shift Outdoor Tasks to Afternoon",
      "detail": "Conduct essential errands strictly between 2:00 PM – 4:00 PM when winter inversion partially clears.",
      "impact": "Avoids extreme particulate peaks during morning and evening rush hours.",
      "category": "routines"
    },
    {
      "id": "item-2",
      "title": "Restrict Children & Elders Outdoors",
      "detail": "Keep children and grandparents indoors before 11:00 AM and after 6:00 PM.",
      "impact": "Protects developing and sensitive lung tissues from direct toxic exposure.",
      "category": "routines"
    },
    {
      "id": "item-3",
      "title": "Continuous HEPA Filtration",
      "detail": "Run your air purifier in the bedroom and main family space with windows sealed.",
      "impact": "Substantially clears fine inhalable PM2.5 from indoor breathing zones.",
      "category": "indoor hacks"
    },
    {
      "id": "item-4",
      "title": "Asthma Action Readiness",
      "detail": "Ensure rescue inhalers are kept at room temperature and accessible throughout the home.",
      "impact": "Prevents severe bronchospasms triggered by cold smog particulate infiltration.",
      "category": "indoor hacks"
    },
    {
      "id": "item-5",
      "title": "Adopt Metro Transit for Commute",
      "detail": "Take the metro instead of driving a personal vehicle to lower personal and urban emissions.",
      "impact": "Reduces localized vehicular exhaust and roadside particle exposure.",
      "category": "greener alternatives"
    }
  ]
}
```
