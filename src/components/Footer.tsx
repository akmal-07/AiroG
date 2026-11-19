import React, { useState, useEffect } from 'react';

type ThemeMode = 'light' | 'dark' | 'auto';

export const Footer: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('airog_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'auto') {
        return saved;
      }
    }
    return 'auto';
  });

  useEffect(() => {
    const applyTheme = (mode: ThemeMode) => {
      const root = document.documentElement;
      const isDark =
        mode === 'dark' ||
        (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(theme);
    try {
      localStorage.setItem('airog_theme', theme);
    } catch {}

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleOsChange = () => {
      if (theme === 'auto') {
        applyTheme('auto');
      }
    };

    mediaQuery.addEventListener('change', handleOsChange);
    return () => mediaQuery.removeEventListener('change', handleOsChange);
  }, [theme]);

  return (
    <footer className="mt-auto border-t border-hairline bg-elevated py-8 transition-colors" role="contentinfo">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-5">
        {/* Medical disclaimer & advisory note */}
        <div className="rounded-2xl border border-hairline bg-nested p-4 text-xs text-label-secondary flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 shrink-0 text-accent-blue"
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
            <span className="font-semibold text-label-primary">
              General guidance, not medical advice.
            </span>
          </div>
          <p className="text-xs leading-relaxed">
            AQI scales follow Central Pollution Control Board (CPCB) India guidelines. Always follow official public health advisories during severe smog events.
          </p>
        </div>

        {/* Bottom Metadata & Apple 3-Way Segmented Control */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs text-label-secondary pt-2">
          <p className="font-medium text-label-primary">
            AiroG &mdash; GenAI Air Quality Assistant for Indian Families
          </p>

          <div className="flex flex-wrap items-center gap-4">
            {/* Apple-grade 3-way Segmented Control */}
            <div
              role="radiogroup"
              aria-label="Color theme"
              className="inline-flex items-center rounded-full bg-nested border border-hairline p-0.5 shadow-xs"
            >
              {(['light', 'dark', 'auto'] as const).map((mode) => {
                const isSelected = theme === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setTheme(mode)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize transition-all duration-150 focus-visible:outline-2 focus-visible:outline-accent-blue ${
                      isSelected
                        ? 'bg-elevated text-label-primary shadow-xs'
                        : 'text-label-secondary hover:text-label-primary'
                    }`}
                  >
                    {mode === 'light' && (
                      <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m14.14-14.14l-1.41 1.41" />
                      </svg>
                    )}
                    {mode === 'dark' && (
                      <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                    )}
                    {mode === 'auto' && (
                      <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <path d="M8 21h8m-4-4v4" />
                      </svg>
                    )}
                    <span>{mode}</span>
                  </button>
                );
              })}
            </div>

            <span className="inline-flex items-center gap-1.5 font-medium text-label-primary">
              <svg
                className="h-3.5 w-3.5 text-accent-blue"
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
              <span>CPCB Math</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
