import React from 'react';

export interface AqiStatusBannerProps {
  readonly loadingAqi: boolean;
  readonly aqiError: string | null;
  readonly cityInput: string;
  readonly onRetry: () => void;
}

/**
 * Status feedback banner displaying an accessible spinner during network queries
 * or a descriptive error callout with retry controls upon failure.
 */
export const AqiStatusBanner: React.FC<AqiStatusBannerProps> = ({
  loadingAqi,
  aqiError,
  cityInput,
  onRetry,
}) => {
  if (loadingAqi) {
    return (
      <section
        role="status"
        aria-live="polite"
        className="flex flex-col items-center justify-center rounded-3xl border border-hairline bg-elevated p-12 text-center shadow-apple dark:shadow-none transition-colors"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-blue/10 text-accent-blue">
          <svg
            className="h-6 w-6 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeLinecap="round" />
          </svg>
        </div>
        <p className="mt-4 text-sm font-medium text-label-primary">
          Fetching CPCB air quality and hourly forecast for{' '}{cityInput}...
        </p>
      </section>
    );
  }

  if (aqiError) {
    return (
      <section
        role="alert"
        className="rounded-3xl border border-rose-200 bg-rose-50/80 dark:bg-rose-950/30 dark:border-rose-900/50 p-6 shadow-apple dark:shadow-none transition-colors"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-rose-950 dark:text-rose-200">
              Unable to retrieve air quality data
            </h3>
            <p className="mt-1 text-sm text-rose-800 dark:text-rose-300">{aqiError}</p>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center rounded-full bg-elevated px-4 py-2 text-xs font-semibold text-rose-900 dark:text-rose-200 shadow-sm ring-1 ring-rose-300 dark:ring-rose-800 hover:bg-nested transition active:scale-95 focus-visible:outline-accent-blue"
          >
            Retry Search
          </button>
        </div>
      </section>
    );
  }

  return null;
};
