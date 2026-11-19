import React from 'react';
import type { AqiFetchResult, DayImpactSummary, DayPlan, PlanCategory } from '@/types';
import { ImpactBar } from './ImpactBar';
import { PlanCard } from './PlanCard';

export interface PlanSectionProps {
  readonly plan: DayPlan | null;
  readonly daySummary: DayImpactSummary | null;
  readonly aqiResult: AqiFetchResult | null;
  readonly activeCity: string;
  readonly loadingPlan: boolean;
  readonly planError: string | null;
  readonly onRetryPlan: () => void;
}

const CATEGORY_ORDER: readonly { readonly key: PlanCategory; readonly title: string; readonly subtitle: string }[] = [
  {
    key: 'routines',
    title: 'Daily Routines & Outdoor Timing',
    subtitle: 'Shift errands, exercise, and ventilation around peak smog hours.',
  },
  {
    key: 'indoor hacks',
    title: 'Indoor Air Protection',
    subtitle: 'Mechanical filtration, clean zones, and dust suppression.',
  },
  {
    key: 'greener alternatives',
    title: 'Greener Choices',
    subtitle: 'Low-emission transit and zero-smoke home alternatives.',
  },
];

export const PlanSectionComponent: React.FC<PlanSectionProps> = ({
  plan,
  daySummary,
  aqiResult,
  activeCity,
  loadingPlan,
  planError,
  onRetryPlan,
}) => {
  return (
    <section
      aria-labelledby="plan-section-heading"
      className="rounded-3xl border border-black/5 bg-white p-6 sm:p-8 shadow-apple space-y-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-black/5 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 id="plan-section-heading" className="text-xl sm:text-2xl font-semibold tracking-tight text-[#1D1D1F]">
              Today's Low-Emission Day Plan
            </h2>
            {plan && (
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  plan.planType === 'standard plan'
                    ? 'bg-[#F5F5F7] text-[#1D1D1F] border border-black/10'
                    : 'bg-blue-50 text-[#0071E3] border border-blue-200'
                }`}
              >
                {plan.planType === 'standard plan' ? 'standard plan' : 'AI-tailored'}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#6E6E73] mt-1">
            Actions tailored to {activeCity}'s smog conditions and your household profile.
          </p>
        </div>

        {loadingPlan && (
          <div className="flex items-center gap-2 text-xs font-medium text-[#0071E3]" role="status">
            <svg className="h-4 w-4 animate-spin text-[#0071E3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeLinecap="round" />
            </svg>
            <span>Drafting tailored plan...</span>
          </div>
        )}
      </div>

      {/* Plan Error State */}
      {planError && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-rose-800">{planError}</p>
            <button
              type="button"
              onClick={onRetryPlan}
              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-800 ring-1 ring-rose-300 hover:bg-rose-100 transition focus-visible:outline-[#0071E3]"
            >
              Retry Plan
            </button>
          </div>
        </div>
      )}

      {/* ImpactBar Day Summary Component with WhatsApp Share */}
      {daySummary && aqiResult && (
        <ImpactBar
          summary={daySummary}
          aqi={aqiResult.reading.aqi}
          category={aqiResult.reading.category}
          bestWindow={aqiResult.bestWindow}
          city={activeCity}
          items={plan?.items}
        />
      )}

      {/* Plan Items Grouped by Category */}
      {plan && plan.items.length > 0 && (
        <div className="space-y-8 pt-2">
          {CATEGORY_ORDER.map(({ key, title, subtitle }) => {
            const categoryItems = plan.items.filter((item) => item.category === key);
            if (categoryItems.length === 0) return null;

            return (
              <div key={key} className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-[#1D1D1F]">{title}</h3>
                  <p className="text-xs text-[#6E6E73]">{subtitle}</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryItems.map((item) => (
                    <PlanCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State before AQI loads */}
      {!plan && !loadingPlan && !planError && (
        <div className="py-8 text-center">
          <p className="text-sm text-[#6E6E73]">
            Select a city to generate today's personalized low-emission action plan.
          </p>
        </div>
      )}
    </section>
  );
};

export const PlanSection = React.memo(PlanSectionComponent);
