import React from 'react';
import { CPCB_BANDS } from '../lib/aqi';
import { AqiBadge } from './AqiBadge';

const AqiLegendComponent: React.FC = () => {
  return (
    <section
      aria-labelledby="aqi-scale-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="aqi-scale-heading" className="text-base font-semibold text-slate-900">
            CPCB Air Quality Index (India Scale)
          </h2>
          <p className="text-xs text-slate-500">
            Central Pollution Control Board 6-band standard. Every band pairs color with explicit text.
          </p>
        </div>
        <span className="self-start rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 sm:self-auto">
          Official CPCB Standard
        </span>
      </div>

      <ol
        className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="CPCB AQI Categories"
      >
        {CPCB_BANDS.map((band) => (
          <li
            key={band.key}
            className={`flex items-start justify-between rounded-xl border p-3 transition-colors ${band.badgeBg} ${band.badgeBorder}`}
          >
            <div className="flex flex-col gap-1 pr-2">
              <div className="flex items-center gap-2">
                <span
                  className={`h-3 w-3 shrink-0 rounded-full ${band.dotColor}`}
                  aria-hidden="true"
                />
                <span className={`text-sm font-bold ${band.badgeText}`}>
                  {band.label}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-700">
                {band.healthAdvisory}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-md bg-white/80 px-2 py-0.5 text-xs font-semibold tabular-nums shadow-xs ${band.badgeText}`}
              aria-label={`AQI range ${band.rangeText}`}
            >
              {band.rangeText}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span>Standard breakpoints based on 24-hr PM2.5 and PM10 concentrations.</span>
        <div className="flex items-center gap-1.5 font-medium text-slate-700">
          <span>Example:</span>
          <AqiBadge aqi={312} size="sm" />
        </div>
      </div>
    </section>
  );
};

export const AqiLegend = React.memo(AqiLegendComponent);
