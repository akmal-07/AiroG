import React from 'react';
import { CitySearchAutocomplete } from './CitySearchAutocomplete';

export interface CitySearchBarProps {
  readonly cityInput: string;
  readonly activeCity: string;
  readonly loadingAqi: boolean;
  readonly popularCities: readonly string[];
  readonly onChangeCityInput: (value: string) => void;
  readonly onSelectCity: (cityName: string) => void;
  readonly onSubmit: (e: React.FormEvent) => void;
}

/**
 * Apple-grade city search bar with real-time geocoding autocomplete
 * and one-tap quick-selection pills for major Indian metropolitan areas.
 */
export const CitySearchBar: React.FC<CitySearchBarProps> = ({
  cityInput,
  activeCity,
  loadingAqi,
  popularCities,
  onChangeCityInput,
  onSelectCity,
  onSubmit,
}) => {
  return (
    <section
      aria-labelledby="city-search-heading"
      className="rounded-3xl border border-hairline bg-elevated p-5 sm:p-7 shadow-apple dark:shadow-none space-y-4 transition-colors"
    >
      <h2 id="city-search-heading" className="sr-only">
        City Selection
      </h2>

      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <CitySearchAutocomplete
          value={cityInput}
          onChange={onChangeCityInput}
          onSelect={onSelectCity}
          onSubmit={() => {
            const clean = cityInput.trim().replace(/[^\w\s,.-]/gi, '').slice(0, 60);
            if (clean) onSelectCity(clean);
          }}
          disabled={loadingAqi}
        />
        <button
          type="submit"
          disabled={loadingAqi}
          className="inline-flex items-center justify-center rounded-2xl bg-accent-blue hover:opacity-90 px-6 py-3 text-sm font-semibold text-white shadow-xs transition active:scale-98 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue disabled:opacity-50"
        >
          {loadingAqi ? 'Checking...' : 'Check Air Quality'}
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-hairline">
        <span className="text-xs font-semibold text-label-secondary">Quick select:</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Quick select cities">
          {popularCities.map((c) => {
            const isSelected = activeCity.toLowerCase() === c.toLowerCase();
            return (
              <button
                key={c}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectCity(c)}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition active:scale-95 focus-visible:outline-2 focus-visible:outline-accent-blue ${
                  isSelected
                    ? 'bg-label-primary text-canvas shadow-xs'
                    : 'bg-nested text-label-primary hover:opacity-80 border border-hairline'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
