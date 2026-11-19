import React, { useState, useEffect } from 'react';
import type { Household } from '@/types';
import { loadHousehold, saveHousehold } from '../utils/storage';

interface HouseholdFormProps {
  readonly onHouseholdChange: (household: Household) => void;
}

const HouseholdFormComponent: React.FC<HouseholdFormProps> = ({ onHouseholdChange }) => {
  const [household, setHousehold] = useState<Household>(() => loadHousehold());

  useEffect(() => {
    const loaded = loadHousehold();
    setHousehold(loaded);
  }, []);

  const updateCount = (field: 'adults' | 'children' | 'elders', delta: number) => {
    setHousehold((prev) => {
      const nextVal = Math.max(0, Math.min(20, prev[field] + delta));
      const updated: Household = {
        ...prev,
        [field]: nextVal,
      };
      saveHousehold(updated);
      onHouseholdChange(updated);
      return updated;
    });
  };

  const handleToggle = (field: 'hasAsthma' | 'hasPurifier') => {
    setHousehold((prev) => {
      const updated: Household = {
        ...prev,
        [field]: !prev[field],
      };
      saveHousehold(updated);
      onHouseholdChange(updated);
      return updated;
    });
  };

  return (
    <section
      aria-labelledby="household-form-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-col gap-1 border-b border-slate-100 pb-4">
        <h2 id="household-form-heading" className="text-base font-semibold text-slate-900">
          Household Profile
        </h2>
        <p className="text-xs text-slate-500">
          Personalize exposure recommendations and indoor protective measures for your family.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Adults Stepper */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
          <div>
            <label htmlFor="adults-count" className="text-sm font-semibold text-slate-900">
              Adults
            </label>
            <p className="text-xs text-slate-500">Ages 18–60</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateCount('adults', -1)}
              disabled={household.adults <= 0}
              aria-label="Decrease adult count"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-xs hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-teal-600 disabled:opacity-40"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <span
              id="adults-count"
              role="status"
              aria-live="polite"
              aria-label={`${household.adults} adults`}
              className="w-6 text-center text-sm font-bold tabular-nums text-slate-900"
            >
              {household.adults}
            </span>
            <button
              type="button"
              onClick={() => updateCount('adults', 1)}
              disabled={household.adults >= 20}
              aria-label="Increase adult count"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-xs hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-teal-600 disabled:opacity-40"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Children Stepper */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
          <div>
            <label htmlFor="children-count" className="text-sm font-semibold text-slate-900">
              Children
            </label>
            <p className="text-xs text-slate-500">Under 18 years</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateCount('children', -1)}
              disabled={household.children <= 0}
              aria-label="Decrease children count"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-xs hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-teal-600 disabled:opacity-40"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <span
              id="children-count"
              role="status"
              aria-live="polite"
              aria-label={`${household.children} children`}
              className="w-6 text-center text-sm font-bold tabular-nums text-slate-900"
            >
              {household.children}
            </span>
            <button
              type="button"
              onClick={() => updateCount('children', 1)}
              disabled={household.children >= 20}
              aria-label="Increase children count"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-xs hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-teal-600 disabled:opacity-40"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Elders Stepper */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
          <div>
            <label htmlFor="elders-count" className="text-sm font-semibold text-slate-900">
              Elders
            </label>
            <p className="text-xs text-slate-500">Ages 60+</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateCount('elders', -1)}
              disabled={household.elders <= 0}
              aria-label="Decrease elders count"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-xs hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-teal-600 disabled:opacity-40"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <span
              id="elders-count"
              role="status"
              aria-live="polite"
              aria-label={`${household.elders} elders`}
              className="w-6 text-center text-sm font-bold tabular-nums text-slate-900"
            >
              {household.elders}
            </span>
            <button
              type="button"
              onClick={() => updateCount('elders', 1)}
              disabled={household.elders >= 20}
              aria-label="Increase elders count"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-xs hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-teal-600 disabled:opacity-40"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Vulnerabilities & Equipment Toggles */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 pt-4 border-t border-slate-100">
        {/* Asthma / Respiratory Toggle */}
        <label
          htmlFor="has-asthma-toggle"
          className={`flex cursor-pointer items-start justify-between rounded-xl border p-3.5 transition focus-within:ring-2 focus-within:ring-teal-500/30 ${
            household.hasAsthma
              ? 'border-amber-300 bg-amber-50/50'
              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <div className="pr-3">
            <span className="text-sm font-semibold text-slate-900">
              Asthma / Respiratory Sensitivity
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              Household member with asthma, COPD, or chronic bronchitis.
            </p>
          </div>
          <input
            id="has-asthma-toggle"
            type="checkbox"
            checked={household.hasAsthma}
            onChange={() => handleToggle('hasAsthma')}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 focus-visible:outline-teal-600"
          />
        </label>

        {/* Air Purifier Toggle */}
        <label
          htmlFor="has-purifier-toggle"
          className={`flex cursor-pointer items-start justify-between rounded-xl border p-3.5 transition focus-within:ring-2 focus-within:ring-teal-500/30 ${
            household.hasPurifier
              ? 'border-teal-300 bg-teal-50/50'
              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <div className="pr-3">
            <span className="text-sm font-semibold text-slate-900">
              HEPA Air Purifier Available
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              Working indoor mechanical filtration in home.
            </p>
          </div>
          <input
            id="has-purifier-toggle"
            type="checkbox"
            checked={household.hasPurifier}
            onChange={() => handleToggle('hasPurifier')}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 focus-visible:outline-teal-600"
          />
        </label>
      </div>
    </section>
  );
};

export const HouseholdForm = React.memo(HouseholdFormComponent);
