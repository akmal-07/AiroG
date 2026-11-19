# AiroG — Complete Build Handoff (for Argon)

Paste this whole document into Argon as the context, then work through the 7 bits in order. Everything needed to build the app and aim for Rank #1 is in here. FINAL version — all decisions locked: name AiroG, data hybrid (live OpenWeather + demo fallback), forecast window included, no fixed day-by-day schedule (build ASAP), working deadline ~Nov 28–29 (not official).

## 1. Who I am

Mohammed Akmal Kanna Mangalam. B.Tech AI & ML student, V semester, Aditya University, Surampalem. GitHub: `akmal-07`. Home: Tirupati.

I built Planovent for PromptWars Challenge 5 (React + Vite + TypeScript + Tailwind, Gemini, deterministic math) — AI score 94.47/100, rank #559 of 51,762. This is Challenge 6. Target: Rank #1.

## 2. The competition (verified facts)

- PromptWars Virtual, Hack2skill with Google for Developers, in partnership with Build with AI. Free, virtual, India-only.
- Challenge 06: Urban Air Quality Assistant. Status: On-going. Released Mon 16 Nov 2026.
- NO calendar start/deadline date is published on the official page (promptwars.in/promptwarsVirtual.html), and no timezone is stated — only a 14-day cycle: release, submission by Day 13, evaluation/announcement Day 14. The page itself is inconsistent (Monday release vs FAQ "every Friday").
- Working estimate ONLY, not official: counting from the Mon 16 Nov release, Day 13 lands ~Sat 28–Sun 29 Nov. Treat that as the outer bound. Do NOT state a deadline as official, and do not add a calendar deadline until the submission portal shows an exact time. Submit early, never on the last day.
- Dual Submission is required to qualify: (1) GitHub repo + live deployed link, (2) narrative — technical blog on Medium/Dev.to + LinkedIn build-in-public post.
- No demo-video requirement is mentioned on the page (unlike Challenge 5).
- No numeric submission cap is stated on the page (Challenge 5 allowed 3 attempts).
- Must use Google Antigravity — the official FAQ says using Google Antigravity is a requirement for all submissions. CAUTION: if Argon is a separate tool from Antigravity, keep the final build/submission in Antigravity (or confirm Argon counts). Do not risk disqualification on a technicality.
- Rewards: Prompt Credits by rank (Rank 1: 5,000 per challenge, down to Rank 301–400: 500), expiring 1 Jan 2027. Consistency bonuses: Top 50 for 3 challenges in a row 25,000 PC, for 8 in a row 90,000 PC.

## 3. The app

- **Name:** AiroG — Airo (air) + G (guardian). "Air guardian" in shorthand. Repo name: `AiroG`. localStorage key: `airog_v1`. Tagline: "Clear air, made simple."
- **Problem:** a family in a smog-hit Indian city sees an AQI number and has no idea what to actually do today.
- **User:** a parent with kids or elders at home, deciding when to go out, when to shut the windows, what to run indoors.
- **Core flow (the ONE wow flow, end to end, flawless):** location + household → live AQI + today's outlook (hourly forecast → the day's best outdoor window, e.g. 'smog peaks at 8 PM, best window 2–4 PM') → a personalised low-emission day plan (routines, indoor hacks, greener alternatives) → every suggestion explains its impact in plain words.
- **Non-goals:** no login/accounts, no multi-city dashboard, no 7-day forecast, no community/social features, no hardware integration.
- **Design:** light theme, clean, calm, trustworthy, mobile-first. AQI is always shown as colour + text label, never colour alone. Accessible from the start (semantic HTML, aria labels, visible focus states, contrast that passes).

## 4. Tech stack, architecture, and where the AI is used

- **Stack:** React + Vite + TypeScript (strict, no `any`) + Tailwind. Gemini via a serverless `/api/*` proxy. Deterministic TypeScript math for AQI and impact numbers — never trust the AI for a number.
- **Folder structure:**
  - `src/App.tsx` — single-page app shell (header, main, footer).
  - `src/lib/aqi.ts` — CPCB AQI helpers (band from a number, colour + label, deterministic AQI computation from PM2.5/PM10).
  - `src/lib/types.ts` — TypeScript types (see Bit 1).
  - `src/lib/storage.ts` — localStorage helper, key `airog_v1` (household profile, JSON, versioned).
  - `src/lib/plan.ts` — deterministic rule-based plan generator (fallback) + plan logic.
  - `src/lib/impact.ts` — deterministic impact model (plain-words impact lines + exposure score).
  - `src/lib/fetchAqi.ts` — AQI fetcher (live proxy, demo fallback).
  - `src/components/` — Header, Footer, AqiBadge, AqiLegend, HouseholdForm, CityPicker, PlanCard, ImpactBar.
  - `src/data/demo.ts` — realistic demo AQI data for Indian cities.
  - `api/` — serverless functions (`/api/aqi`, `/api/plan`). API keys in env vars only, never in code or the repo.
- **Data flow (plain words — I must be able to explain this cold):** the user enters their city and household → the app fetches the live AQI + hourly forecast (or demo data if the key/network fails) → TypeScript computes the CPCB band from the pollutant numbers and the day's best outdoor window from the forecast (the lowest-AQI stretch) → Gemini drafts the day plan from the AQI + best window + household, returning strict JSON → TypeScript validates that JSON and computes every number (impact, exposure score) → the plan renders with impacts → the household profile is saved in localStorage.
- **Where the AI is actually used:** Gemini drafts the day plan only — the routines, indoor hacks, alternatives, and their plain-words explanations — from the AQI + household context, under a strict Zod schema. Everything numeric (the AQI band, the impact figures, the exposure score, any totals) is computed in TypeScript. The AI never decides a number.
- **The non-trivial part to understand deeply:** the CPCB AQI computation from raw PM2.5/PM10 concentrations via CPCB breakpoints, and the deterministic rule-based plan fallback (Bit 3) — the plan logic is rules + AI draft, with numbers always in TypeScript.

## 5. AQI system (CPCB Indian scale — NOT US EPA)

- Bands: Good 0–50 green, Satisfactory 51–100 light green, Moderate 101–200 yellow, Poor 201–300 orange, Very Poor 301–400 red, Severe 401–500 dark red. Use the standard colour for each band.
- The overall AQI is computed from PM2.5 and PM10 via CPCB breakpoints (deterministic function in `src/lib/aqi.ts`). Example from the announcement: AQI 312 = Very Poor.
- Pollutants tracked: PM2.5, PM10 (primary), plus NO2, O3, CO, SO2 where the API returns them.
- OpenWeather's Air Pollution API returns a 1–5 scale (US-EPA-style) — do NOT display that. Convert to CPCB via the deterministic function.
- Demo data: realistic curated AQI for Delhi, Mumbai, Bengaluru, Chennai, Kolkata, Hyderabad, Pune, Jaipur, Tirupati, Kakinada. Delhi must include a Very Poor example (AQI ~312, high PM2.5). Demo data is always labelled "demo data" in the UI when the fallback is active.
- **Forecast (the best window):** the OpenWeather forecast endpoint gives hourly AQI for the hours ahead. TypeScript finds the day's best outdoor window (the lowest-AQI stretch of 2+ hours, e.g. 2–4 PM) and the peak (e.g. 8 PM) — deterministically, no AI. The plan schedules outdoor items inside the best window; the day summary shows it. Demo data includes a realistic hourly forecast (Delhi: worst in the evening, best in the early afternoon).

## 6. Data approach (default: hybrid)

- **Live:** OpenWeather Air Pollution API (free tier) via the serverless `/api/aqi` proxy. Steps: sign up at openweathermap.org → API keys → create a free key → add it as an env var in hosting (Vercel) and in a local `.env` file. NEVER commit `.env` or any key. The key is never logged and never returned to the client.
- **Fallback:** demo data (`src/data/demo.ts`) when the key is missing or the network/API fails. The app must never break and must label demo data clearly.
- **If demo-only is preferred:** skip the proxy; Bit 2 uses demo data only. This is acceptable but weaker (real data is the wow factor and the alignment).
- **Gemini key:** same rule — env vars only, via the serverless `/api/plan` proxy, never in code.

## 7. Rank #1 plan — what the score demands

The AI evaluation scores six criteria (same engine as Challenge 5). My Challenge 5 scores: Code Quality 89, Security 98, Efficiency 80, Testing 99, Accessibility 98, Problem Statement Alignment 100. Overall 94.47/100, rank #559 of 51,762.

- **Efficiency (80 → target 95+):** the biggest gap. Fast load, no wasted renders, lazy-load below-the-fold sections, memoize plan rendering, cache the AQI fetch per session (no refetch of the same city within 10 minutes), small bundle, no unused dependencies.
- **Code Quality (89 → target 95+):** TypeScript strict, no `any`, no dead code, no unused imports, clean typed structure, logic in `src/lib/*` (testable) not inside components, consistent patterns.
- **Hold the rest:** Security 98 (no secrets in code, env-only keys, input validation, no `dangerouslySetInnerHTML`), Testing 99 (tests for AQI math, plan fallback, impact model — all passing), Accessibility 98 (keyboard flow, screen-reader labels, colour + text always, contrast), Alignment 100 (the app must do exactly what the problem asks: families, smog, routines, indoor hacks, alternatives, impact explained — nothing off-brief).
- **The forecast window is a differentiator:** the brief asks for alternatives 'tailored to schedule' — naming the day's best outdoor window from the forecast is exactly that, and most entries won't do it (they show a single AQI number).
- **New this time:** Dual Submission is required to qualify — the blog + LinkedIn post are part of the submission, not optional extras. Do them properly (Bit 6).

## 8. The build — 7 bits in order

No fixed day-by-day schedule — build the bits in order as fast as possible, with a verification gate after each bit. Do NOT start the next bit until the current one is verified green (build passes, no console errors, the bit's checks pass). After each bit, report PASS or the exact blocker. Working deadline (outer bound, not official): ~Sat 28–Sun 29 Nov. Submit early, never on the last day.

### Bit 1 — Scaffold

```
Bit 1 — Scaffold AiroG

Build a new React + Vite + TypeScript + Tailwind app called AiroG — a GenAI air-quality assistant that helps Indian families navigate winter smog. This bit is the scaffold only: project shell, design system, domain types, and a placeholder home page. No AQI data and no plan logic yet — those are later bits. Do not build them now.

Structure:
- src/App.tsx — single-page app shell (header, main, footer).
- src/lib/aqi.ts — CPCB AQI helpers (band from a number, colour + label; no data fetching here).
- src/lib/types.ts — TypeScript types: AqiReading { city, aqi, pm25, pm10, category, updatedAt }, Household { adults, children, elders, hasAsthma, hasPurifier }, PlanItem { id, title, detail, impact, category }, DayPlan { date, city, aqi, items }.
- src/lib/storage.ts — localStorage helper using key `airog_v1` (load/save the household profile; JSON, versioned).
- src/components/ — Header, Footer, AqiBadge, AqiLegend.
- src/data/demo.ts — empty for now (demo AQI data comes in Bit 2); do not invent data here.

Design:
- Light theme, clean, calm, trustworthy. Mobile-first.
- CPCB AQI bands (Indian scale, NOT US EPA): Good 0–50 green, Satisfactory 51–100 light green, Moderate 101–200 yellow, Poor 201–300 orange, Very Poor 301–400 red, Severe 401–500 dark red. Use the standard colour for each band.
- AQI is always shown as colour + text label, never colour alone.
- Typography: one clean sans font, clear hierarchy. No lorem ipsum anywhere; real copy only.
- Accessible from the start: semantic HTML, aria labels on interactive elements, visible focus states, contrast that passes.

Home page (placeholder for now):
- Header: "AiroG" + tagline "Clear air, made simple." + a one-sentence line explaining the app.
- AQI legend: all six CPCB bands with colour + label + range.
- An empty state where today's plan will go: "Enter your city to see today's plan." (Inputs and logic come in Bits 2–3; do not build them now.)

Quality rules (these are scored — last time Efficiency was 80 and Code Quality 89, and this build must fix both):
- TypeScript strict, no `any`, no unused imports/variables, no dead code.
- No dependencies beyond React, Vite, Tailwind (and their types). Lazy-load anything heavy.
- No secrets or API keys in code — keys live in env vars only (serverless proxy comes in a later bit).
- No emojis as UI icons; use text labels or simple SVG.

Verify before finishing: `npm run build` passes with no errors, `npm run dev` serves the app, the home page renders header + legend + empty state, no console errors, and the localStorage key `airog_v1` is created when the app loads. Report PASS or the exact blocker.
```

### Bit 2 — AQI data layer (live API + demo fallback)

```
Bit 2 — AQI data layer (live API + demo fallback)

Build the AQI data layer for AiroG. Do not touch the plan logic (Bit 3) or the UI beyond wiring the AQI display to real data.

0. API key (do this first): sign up at openweathermap.org, create a free API key (API keys section). Add it as an env var in your hosting (Vercel) and in a local .env file. NEVER commit .env or the key. If you skip this step, the app runs on demo data only — acceptable but weaker.

1. Serverless proxy: create /api/aqi (serverless function) that takes a city name, geocodes it, calls the OpenWeather Air Pollution API (current + forecast endpoints), and returns { city, aqi, pm25, pm10, no2, o3, co, so2, updatedAt, forecast: [{ time, aqi, pm25, pm10 }] }. The API key comes from env vars only — never hardcode it, never log it, never return it to the client. If the key is missing or the API call fails, the proxy returns a clear error (not fake data).
2. Client fetcher: src/lib/fetchAqi.ts — calls /api/aqi, and on any failure falls back to src/data/demo.ts. The fallback must be labelled in the UI as "demo data" (a small visible tag, not hidden).
3. Demo data: src/data/demo.ts — realistic curated AQI for Delhi, Mumbai, Bengaluru, Chennai, Kolkata, Hyderabad, Pune, Jaipur, Tirupati, Kakinada. Each entry: city, aqi, pm25, pm10, category (from the CPCB band), updatedAt, forecast (hourly AQI for the rest of today — realistic: Delhi worst in the evening, best in the early afternoon). Delhi must include a Very Poor example (AQI ~312, high PM2.5) since that is the announcement example.
4. CPCB computation: in src/lib/aqi.ts, add a function that computes the overall AQI band from PM2.5 and PM10 using CPCB breakpoints (deterministic, tested). The band shown in the UI must always come from this function, never from the API's own AQI scale (OpenWeather returns a 1–5 US-EPA-style scale — do NOT display that; convert via CPCB).
5. Wire the home page: the AQI badge and legend now show the live (or demo) reading for the selected city, with colour + text label + pollutant values (PM2.5, PM10). Default city on first load: Delhi (the smog example). Loading state while fetching; clear error state if both live and demo fail (demo data should make this nearly impossible — if it happens, show a retry button, never a blank screen).
6. Best window: in src/lib/aqi.ts, add a function that finds the day's best outdoor window from the forecast (the lowest-AQI stretch of 2+ hours) and the peak hour — deterministic, no AI. The home page shows the best window ('Best window today: 2–4 PM') and the peak ('Smog peaks around 8 PM').

Quality rules: TypeScript strict, no `any`, no dead code. No secrets in code. Handle every failure path (no key, network down, API error, unknown city) with a visible state, never a crash or blank screen. Keep the fetch logic small and testable.

Verify before finishing: `npm run build` passes; with no API key set, the app loads Delhi demo data with the "demo data" label; with a key set (if available), a live city returns real data; the forecast loads (live or demo) and the best window + peak render correctly; an unknown city shows a clear error + retry; no console errors. Report PASS or the exact blocker.
```

### Bit 3 — Today's plan engine (Gemini draft + deterministic numbers)

```
Bit 3 — Today's plan engine (Gemini draft + deterministic numbers)

Build the plan engine for AiroG. The AQI layer (Bit 2) is done; do not rebuild it.

1. Household form: src/components/HouseholdForm — adults, children, elders (counts), hasAsthma (yes/no), hasPurifier (yes/no). Saved to localStorage (`airog_v1`) on change; loaded on start. City picker: text input + a short list of the demo cities; free text allowed.
2. Serverless proxy: /api/plan — takes { city, aqi, pm25, pm10, category, bestWindow, peak, household } and calls Gemini with a strict instruction: return ONLY JSON matching the PlanItem schema (see types), 5–8 items across three categories (routines, indoor hacks, greener alternatives), each with title, detail (1–2 sentences, plain words), impact (a short plain-words explanation of what it changes and why), and category. Outdoor items must be scheduled inside the best window, and the plan must say so. No numbers in the AI's impact text — numbers are computed in TypeScript (Bit 4), so the AI must not invent percentages.
3. Schema validation: Zod schema for the plan JSON (PlanItem + DayPlan). If Gemini returns invalid JSON or a wrong shape, retry once; if it still fails, fall back to a deterministic rule-based plan (built from the AQI band + household, in src/lib/plan.ts) and label it "standard plan" (not AI-generated). Never render unvalidated AI output, never crash on bad JSON.
4. Rule-based fallback: src/lib/plan.ts — a deterministic plan generator (no AI) that builds a sensible day plan from the AQI band + household (e.g., Very Poor + kids + asthma → keep windows shut in the morning, run the purifier, no outdoor exercise, mask if going out). This is the part to understand deeply: the plan logic is rules + AI draft, with numbers always in TypeScript.
5. Render: the home page now shows today's plan as cards (one per item, grouped by category), each with title, detail, and a placeholder for impact (Bit 4 fills the numbers). Loading state while Gemini drafts; error state with retry if both AI and fallback fail (should not happen — the fallback is local).

Quality rules: TypeScript strict, no `any`. Gemini key in env vars only. Never trust the AI for a number. Never render unvalidated JSON. Keep the plan logic in src/lib/plan.ts (testable), not inside components.

Verify before finishing: `npm run build` passes; entering Delhi + a household with kids produces a plan with 5–8 items across all three categories, with outdoor items scheduled inside the best window; the fallback plan renders when Gemini is unavailable (simulate by removing the key); invalid AI JSON does not crash the app; no console errors. Report PASS or the exact blocker.
```

### Bit 4 — Impact explainer (deterministic numbers, plain words)

```
Bit 4 — Impact explainer (deterministic numbers, plain words)

Build the impact layer for AiroG. The plan engine (Bit 3) is done; do not rebuild it.

1. Impact model: src/lib/impact.ts — deterministic functions that compute, for each plan item, a plain-words impact line + a simple numeric indicator, from the AQI band + household + item category. Rules (fixed, transparent, no AI): e.g., running a purifier while AQI is Very Poor lowers indoor PM2.5 exposure for the hours it runs; avoiding outdoor exercise during peak smog hours avoids the highest-exposure window; a mask (N95) reduces inhaled particles when outside is unavoidable. Numbers are relative indicators (e.g., "high / medium / low impact" + a simple exposure score 0–100 for the day), computed from the band and the items — never invented by the AI, never a fake precise percentage. Show the method in one line ("Impact is estimated from the AQI band and your household — not measured").
2. Render: each plan card now shows its impact line + an impact badge (High/Medium/Low). Add a day summary at the top of the plan: today's AQI band, the best outdoor window + peak (from Bit 2), the day's exposure score (0–100, deterministic), and one sentence summarising the day ("Today is a stay-indoors day for the kids" — derived from the band + household, not the AI).
3. Honesty: every impact line must be traceable to the rule that produced it (no black-box claims). If an item has no measurable impact, say so plainly ("Comfort, not exposure") rather than inventing one.

Quality rules: TypeScript strict, no `any`. All numbers computed in src/lib/impact.ts (testable), never in components, never from the AI. No fake precision — use bands and plain words, not decimal percentages.

Verify before finishing: `npm run build` passes; every plan item shows an impact line + badge; the day summary renders with the best window + peak and a consistent exposure score (same inputs → same score); the method line is visible; no console errors. Report PASS or the exact blocker.
```

### Bit 5 — Polish: accessibility, testing, efficiency

```
Bit 5 — Polish: accessibility, testing, efficiency

Polish AiroG for the Rank #1 scores. Do not add features — feature freeze is now in effect: no new features after this bit.

1. Accessibility: keyboard navigation through the whole flow (city input → household form → plan cards); screen-reader labels on every interactive element; AQI never conveyed by colour alone (colour + text everywhere); contrast passes; focus states visible. Fix anything the audit finds.
2. Testing: add tests for src/lib/aqi.ts (CPCB band computation — include the AQI 312 → Very Poor case — and the best-window function: the lowest-AQI stretch is picked, the peak is the highest), src/lib/plan.ts (fallback plan for Very Poor + kids + asthma), src/lib/impact.ts (same inputs → same score). Tests must pass.
3. Efficiency (the 80-score fix): measure the production bundle; remove unused dependencies; lazy-load the plan section (it is below the fold on first paint); memoize the plan rendering (no re-render on unrelated state changes); cache the AQI fetch for the session (do not refetch the same city within 10 minutes). Record the before/after bundle size in a comment or the README.
4. Security: confirm no secrets in code (grep for API keys); env-only keys; validate all inputs (city text, household numbers) before use; no `dangerouslySetInnerHTML` anywhere.
5. Remove all dead code, unused imports, and placeholder text. Every string in the UI is real copy.

Verify before finishing: `npm run build` passes; tests pass; the app is fully keyboard-navigable; no a11y errors in the audit; bundle size recorded; no secrets in code. Report PASS or the exact blocker.
```

### Bit 6 — Deploy + Dual Submission assets

```
Bit 6 — Deploy + Dual Submission assets

Ship AiroG. Do not add features.

1. Deploy: push to GitHub (repo `AiroG`, public, under akmal-07) and deploy to a live URL (Vercel). Add the API keys (OpenWeather, Gemini) as env vars in Vercel — never in the repo. Confirm the live URL loads the app, the AQI fetch works there, and the demo fallback works with no keys. Repo description (GitHub About field): "GenAI air-quality assistant for Indian families in winter smog — live CPCB AQI, a personalised low-emission day plan for your household, and every suggestion explained in plain words." Topics: air-quality, aqi, gemini, genai, react, vite, typescript, india, smog, health.
2. Record a backup demo: a short screen recording (2–3 min) of the core flow (Delhi, Very Poor → today's plan → impacts). Keep the file safe; it is the backup if the live demo fails.
3. Blog: draft the technical blog (for Medium/Dev.to) — problem, how it works (AQI → plan → impact), architecture, where the AI is used and where the math is deterministic, what was learned. Real, specific, no filler.
4. LinkedIn: draft the build-in-public post — the problem + a concrete user story (a parent in Delhi on a smog morning), the live link, one line on how it works. Not a tech-stack list.

Verify before finishing: live URL loads with no errors; GitHub repo is public and clean (no secrets, README present); demo recording saved; blog + LinkedIn drafts ready to publish. Report PASS or the exact blocker.
```

### Bit 7 — Final verification + submit

```
Bit 7 — Final verification + submit

Final pass on AiroG. Do not add features.

1. Full check: `npm run build` passes; live URL loads; AQI works (live or demo-labelled); forecast loads and the best window + peak show; plan renders for Delhi AQI 312 with outdoor items inside the best window; impacts present; no console errors; no secrets in the repo; README complete (what it is, live link, stack, how to run).
2. Submit via the PromptWars portal (the human does the submit — do not sign in on his behalf): GitHub repo + live link, plus the blog + LinkedIn post (Dual Submission). Submit early — the working deadline is ~Sat 28–Sun 29 Nov, and the rule is never submit on the last day.
3. Record the result: rank/score when announced, and note what to improve next time.

Verify before finishing: every check above is green. Report PASS or the exact blocker.
```

## 9. Submission checklist (when all 7 bits are green)

- [ ] GitHub repo `AiroG` public, clean, README complete, no secrets.
- [ ] Live deployed URL loads with no errors; AQI works (live or demo-labelled).
- [ ] Plan renders for Delhi AQI 312 with impacts on every item and outdoor items inside the best window.
- [ ] Forecast loads; best window + peak show correctly.
- [ ] Blog draft (Medium/Dev.to) + LinkedIn post draft ready.
- [ ] Backup demo recording saved.
- [ ] Submit via the portal (human does it). Early, never the last day.
- [ ] Record rank/score when announced.
