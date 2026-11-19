import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-slate-200 bg-white shadow-sm" role="banner">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {/* Guardian & Air vector mark (no emojis) */}
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm"
              aria-hidden="true"
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M8 11h8" />
                <path d="M9 14h6" />
                <path d="M10 8h4" />
              </svg>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">AiroG</h1>
                <span className="text-sm font-medium text-teal-700">
                  Clear air, made simple.
                </span>
              </div>
              <p className="text-sm text-slate-600">
                GenAI air-quality assistant helping Indian families make safer daily decisions during winter smog.
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
