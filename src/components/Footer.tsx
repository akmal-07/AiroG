import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-6" role="contentinfo">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
          <div className="flex flex-col gap-1">
            <p className="font-medium text-slate-700">
              AiroG &mdash; GenAI Air Quality Assistant for Indian Families
            </p>
            <p>
              AQI scales follow Central Pollution Control Board (CPCB) India guidelines. Always follow official public health advisories during severe smog events.
            </p>
          </div>

          <div className="flex items-center gap-4 text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <svg
                className="h-3.5 w-3.5 text-teal-600"
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
            <span>No tracking</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
