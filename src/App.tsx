import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AqiLegend } from './components/AqiLegend';
import { AqiBadge } from './components/AqiBadge';
import { HouseholdForm } from './components/HouseholdForm';
import { initStorage, loadHousehold } from './lib/storage';
import { fetchAqiData } from './lib/fetchAqi';
import { computeItemImpact, generateDaySummary } from './lib/impact';
import type { AqiFetchResult, DayPlan, Household, PlanItem } from './lib/types';

// Code-split below-the-fold PlanSection for optimal initial bundle efficiency
const PlanSection = React.lazy(() =>
  import('./components/PlanSection').then((m) => ({ default: m.PlanSection }))
);

const POPULAR_CITIES = [
  'Delhi',
  'Mumbai',
  'Bengaluru',
  'Kolkata',
  'Chennai',
  'Hyderabad',
  'Tirupati',
] as const;

// Accessible skeleton fallback while PlanSection bundle loads
const PlanSectionSkeleton: React.FC = () => (
  <div
    role="status"
    aria-label="Loading today's action plan section"
    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 animate-pulse space-y-4"
  >
    <div className="h-6 w-56 rounded-md bg-slate-200" />
    <div className="h-4 w-72 rounded-md bg-slate-100" />
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="h-24 rounded-xl bg-slate-100" />
      <div className="h-24 rounded-xl bg-slate-100" />
      <div className="h-24 rounded-xl bg-slate-100" />
    </div>
  </div>
);

/**
 * Sanitizes and validates user city input (max 60 chars, trimmed, stripped of unsafe symbols).
 */
function sanitizeCityInput(input: string): string {
  return input
    .trim()
    .replace(/[^\w\s,.-]/gi, '')
    .slice(0, 60);
}

export const App: React.FC = () => {
  const [cityInput, setCityInput] = useState('Delhi');
  const [activeCity, setActiveCity] = useState('Delhi');
  const [loadingAqi, setLoadingAqi] = useState(true);
  const [aqiError, setAqiError] = useState<string | null>(null);
  const [aqiResult, setAqiResult] = useState<AqiFetchResult | null>(null);

  const [household, setHousehold] = useState<Household>(() => initStorage());
  const [plan, setPlan] = useState<DayPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  // Load Day Plan when AQI result or household changes
  const loadPlanForCurrentState = useCallback(
    async (currentAqi: AqiFetchResult, currentHousehold: Household) => {
      setLoadingPlan(true);
      setPlanError(null);

      try {
        const { fetchDayPlan } = await import('./lib/plan');
        const generated = await fetchDayPlan({
          city: currentAqi.reading.city,
          aqi: currentAqi.reading.aqi,
          pm25: currentAqi.reading.pm25,
          pm10: currentAqi.reading.pm10,
          category: currentAqi.reading.category,
          bestWindow: currentAqi.bestWindow,
          peak: {
            hour: currentAqi.bestWindow.peakHour,
            aqi: currentAqi.bestWindow.peakAqi,
          },
          household: currentHousehold,
        });

        // Attach deterministic impact models to each item
        const enrichedItems: PlanItem[] = generated.items.map((item) => ({
          ...item,
          computedImpact: computeItemImpact(item, currentAqi.reading.category, currentHousehold),
        }));

        const summary = generateDaySummary(
          currentAqi.reading.aqi,
          currentAqi.reading.category,
          currentHousehold,
          enrichedItems
        );

        setPlan({
          ...generated,
          items: enrichedItems,
          summary,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unable to generate day plan.';
        setPlanError(msg);
      } finally {
        setLoadingPlan(false);
      }
    },
    []
  );

  const loadCityData = useCallback(
    async (rawCityName: string) => {
      const sanitized = sanitizeCityInput(rawCityName);
      if (!sanitized) return;

      setLoadingAqi(true);
      setAqiError(null);

      try {
        const result = await fetchAqiData(sanitized);
        setAqiResult(result);
        setActiveCity(result.reading.city);

        // Immediately trigger plan calculation
        const currentProfile = loadHousehold();
        void loadPlanForCurrentState(result, currentProfile);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to retrieve air quality data.';
        setAqiError(msg);
        setAqiResult(null);
        setPlan(null);
      } finally {
        setLoadingAqi(false);
      }
    },
    [loadPlanForCurrentState]
  );

  // Initial load on start: Delhi
  useEffect(() => {
    void loadCityData('Delhi');
  }, [loadCityData]);

  // Household changes trigger re-plan
  const handleHouseholdChange = useCallback(
    (updated: Household) => {
      setHousehold(updated);
      if (aqiResult) {
        void loadPlanForCurrentState(aqiResult, updated);
      }
    },
    [aqiResult, loadPlanForCurrentState]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized = sanitizeCityInput(cityInput);
    if (sanitized) {
      void loadCityData(sanitized);
    }
  };

  const handleCitySelect = (cityName: string) => {
    const sanitized = sanitizeCityInput(cityName);
    setCityInput(sanitized);
    void loadCityData(sanitized);
  };

  const handleRetryAqi = () => {
    void loadCityData(activeCity || cityInput || 'Delhi');
  };

  const handleRetryPlan = () => {
    if (aqiResult) {
      void loadPlanForCurrentState(aqiResult, household);
    }
  };

  // Re-compute Day Impact Summary if plan or household changes
  const daySummary = useMemo(() => {
    if (!aqiResult || !plan) return null;
    return (
      plan.summary ??
      generateDaySummary(aqiResult.reading.aqi, aqiResult.reading.category, household, plan.items)
    );
  }, [aqiResult, plan, household]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="flex-1 py-8" role="main">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* City Selection Bar */}
          <section aria-labelledby="city-search-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 id="city-search-heading" className="sr-only">
              City Selection
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <label htmlFor="city-input" className="sr-only">
                  Enter city name
                </label>
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400" aria-hidden="true">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </div>
                <input
                  id="city-input"
                  type="text"
                  maxLength={60}
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  placeholder="Enter any Indian city (e.g., Delhi, Mumbai, Tirupati)..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={loadingAqi}
                className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50"
              >
                {loadingAqi ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeLinecap="round" />
                    </svg>
                    Checking...
                  </span>
                ) : (
                  'Check Air Quality'
                )}
              </button>
            </form>

            {/* Quick-pick Indian cities */}
            <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-medium text-slate-500">Quick select:</span>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quick select cities">
                {POPULAR_CITIES.map((c) => {
                  const isSelected = activeCity.toLowerCase() === c.toLowerCase();
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => handleCitySelect(c)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-teal-600 ${
                        isSelected
                          ? 'bg-teal-100 text-teal-800 ring-1 ring-teal-400 font-semibold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Loading State for AQI */}
          {loadingAqi && (
            <section
              role="status"
              aria-live="polite"
              className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeLinecap="round" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-700">
                Fetching CPCB air quality and hourly forecast for {cityInput}...
              </p>
              <span className="sr-only">Loading air quality data</span>
            </section>
          )}

          {/* Error & Retry State for AQI */}
          {!loadingAqi && aqiError && (
            <section
              role="alert"
              className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700" aria-hidden="true">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-rose-900">Unable to retrieve air quality data</h3>
                    <p className="mt-1 text-sm text-rose-700">{aqiError}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRetryAqi}
                  className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-xs font-semibold text-rose-800 shadow-sm ring-1 ring-rose-300 hover:bg-rose-100 transition focus-visible:outline-2 focus-visible:outline-rose-600"
                >
                  <svg className="mr-1.5 h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M16 21h5v-5" />
                  </svg>
                  Retry Search
                </button>
              </div>
            </section>
          )}

          {/* Active Air Quality Card */}
          {!loadingAqi && !aqiError && aqiResult && (
            <section
              aria-labelledby="live-aqi-heading"
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            >
              {/* Card Header: City + Updated + Demo Data Badge */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 id="live-aqi-heading" className="text-2xl font-bold tracking-tight text-slate-900">
                      {aqiResult.reading.city}
                    </h2>
                    {aqiResult.isDemo && (
                      <span
                        className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-300"
                        title="Using curated Indian demo dataset. Configure OPENWEATHER_API_KEY for live readings."
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                        demo data
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Indian CPCB Scale &bull; Updated {new Date(aqiResult.reading.updatedAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </p>
                </div>

                <div>
                  <AqiBadge aqi={aqiResult.reading.aqi} size="xl" />
                </div>
              </div>

              {/* Pollutants + Best Window Highlights Grid */}
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* PM2.5 */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">PM2.5</span>
                    <span>Primary Smog</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold tabular-nums text-slate-900">
                      {aqiResult.reading.pm25 !== undefined ? Math.round(aqiResult.reading.pm25) : '—'}
                    </span>
                    <span className="text-xs text-slate-500">&mu;g/m&sup3;</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Fine inhalable particles from smoke & vehicles.
                  </p>
                </div>

                {/* PM10 */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">PM10</span>
                    <span>Coarse Dust</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold tabular-nums text-slate-900">
                      {aqiResult.reading.pm10 !== undefined ? Math.round(aqiResult.reading.pm10) : '—'}
                    </span>
                    <span className="text-xs text-slate-500">&mu;g/m&sup3;</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Coarse dust, road emissions, and construction debris.
                  </p>
                </div>

                {/* Best Outdoor Window */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                    <svg className="h-4 w-4 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Best Window Today</span>
                  </div>
                  <div className="mt-2 text-base font-bold text-emerald-950">
                    {aqiResult.bestWindow.windowText}
                  </div>
                  <p className="mt-1 text-xs text-emerald-800">
                    Lowest-AQI stretch (~{aqiResult.bestWindow.averageAqi} AQI). Safer for errands.
                  </p>
                </div>

                {/* Peak Smog Hour */}
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800">
                    <svg className="h-4 w-4 text-rose-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>Peak Smog Hour</span>
                  </div>
                  <div className="mt-2 text-base font-bold text-rose-950">
                    Around {aqiResult.bestWindow.peakHour}
                  </div>
                  <p className="mt-1 text-xs text-rose-800">
                    Highest pollution peak (~{aqiResult.bestWindow.peakAqi} AQI). Keep windows closed.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Household Profile Form */}
          <HouseholdForm onHouseholdChange={handleHouseholdChange} />

          {/* Code-Split Lazy Loaded Plan Section */}
          <Suspense fallback={<PlanSectionSkeleton />}>
            <PlanSection
              plan={plan}
              daySummary={daySummary}
              aqiResult={aqiResult}
              activeCity={activeCity}
              loadingPlan={loadingPlan}
              planError={planError}
              onRetryPlan={handleRetryPlan}
            />
          </Suspense>

          {/* CPCB 6-Band Standard Legend */}
          <AqiLegend />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default App;
