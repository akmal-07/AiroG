import React from 'react';
import type { CpcbBandKey, DayImpactSummary, OutdoorWindowInfo } from '@/types';
import { AqiBadge } from '@/features/aqi';

interface ImpactBarProps {
  readonly summary: DayImpactSummary;
  readonly aqi: number;
  readonly category: CpcbBandKey;
  readonly bestWindow: OutdoorWindowInfo;
}

export const ImpactBar: React.FC<ImpactBarProps> = ({
  summary,
  aqi,
  category,
  bestWindow,
}) => {
  const riskColorMap = {
    Minimal: {
      badge: 'bg-emerald-50 text-emerald-900 border-emerald-300',
      bar: 'bg-emerald-500',
    },
    Moderate: {
      badge: 'bg-lime-50 text-lime-950 border-lime-300',
      bar: 'bg-lime-500',
    },
    Elevated: {
      badge: 'bg-amber-50 text-amber-950 border-amber-300',
      bar: 'bg-amber-500',
    },
    High: {
      badge: 'bg-orange-50 text-orange-950 border-orange-300',
      bar: 'bg-orange-500',
    },
    Severe: {
      badge: 'bg-rose-50 text-rose-950 border-rose-300',
      bar: 'bg-rose-600',
    },
  }[summary.riskCategory];

  return (
    <section
      aria-labelledby="day-summary-heading"
      className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50/50 to-teal-50/30 p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-600 text-white" aria-hidden="true">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            <h2 id="day-summary-heading" className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Household Exposure & Outlook
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Today's Scale:</span>
            <AqiBadge aqi={aqi} bandKey={category} size="sm" />
          </div>
        </div>

        {/* One-sentence day summary headline derived strictly from band + household */}
        <p className="text-base font-bold text-slate-900 sm:text-lg leading-snug">
          {summary.headline}
        </p>
      </div>

      {/* Exposure Score & Window Metrics Grid */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Exposure Score (0-100 deterministic) */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Daily Exposure Score</span>
            <span
              className={`rounded-full border px-2 py-0.5 text-2xs font-bold ${riskColorMap.badge}`}
              aria-label={`Risk category: ${summary.riskCategory}`}
            >
              {summary.riskCategory}
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold tabular-nums text-slate-900">
              {summary.exposureScore}
            </span>
            <span className="text-xs font-medium text-slate-400">/ 100</span>
          </div>

          {/* Accessible progress gauge bar */}
          <div
            className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuenow={summary.exposureScore}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Daily exposure score ${summary.exposureScore} out of 100 (${summary.riskCategory} risk)`}
          >
            <div
              className={`h-full transition-all duration-300 ${riskColorMap.bar}`}
              style={{ width: `${summary.exposureScore}%` }}
            />
          </div>
          <p className="mt-1.5 text-2xs text-slate-500">
            Accounts for ambient AQI, vulnerabilities & active plan protections.
          </p>
        </div>

        {/* Best Outdoor Window */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
            <svg className="h-3.5 w-3.5 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Best Window Today</span>
          </div>
          <div className="mt-2 text-base font-bold text-emerald-950">
            {bestWindow.windowText}
          </div>
          <p className="mt-1 text-xs text-emerald-800">
            Average AQI ~{bestWindow.averageAqi} ({bestWindow.category}). Optimal time for errands.
          </p>
        </div>

        {/* Peak Smog Window */}
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800">
            <svg className="h-3.5 w-3.5 text-rose-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>Peak Smog Inversion</span>
          </div>
          <div className="mt-2 text-base font-bold text-rose-950">
            Around {bestWindow.peakHour}
          </div>
          <p className="mt-1 text-xs text-rose-800">
            Smog spikes to ~{bestWindow.peakAqi} AQI. Keep windows sealed tight.
          </p>
        </div>
      </div>

      {/* Transparent Methodology Line */}
      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-2xs text-slate-500">
        <svg className="h-3.5 w-3.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span className="font-medium italic">{summary.methodLine}</span>
      </div>
    </section>
  );
};
