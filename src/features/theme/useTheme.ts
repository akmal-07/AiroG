import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';

const THEME_STORAGE_KEY = 'airog_theme';

/**
 * Custom hook providing Apple-grade Light / Dark / Auto theme switching
 * with zero-flash OS synchronization and localStorage persistence.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'auto') {
          return saved;
        }
      } catch {
        // Fallback for sandboxed storage environments
      }
    }
    return 'auto';
  });

  const applyTheme = useCallback((mode: ThemeMode) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const isDark =
      mode === 'dark' ||
      (mode === 'auto' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  const setTheme = useCallback(
    (mode: ThemeMode) => {
      setThemeState(mode);
      applyTheme(mode);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, mode);
      } catch {
        // Fail-safe for storage quota / sandbox restrictions
      }
    },
    [applyTheme]
  );

  useEffect(() => {
    applyTheme(theme);

    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleOsChange = () => {
      if (theme === 'auto') {
        applyTheme('auto');
      }
    };

    mediaQuery.addEventListener('change', handleOsChange);
    return () => mediaQuery.removeEventListener('change', handleOsChange);
  }, [theme, applyTheme]);

  return { theme, setTheme };
}
