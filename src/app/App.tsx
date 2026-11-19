import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AqiLegend, AqiBadge, fetchAqiData } from '@/features/aqi';
import { HouseholdForm, initStorage, loadHousehold } from '@/features/household';
import { computeItemImpact, generateDaySummary } from '@/features/plan/utils/impact';
import type { AqiFetchResult, DayPlan, Household, PlanItem } from '@/types';

// Code-split below-the-fold PlanSection for optimal initial bundle efficiency
const PlanSection = React.lazy(() =>
  import('@/features/plan/components/PlanSection').then((m) => ({ default: m.PlanSection }))
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
    className="rounded-3xl border border-black/5 bg-white p-6 sm:p-8 shadow-apple animate-pulse space-y-4"
  >
    <div className="h-6 w-56 rounded-md bg-[#E5E5EA]" />
    <div className="h-4 w-72 rounded-md bg-[#F5F5F7]" />
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="h-28 rounded-2xl bg-[#F5F5F7]" />
      <div className="h-28 rounded-2xl bg-[#F5F5F7]" />
      <div className="h-28 rounded-2xl bg-[#F5F5F7]" />
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
        const { fetchDayPlan } = await import('@/features/plan/api/plan');
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
    <div className="flex min-h-screen flex-col bg-[#F5F5F7] text-[#1D1D1F]">
      <Header />

      <main className="flex-1 py-8 sm:py-10" role="main">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* City Selection Bar */}
          <section aria-labelledby="city-search-heading" className="rounded-3xl border border-black/5 bg-white p-5 sm:p-7 shadow-apple space-y-4">
            <h2 id="city-search-heading" className="sr-only">
              City Selection
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <label htmlFor="city-input" className="sr-only">
                  Enter city name
                </label>
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#86868B]" aria-hidden="true">
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
                  className="w-full rounded-2xl border border-black/10 bg-[#F5F5F7] py-3 pl-11 pr-4 text-sm font-medium text-[#1D1D1F] placeholder:text-[#86868B] transition focus:border-[#0071E3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20"
                />
              </div>

              <button
                type="submit"
                disabled={loadingAqi}
                className="inline-flex items-center justify-center rounded-2xl bg-[#0071E3] hover:bg-[#0077ED] px-6 py-3 text-sm font-semibold text-white shadow-xs transition active:scale-98 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071E3] disabled:opacity-50"
              >
                {loadingAqi ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-black/5">
              <span className="text-xs font-semibold text-[#6E6E73]">Quick select:</span>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Quick select cities">
                {POPULAR_CITIES.map((c) => {
                  const isSelected = activeCity.toLowerCase() === c.toLowerCase();
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => handleCitySelect(c)}
                      className={`rounded-full px-3.5 py-1 text-xs font-semibold transition active:scale-95 focus-visible:outline-2 focus-visible:outline-[#0071E3] ${
                        isSelected
                          ? 'bg-[#1D1D1F] text-white shadow-xs'
                          : 'bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E8E8ED] border border-black/5'
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
              className="flex flex-col items-center justify-center rounded-3xl border border-black/5 bg-white p-12 text-center shadow-apple"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0071E3]">
                <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeLinecap="round" />
                </svg>
              </div>
              <p className="mt-4 text-sm font-medium text-[#1D1D1F]">
                Fetching CPCB air quality and hourly forecast for {cityInput}...
              </p>
              <span className="sr-only">Loading air quality data</span>
            </section>
          )}

          {/* Error & Retry State for AQI */}
          {!loadingAqi && aqiError && (
            <section
              role="alert"
              className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 shadow-apple"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700" aria-hidden="true">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-rose-950">Unable to retrieve air quality data</h3>
                    <p className="mt-1 text-sm text-rose-800">{aqiError}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRetryAqi}
                  className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-rose-900 shadow-sm ring-1 ring-rose-300 hover:bg-rose-100 transition active:scale-95 focus-visible:outline-[#0071E3]"
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
              className="rounded-3xl border border-black/5 bg-white p-6 sm:p-8 shadow-apple space-y-6"
            >
              {/* Card Header: City + Updated + Demo Data Badge */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-black/5 pb-5">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 id="live-aqi-heading" className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
                      {aqiResult.reading.city}
                    </h2>
                    {aqiResult.isDemo && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-800"
                        title="Using curated Indian demo dataset. Configure OPENWEATHER_API_KEY for live readings."
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                        demo data
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-[#6E6E73] mt-1">
                    Indian CPCB Scale &bull; Updated {new Date(aqiResult.reading.updatedAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </p>
                </div>

                <div>
                  <AqiBadge aqi={aqiResult.reading.aqi} size="xl" />
                </div>
              </div>

              {/* Pollutants + Best Window Highlights Grid with generous p-5 padding */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* PM2.5 */}
                <div className="flex flex-col justify-between rounded-2xl border border-black/5 bg-[#F5F5F7] p-5 transition-all">
                  <div className="flex items-center justify-between text-xs text-[#6E6E73]">
                    <span className="font-semibold text-[#1D1D1F]">PM2.5</span>
                    <span>Primary Smog</span>
                  </div>
                  <div className="my-3 flex items-baseline gap-1.5">
                    <span className="text-3xl font-semibold tabular-nums tracking-tight text-[#1D1D1F]">
                      {aqiResult.reading.pm25 !== undefined ? Math.round(aqiResult.reading.pm25) : '—'}
                    </span>
                    <span className="text-xs text-[#6E6E73]">&mu;g/m&sup3;</span>
                  </div>
                  <p className="text-xs text-[#6E6E73] leading-relaxed">
                    Fine inhalable particles from smoke & vehicles.
                  </p>
                </div>

                {/* PM10 */}
                <div className="flex flex-col justify-between rounded-2xl border border-black/5 bg-[#F5F5F7] p-5 transition-all">
                  <div className="flex items-center justify-between text-xs text-[#6E6E73]">
                    <span className="font-semibold text-[#1D1D1F]">PM10</span>
                    <span>Coarse Dust</span>
                  </div>
                  <div className="my-3 flex items-baseline gap-1.5">
                    <span className="text-3xl font-semibold tabular-nums tracking-tight text-[#1D1D1F]">
                      {aqiResult.reading.pm10 !== undefined ? Math.round(aqiResult.reading.pm10) : '—'}
                    </span>
                    <span className="text-xs text-[#6E6E73]">&mu;g/m&sup3;</span>
                  </div>
                  <p className="text-xs text-[#6E6E73] leading-relaxed">
                    Coarse dust, road emissions, and construction debris.
                  </p>
                </div>

                {/* Best Outdoor Window - Neutral Apple card with clean accent */}
                <div className="flex flex-col justify-between rounded-2xl border border-black/5 bg-[#F5F5F7] p-5 transition-all">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                    <span className="h-2 w-2 rounded-full bg-emerald-600 shrink-0" aria-hidden="true" />
                    <span>Best Window Today</span>
                  </div>
                  <div className="my-3 text-lg font-semibold tracking-tight text-[#1D1D1F]">
                    {aqiResult.bestWindow.windowText}
                  </div>
                  <p className="text-xs text-[#6E6E73] leading-relaxed">
                    Lowest-AQI stretch (~{aqiResult.bestWindow.averageAqi} AQI). Safer for errands.
                  </p>
                </div>

                {/* Peak Smog Hour - Neutral Apple card with clean accent */}
                <div className="flex flex-col justify-between rounded-2xl border border-black/5 bg-[#F5F5F7] p-5 transition-all">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800">
                    <span className="h-2 w-2 rounded-full bg-rose-600 shrink-0" aria-hidden="true" />
                    <span>Peak Smog Hour</span>
                  </div>
                  <div className="my-3 text-lg font-semibold tracking-tight text-[#1D1D1F]">
                    Around {aqiResult.bestWindow.peakHour}
                  </div>
                  <p className="text-xs text-[#6E6E73] leading-relaxed">
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
