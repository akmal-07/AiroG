import React from 'react';
import { CPCB_BANDS } from '../utils/aqi';
import { AqiBadge, DARK_BAND_CLASSES } from './AqiBadge';

const AqiLegendComponent: React.FC = () => {
  return (
    <section
      aria-labelledby="aqi-scale-heading"
      className="rounded-3xl border border-hairline bg-elevated p-6 sm:p-8 shadow-apple dark:shadow-none space-y-5 transition-colors"
    >
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between border-b border-hairline pb-4">
        <div>
          <h2 id="aqi-scale-heading" className="text-lg font-bold tracking-tight text-label-primary">
            CPCB Air Quality Index (India Scale)
          </h2>
          <p className="text-xs sm:text-sm text-label-secondary">
            Central Pollution Control Board 6-band standard. Every band pairs color with explicit text.
          </p>
        </div>
        <span className="self-start rounded-full bg-nested border border-hairline px-3 py-1 text-xs font-semibold text-label-primary sm:self-auto">
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
            className={`flex items-start justify-between rounded-2xl border p-3.5 transition-all shadow-xs ${band.badgeBg} ${band.badgeBorder} ${DARK_BAND_CLASSES[band.key]}`}
          >
            <div className="flex flex-col gap-1 pr-2">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${band.dotColor}`}
                  aria-hidden="true"
                />
                <span className="text-sm font-bold tracking-tight">
                  {band.label}
                </span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                {band.healthAdvisory}
              </p>
            </div>
            <span
              className="shrink-0 rounded-lg bg-elevated/90 border border-hairline px-2 py-0.5 text-xs font-bold tabular-nums shadow-xs"
              aria-label={`AQI range ${band.rangeText}`}
            >
              {band.rangeText}
            </span>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-4 text-xs text-label-secondary">
        <span>Standard breakpoints based on 24-hr PM2.5 and PM10 concentrations.</span>
        <div className="flex items-center gap-2 font-medium text-label-primary">
          <span>Example:</span>
          <AqiBadge aqi={312} size="sm" />
        </div>
      </div>
    </section>
  );
};

export const AqiLegend = React.memo(AqiLegendComponent);
