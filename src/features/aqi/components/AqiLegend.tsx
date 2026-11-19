import React from 'react';
import { CPCB_BANDS } from '../utils/aqi';
import { AqiBadge } from './AqiBadge';

const AqiLegendComponent: React.FC = () => {
  return (
    <section
      aria-labelledby="aqi-scale-heading"
      className="rounded-3xl border border-black/5 bg-white p-6 sm:p-8 shadow-apple space-y-5"
    >
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between border-b border-black/5 pb-4">
        <div>
          <h2 id="aqi-scale-heading" className="text-lg font-bold tracking-tight text-[#1D1D1F]">
            CPCB Air Quality Index (India Scale)
          </h2>
          <p className="text-xs sm:text-sm text-[#6E6E73]">
            Central Pollution Control Board 6-band standard. Every band pairs color with explicit text.
          </p>
        </div>
        <span className="self-start rounded-full bg-[#F5F5F7] border border-black/5 px-3 py-1 text-xs font-semibold text-[#1D1D1F] sm:self-auto">
          Official CPCB Standard
        </span>
      </div>

      <ol
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="CPCB AQI Categories"
      >
        {CPCB_BANDS.map((band) => (
          <li
            key={band.key}
            className={`flex items-start justify-between rounded-2xl border p-3.5 transition-all shadow-2xs ${band.badgeBg} ${band.badgeBorder}`}
          >
            <div className="flex flex-col gap-1 pr-2">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${band.dotColor}`}
                  aria-hidden="true"
                />
                <span className={`text-sm font-bold tracking-tight ${band.badgeText}`}>
                  {band.label}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-[#1D1D1F]/80">
                {band.healthAdvisory}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-lg bg-white/90 border border-black/5 px-2 py-0.5 text-xs font-bold tabular-nums shadow-2xs ${band.badgeText}`}
              aria-label={`AQI range ${band.rangeText}`}
            >
              {band.rangeText}
            </span>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-4 text-xs text-[#6E6E73]">
        <span>Standard breakpoints based on 24-hr PM2.5 and PM10 concentrations.</span>
        <div className="flex items-center gap-2 font-medium text-[#1D1D1F]">
          <span>Example:</span>
          <AqiBadge aqi={312} size="sm" />
        </div>
      </div>
    </section>
  );
};

export const AqiLegend = React.memo(AqiLegendComponent);
