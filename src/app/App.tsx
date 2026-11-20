import React, { Suspense } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CitySearchBar } from '@/features/aqi/components/CitySearchBar';
import { AqiHeroCard } from '@/features/aqi/components/AqiHeroCard';
import { AqiStatusBanner } from '@/features/aqi/components/AqiStatusBanner';
import { useAirQualityDashboard, POPULAR_CITIES } from './hooks/useAirQualityDashboard';

const HouseholdForm = React.lazy(() =>
  import('@/features/household/components/HouseholdForm').then((m) => ({ default: m.HouseholdForm }))
);
const PlanSection = React.lazy(() =>
  import('@/features/plan/components/PlanSection').then((m) => ({ default: m.PlanSection }))
);
const AqiLegend = React.lazy(() =>
  import('@/features/aqi/components/AqiLegend').then((m) => ({ default: m.AqiLegend }))
);

const Skeleton: React.FC<{ label: string; h: string }> = ({ label, h }) => (
  <div role="status" aria-label={label} className={`${h} rounded-3xl border border-hairline bg-elevated p-6 animate-pulse`} />
);

export const App: React.FC = () => {
  const {
    cityInput,
    setCityInput,
    activeCity,
    loadingAqi,
    aqiError,
    aqiResult,
    plan,
    loadingPlan,
    planError,
    liveAnnouncement,
    daySummary,
    handleSubmit,
    handleCitySelect,
    handleRetryAqi,
    handleRetryPlan,
    handleHouseholdChange,
  } = useAirQualityDashboard();

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-label-primary transition-colors duration-200">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-2xl focus:bg-label-primary focus:text-canvas focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-apple"
      >
        Skip to main content
      </a>

      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      <Header />

      <main id="main-content" tabIndex={-1} className="flex-1 py-8 sm:py-10 focus:outline-none" role="main">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
          <CitySearchBar
            cityInput={cityInput}
            activeCity={activeCity}
            loadingAqi={loadingAqi}
            popularCities={POPULAR_CITIES}
            onChangeCityInput={setCityInput}
            onSelectCity={handleCitySelect}
            onSubmit={handleSubmit}
          />

          <AqiStatusBanner
            loadingAqi={loadingAqi}
            aqiError={aqiError}
            cityInput={cityInput}
            onRetry={handleRetryAqi}
          />

          {!loadingAqi && !aqiError && aqiResult && <AqiHeroCard aqiResult={aqiResult} />}

          <ErrorBoundary fallbackMessage="Unable to display the household profile settings.">
            <Suspense fallback={<Skeleton label="Loading household form" h="h-44" />}>
              <HouseholdForm onHouseholdChange={handleHouseholdChange} />
            </Suspense>
          </ErrorBoundary>

          <ErrorBoundary fallbackMessage="Unable to display the low-emission day plan." onReset={handleRetryPlan}>
            <Suspense fallback={<Skeleton label="Loading plan section" h="h-64" />}>
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
          </ErrorBoundary>

          <ErrorBoundary fallbackMessage="Unable to display the AQI scale legend.">
            <Suspense fallback={<Skeleton label="Loading CPCB AQI legend" h="h-48" />}>
              <AqiLegend />
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default App;
