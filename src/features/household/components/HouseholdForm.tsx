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
      className="rounded-3xl border border-black/5 bg-white p-6 sm:p-8 shadow-apple space-y-6"
    >
      <div className="flex flex-col gap-1 border-b border-black/5 pb-4">
        <h2 id="household-form-heading" className="text-lg font-bold tracking-tight text-[#1D1D1F]">
          Household Profile
        </h2>
        <p className="text-xs sm:text-sm text-[#6E6E73]">
          Personalize exposure recommendations and indoor protective measures for your family.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Adults Stepper */}
        <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-[#F5F5F7] p-4 transition-all">
          <div>
            <span id="adults-label" className="text-sm font-semibold tracking-tight text-[#1D1D1F]">
              Adults
            </span>
            <p className="text-xs text-[#6E6E73]">Ages 18–60</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateCount('adults', -1)}
              disabled={household.adults <= 0}
              aria-label="Decrease adult count"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#1D1D1F] border border-black/10 shadow-2xs hover:bg-[#E8E8ED] transition active:scale-95 focus-visible:outline-2 focus-visible:outline-[#0071E3] disabled:opacity-30 disabled:pointer-events-none"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <span
              id="adults-count"
              role="status"
              aria-live="polite"
              aria-labelledby="adults-label adults-count"
              className="w-7 text-center text-base font-bold tabular-nums text-[#1D1D1F]"
            >
              {household.adults}
            </span>
            <button
              type="button"
              onClick={() => updateCount('adults', 1)}
              disabled={household.adults >= 20}
              aria-label="Increase adult count"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#1D1D1F] border border-black/10 shadow-2xs hover:bg-[#E8E8ED] transition active:scale-95 focus-visible:outline-2 focus-visible:outline-[#0071E3] disabled:opacity-30 disabled:pointer-events-none"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Children Stepper */}
        <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-[#F5F5F7] p-4 transition-all">
          <div>
            <span id="children-label" className="text-sm font-semibold tracking-tight text-[#1D1D1F]">
              Children
            </span>
            <p className="text-xs text-[#6E6E73]">Under 18 years</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateCount('children', -1)}
              disabled={household.children <= 0}
              aria-label="Decrease children count"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#1D1D1F] border border-black/10 shadow-2xs hover:bg-[#E8E8ED] transition active:scale-95 focus-visible:outline-2 focus-visible:outline-[#0071E3] disabled:opacity-30 disabled:pointer-events-none"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <span
              id="children-count"
              role="status"
              aria-live="polite"
              aria-labelledby="children-label children-count"
              className="w-7 text-center text-base font-bold tabular-nums text-[#1D1D1F]"
            >
              {household.children}
            </span>
            <button
              type="button"
              onClick={() => updateCount('children', 1)}
              disabled={household.children >= 20}
              aria-label="Increase children count"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#1D1D1F] border border-black/10 shadow-2xs hover:bg-[#E8E8ED] transition active:scale-95 focus-visible:outline-2 focus-visible:outline-[#0071E3] disabled:opacity-30 disabled:pointer-events-none"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Elders Stepper */}
        <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-[#F5F5F7] p-4 transition-all">
          <div>
            <span id="elders-label" className="text-sm font-semibold tracking-tight text-[#1D1D1F]">
              Elders
            </span>
            <p className="text-xs text-[#6E6E73]">Ages 60+</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateCount('elders', -1)}
              disabled={household.elders <= 0}
              aria-label="Decrease elders count"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#1D1D1F] border border-black/10 shadow-2xs hover:bg-[#E8E8ED] transition active:scale-95 focus-visible:outline-2 focus-visible:outline-[#0071E3] disabled:opacity-30 disabled:pointer-events-none"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <span
              id="elders-count"
              role="status"
              aria-live="polite"
              aria-labelledby="elders-label elders-count"
              className="w-7 text-center text-base font-bold tabular-nums text-[#1D1D1F]"
            >
              {household.elders}
            </span>
            <button
              type="button"
              onClick={() => updateCount('elders', 1)}
              disabled={household.elders >= 20}
              aria-label="Increase elders count"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#1D1D1F] border border-black/10 shadow-2xs hover:bg-[#E8E8ED] transition active:scale-95 focus-visible:outline-2 focus-visible:outline-[#0071E3] disabled:opacity-30 disabled:pointer-events-none"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Tactile iOS-style Toggles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-black/5">
        {/* Asthma / Respiratory Toggle */}
        <div
          onClick={() => handleToggle('hasAsthma')}
          className="flex cursor-pointer items-center justify-between rounded-2xl border border-black/5 bg-[#F5F5F7] p-4 transition-all hover:bg-[#EAEAEA]"
        >
          <div className="pr-4">
            <span className="text-sm font-semibold tracking-tight text-[#1D1D1F]">
              Asthma / Sensitive Airways
            </span>
            <p className="text-xs text-[#6E6E73] mt-0.5">
              Household member with asthma, COPD, or respiratory sensitivity.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={household.hasAsthma}
            onClick={(e) => {
              e.stopPropagation();
              handleToggle('hasAsthma');
            }}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-[#0071E3] ${
              household.hasAsthma ? 'bg-[#0071E3]' : 'bg-[#E5E5EA]'
            }`}
          >
            <span className="sr-only">Toggle asthma / respiratory sensitivity</span>
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                household.hasAsthma ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Air Purifier Toggle */}
        <div
          onClick={() => handleToggle('hasPurifier')}
          className="flex cursor-pointer items-center justify-between rounded-2xl border border-black/5 bg-[#F5F5F7] p-4 transition-all hover:bg-[#EAEAEA]"
        >
          <div className="pr-4">
            <span className="text-sm font-semibold tracking-tight text-[#1D1D1F]">
              HEPA Air Purifier Available
            </span>
            <p className="text-xs text-[#6E6E73] mt-0.5">
              Working indoor mechanical filtration in home.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={household.hasPurifier}
            onClick={(e) => {
              e.stopPropagation();
              handleToggle('hasPurifier');
            }}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-[#0071E3] ${
              household.hasPurifier ? 'bg-[#0071E3]' : 'bg-[#E5E5EA]'
            }`}
          >
            <span className="sr-only">Toggle HEPA air purifier available</span>
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                household.hasPurifier ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </section>
  );
};

export const HouseholdForm = React.memo(HouseholdFormComponent);
