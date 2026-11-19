import type { Household, StorageStateV1 } from '@/types';

export const STORAGE_KEY = 'airog_v1';

export const DEFAULT_HOUSEHOLD: Household = {
  adults: 2,
  children: 1,
  elders: 0,
  hasAsthma: false,
  hasPurifier: false,
};

/**
 * Checks whether browser localStorage is available in the current environment.
 */
function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const testKey = '__airog_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes and validates unknown object data into a strictly typed Household object.
 */
function sanitizeHousehold(raw: unknown): Household {
  if (typeof raw !== 'object' || raw === null) {
    return DEFAULT_HOUSEHOLD;
  }

  const obj = raw as Record<string, unknown>;

  const adults = typeof obj.adults === 'number' && obj.adults >= 0 ? Math.min(20, Math.floor(obj.adults)) : DEFAULT_HOUSEHOLD.adults;
  const children = typeof obj.children === 'number' && obj.children >= 0 ? Math.min(20, Math.floor(obj.children)) : DEFAULT_HOUSEHOLD.children;
  const elders = typeof obj.elders === 'number' && obj.elders >= 0 ? Math.min(20, Math.floor(obj.elders)) : DEFAULT_HOUSEHOLD.elders;
  const hasAsthma = typeof obj.hasAsthma === 'boolean' ? obj.hasAsthma : DEFAULT_HOUSEHOLD.hasAsthma;
  const hasPurifier = typeof obj.hasPurifier === 'boolean' ? obj.hasPurifier : DEFAULT_HOUSEHOLD.hasPurifier;

  return {
    adults,
    children,
    elders,
    hasAsthma,
    hasPurifier,
  };
}

/**
 * Loads the stored household profile from localStorage key `airog_v1`.
 * Returns DEFAULT_HOUSEHOLD if missing or invalid.
 */
export function loadHousehold(): Household {
  if (!isLocalStorageAvailable()) {
    return DEFAULT_HOUSEHOLD;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_HOUSEHOLD;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) {
      return DEFAULT_HOUSEHOLD;
    }

    const state = parsed as Record<string, unknown>;
    // Version 1 check
    if (state.version === 1 && state.household) {
      return sanitizeHousehold(state.household);
    }

    // Direct fallback if household fields were saved at root
    return sanitizeHousehold(parsed);
  } catch {
    return DEFAULT_HOUSEHOLD;
  }
}

/**
 * Saves the household profile to localStorage under key `airog_v1` using version 1 schema.
 */
export function saveHousehold(household: Household): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    const state: StorageStateV1 = {
      version: 1,
      household: sanitizeHousehold(household),
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Fail gracefully without crashing
  }
}

/**
 * Initializes localStorage key `airog_v1` on app load if not already set.
 * Returns the current (or initialized) household profile.
 */
export function initStorage(): Household {
  if (!isLocalStorageAvailable()) {
    return DEFAULT_HOUSEHOLD;
  }

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      saveHousehold(DEFAULT_HOUSEHOLD);
      return DEFAULT_HOUSEHOLD;
    }
    return loadHousehold();
  } catch {
    return DEFAULT_HOUSEHOLD;
  }
}
