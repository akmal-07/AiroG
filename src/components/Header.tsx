import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-glass backdrop-blur-xl backdrop-saturate-180" role="banner">
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            {/* Minimalist Apple-grade Vector Mark (zero emojis) */}
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-label-primary text-canvas shadow-xs transition-colors"
              aria-hidden="true"
            >
              <svg
                className="h-5 w-5"
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
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-label-primary">AiroG</h1>
                <span className="text-xs sm:text-sm font-medium text-accent-blue">
                  Clear air, made simple.
                </span>
              </div>
              <p className="text-xs sm:text-sm text-label-secondary">
                GenAI air-quality assistant helping Indian families make safer daily decisions during winter smog.
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
