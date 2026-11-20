import React from 'react';
import { AqiBadge } from './AqiBadge';
import { formatTimeLabel } from '../utils/forecastWindow';
import type { AqiFetchResult } from '@/types';

export interface AqiHeroCardProps {
  readonly aqiResult: AqiFetchResult;
}

/**
 * Apple-grade hero card displaying the live CPCB AQI readout,
 * primary pollutant metrics (PM2.5, PM10), and actionable window forecasts.
 */
export const AqiHeroCard: React.FC<AqiHeroCardProps> = ({ aqiResult }) => {
  const { reading, bestWindow, isDemo } = aqiResult;
  const formattedTime = `${formatTimeLabel(reading.updatedAt)} IST`;

  return (
    <section
      aria-labelledby="live-aqi-heading"
      className="rounded-3xl border border-hairline bg-elevated p-6 sm:p-8 shadow-apple dark:shadow-none space-y-6 transition-colors"
    >
      {/* Card Header: City + Updated + Demo Data Badge */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-hairline pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2
              id="live-aqi-heading"
              className="text-2xl sm:text-3xl font-semibold tracking-tight text-label-primary"
            >
              {reading.city}
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                isDemo
                  ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50 text-amber-800'
                  : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50 text-emerald-800'
              }`}
              title={isDemo ? 'Using curated Indian demo dataset' : 'Live telemetry from OpenWeatherMap'}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${isDemo ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`}
                aria-hidden="true"
              />
              {isDemo ? 'Demo Dataset' : 'Live Data'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-label-secondary mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium text-label-primary">
              {isDemo ? 'Demo: Curated CPCB Dataset' : 'Live: OpenWeatherMap \u00B7 CPCB NAQI'}
            </span>
            <span aria-hidden="true">&bull;</span>
            <span>Updated{' '}{formattedTime}</span>
          </p>
        </div>

        <div>
          <AqiBadge aqi={reading.aqi} size="xl" />
        </div>
      </div>

      {/* Pollutants + Best Window Highlights Grid with generous p-5 padding */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* PM2.5 */}
        <div className="flex flex-col justify-between rounded-2xl border border-hairline bg-nested p-5 transition-all">
          <div className="flex items-center justify-between text-xs text-label-secondary">
            <span className="font-semibold text-label-primary">PM2.5</span>
            <span>Primary Smog</span>
          </div>
          <div className="my-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold tabular-nums tracking-tight text-label-primary">
              {reading.pm25 !== undefined ? Math.round(reading.pm25) : '—'}
            </span>
            <span className="text-xs text-label-secondary">&mu;g/m&sup3;</span>
          </div>
          <p className="text-xs text-label-secondary leading-relaxed">
            Fine inhalable particles from smoke & vehicles.
          </p>
        </div>

        {/* PM10 */}
        <div className="flex flex-col justify-between rounded-2xl border border-hairline bg-nested p-5 transition-all">
          <div className="flex items-center justify-between text-xs text-label-secondary">
            <span className="font-semibold text-label-primary">PM10</span>
            <span>Coarse Dust</span>
          </div>
          <div className="my-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold tabular-nums tracking-tight text-label-primary">
              {reading.pm10 !== undefined ? Math.round(reading.pm10) : '—'}
            </span>
            <span className="text-xs text-label-secondary">&mu;g/m&sup3;</span>
          </div>
          <p className="text-xs text-label-secondary leading-relaxed">
            Coarse dust, road emissions, and construction debris.
          </p>
        </div>

        {/* Best Outdoor Window - Neutral Apple card with clean accent */}
        <div className="flex flex-col justify-between rounded-2xl border border-hairline bg-nested p-5 transition-all">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-600 shrink-0" aria-hidden="true" />
            <span>Best Window Today</span>
          </div>
          <div className="my-3 text-lg font-semibold tracking-tight text-label-primary">
            {bestWindow.windowText}
          </div>
          <p className="text-xs text-label-secondary leading-relaxed">
            Lowest-AQI stretch (~{bestWindow.averageAqi}{' '}AQI). Safer for errands.
          </p>
        </div>

        {/* Peak Smog Hour - Neutral Apple card with clean accent */}
        <div className="flex flex-col justify-between rounded-2xl border border-hairline bg-nested p-5 transition-all">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800 dark:text-rose-300">
            <span className="h-2 w-2 rounded-full bg-rose-600 shrink-0" aria-hidden="true" />
            <span>Peak Smog Hour</span>
          </div>
          <div className="my-3 text-lg font-semibold tracking-tight text-label-primary">
            Around{' '}{bestWindow.peakHour}
          </div>
          <p className="text-xs text-label-secondary leading-relaxed">
            Highest pollution peak (~{bestWindow.peakAqi}{' '}AQI). Keep windows closed.
          </p>
        </div>
      </div>
    </section>
  );
};
