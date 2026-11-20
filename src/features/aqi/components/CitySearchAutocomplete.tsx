import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface SuggestionItem {
  readonly name: string;
  readonly state?: string;
  readonly country: string;
  readonly label: string;
  readonly lat?: number;
  readonly lon?: number;
}

interface CitySearchAutocompleteProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSelect: (cityName: string) => void;
  readonly onSubmit: () => void;
  readonly disabled?: boolean;
  readonly placeholder?: string;
}

export const CitySearchAutocomplete: React.FC<CitySearchAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  onSubmit,
  disabled = false,
  placeholder = 'Enter any Indian city (e.g., Delhi, Mumbai, Tirupati)...',
}) => {
  const [suggestions, setSuggestions] = useState<readonly SuggestionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced search with AbortController (250ms)
  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setActiveIndex(-1);
      setIsLoading(false);
      return;
    }

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal });
        if (res.ok) {
          const data = (await res.json()) as { suggestions?: SuggestionItem[] };
          const items = Array.isArray(data.suggestions) ? data.suggestions : [];
          setSuggestions(items);
          setIsOpen(items.length > 0);
          setActiveIndex(-1);
        } else {
          setSuggestions([]);
          setIsOpen(false);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  // Click outside dismissal
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleSelect = useCallback((item: SuggestionItem) => {
    onChange(item.label);
    setIsOpen(false);
    setActiveIndex(-1);
    onSelect(item.label);
  }, [onChange, onSelect]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        e.preventDefault();
        setIsOpen(true);
        setActiveIndex(0);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        handleSelect(suggestions[activeIndex]);
      } else {
        setIsOpen(false);
        onSubmit();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <label htmlFor="city-input" className="sr-only">
        Enter city name
      </label>

      {/* Screen reader live notification for available suggestions */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isOpen && suggestions.length > 0
          ? `${suggestions.length} suggestion${suggestions.length === 1 ? '' : 's'} available`
          : ''}
      </div>

      {/* Input with WAI-ARIA Combobox Semantics */}
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-label-secondary"
          aria-hidden="true"
        >
          {isLoading ? (
            <svg className="h-4 w-4 animate-spin text-accent-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          )}
        </div>

        <input
          ref={inputRef}
          id="city-input"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen && suggestions.length > 0}
          aria-controls="city-suggestions-listbox"
          aria-activedescendant={isOpen && activeIndex >= 0 ? `city-option-${activeIndex}` : undefined}
          maxLength={60}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-2xl border border-hairline bg-nested py-3 pl-11 pr-4 text-sm font-medium text-label-primary placeholder:text-label-secondary transition focus:border-accent-blue focus:bg-elevated focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
        />
      </div>

      {/* Floating Apple-Style Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          id="city-suggestions-listbox"
          role="listbox"
          aria-label="City suggestions"
          className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-hairline bg-elevated/95 backdrop-blur-md p-1.5 shadow-apple dark:shadow-none overflow-hidden transition-all duration-150"
        >
          {suggestions.map((item, index) => {
            const isSelected = index === activeIndex;
            const subtitle = item.state || item.country || '';

            return (
              <li
                key={`${item.name}-${index}`}
                id={`city-option-${index}`}
                role="option"
                aria-selected={isSelected}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-colors cursor-pointer select-none ${
                  isSelected ? 'bg-nested text-label-primary ring-1 ring-hairline' : 'text-label-primary hover:bg-nested/70'
                }`}
              >
                <div className="flex flex-col truncate pr-2">
                  <span className="text-sm font-semibold tracking-tight text-label-primary truncate">{item.name}</span>
                  {subtitle && <span className="text-xs text-label-secondary truncate">{item.label}</span>}
                </div>
                {item.country === 'IN' && (
                  <span className="shrink-0 text-[10px] font-semibold text-label-secondary bg-nested px-1.5 py-0.5 rounded border border-hairline">IN</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
