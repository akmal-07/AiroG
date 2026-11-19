import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-black/5 bg-white py-8" role="contentinfo">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Medical disclaimer & advisory note */}
        <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4 text-xs text-[#6E6E73] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 shrink-0 text-[#0071E3]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span className="font-semibold text-[#1D1D1F]">
              General guidance, not medical advice.
            </span>
          </div>
          <p className="text-2xs sm:text-xs">
            AQI scales follow Central Pollution Control Board (CPCB) India guidelines. Always follow official public health advisories during severe smog events.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-[#6E6E73] pt-2">
          <p className="font-medium text-[#1D1D1F]">
            AiroG &mdash; GenAI Air Quality Assistant for Indian Families
          </p>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 font-medium text-[#1D1D1F]">
              <svg
                className="h-3.5 w-3.5 text-[#0071E3]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Deterministic CPCB Math</span>
            </span>
            <span>&bull;</span>
            <span>Zero Tracking</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
