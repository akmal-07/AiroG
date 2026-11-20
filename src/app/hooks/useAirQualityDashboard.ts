import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { fetchAqiData } from '@/features/aqi/api/fetchAqi';
import { initStorage, loadHousehold } from '@/features/household/utils/storage';
import type { AqiFetchResult, DayPlan, Household, PlanItem } from '@/types';

export const POPULAR_CITIES = [
  'Delhi',
  'Mumbai',
  'Bengaluru',
  'Kolkata',
  'Chennai',
  'Hyderabad',
  'Tirupati',
] as const;

/**
 * Evaluates whether an asynchronous response should be applied based on request sequence.
 */
export function isSequenceCurrent(responseSeq: number, currentSeq: number): boolean {
  return responseSeq === currentSeq;
}

/**
 * Sanitizes and validates user city input (max 60 chars, trimmed, stripped of unsafe symbols).
 */
export function sanitizeCityInput(input: string): string {
  return input
    .trim()
    .replace(/[^\w\s,.-]/gi, '')
    .slice(0, 60);
}

/**
 * Custom hook orchestrating air quality queries, household profile mutations,
 * dynamic code-split plan synthesis, and live accessibility announcements.
 */
export function useAirQualityDashboard() {
  const [cityInput, setCityInput] = useState('Delhi');
  const [activeCity, setActiveCity] = useState('Delhi');
  const [loadingAqi, setLoadingAqi] = useState(true);
  const [aqiError, setAqiError] = useState<string | null>(null);
  const [aqiResult, setAqiResult] = useState<AqiFetchResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [household, setHousehold] = useState<Household>(() => initStorage());
  const [plan, setPlan] = useState<DayPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  // Persistent live announcement for assistive technologies
  const [liveAnnouncement, setLiveAnnouncement] = useState('Welcome to AiroG.');

  // Concurrency & race-condition sequence guard refs
  const requestSeqRef = useRef(0);
  const aqiAbortRef = useRef<AbortController | null>(null);
  const planAbortRef = useRef<AbortController | null>(null);

  const loadPlanForCurrentState = useCallback(
    async (currentAqi: AqiFetchResult, currentHousehold: Household, targetSeq?: number) => {
      const seq = targetSeq ?? ++requestSeqRef.current;
      if (planAbortRef.current) planAbortRef.current.abort();
      planAbortRef.current = new AbortController();

      setLoadingPlan(true);
      setPlanError(null);

      try {
        const [{ fetchDayPlan }, { computeItemImpact, generateDaySummary }] = await Promise.all([
          import('@/features/plan/api/plan'),
          import('@/features/plan/utils/impact'),
        ]);

        if (seq !== requestSeqRef.current) return;

        const generated = await fetchDayPlan({
          city: currentAqi.reading.city,
          aqi: currentAqi.reading.aqi,
          pm25: currentAqi.reading.pm25,
          pm10: currentAqi.reading.pm10,
          category: currentAqi.reading.category,
          bestWindow: currentAqi.bestWindow,
          peak: {
            hour: currentAqi.bestWindow.peakHour,
            aqi: currentAqi.bestWindow.peakAqi,
          },
          household: currentHousehold,
        });

        if (seq !== requestSeqRef.current) return;

        const enrichedItems: PlanItem[] = generated.items.map((item) => ({
          ...item,
          computedImpact: computeItemImpact(item, currentAqi.reading.category, currentHousehold),
        }));

        const summary = generateDaySummary(
          currentAqi.reading.aqi,
          currentAqi.reading.category,
          currentHousehold,
          enrichedItems
        );

        setPlan({
          ...generated,
          items: enrichedItems,
          summary,
        });

        setLiveAnnouncement(
          `Personalized low-emission day plan generated for ${currentAqi.reading.city}.`
        );
      } catch (err: unknown) {
        if (seq !== requestSeqRef.current) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        const msg = err instanceof Error ? err.message : 'Unable to generate day plan.';
        setPlanError(msg);
        setLiveAnnouncement(`Plan error: ${msg}`);
      } finally {
        if (seq === requestSeqRef.current) {
          setLoadingPlan(false);
        }
      }
    },
    []
  );

  const loadCityData = useCallback(
    async (rawCityName: string) => {
      const sanitized = sanitizeCityInput(rawCityName);
      if (!sanitized) return;

      const seq = ++requestSeqRef.current;
      if (aqiAbortRef.current) aqiAbortRef.current.abort();
      if (planAbortRef.current) planAbortRef.current.abort();
      aqiAbortRef.current = new AbortController();

      setLoadingAqi(true);
      setAqiError(null);
      setLoadingPlan(true);
      setPlanError(null);
      setPlan(null); // Immediately clear stale plan so old plan never flashes under new hero
      setLiveAnnouncement(`Fetching air quality data for ${sanitized}...`);

      try {
        const result = await fetchAqiData(sanitized, undefined, aqiAbortRef.current.signal);
        if (seq !== requestSeqRef.current) return;

        setAqiResult(result);
        setActiveCity(result.reading.city);
        setLoadingAqi(false);

        setLiveAnnouncement(
          `Air quality updated for ${result.reading.city}. AQI is ${result.reading.aqi}, ${result.reading.category}. Best window is ${result.bestWindow.windowText}.`
        );

        const currentProfile = loadHousehold();
        void loadPlanForCurrentState(result, currentProfile, seq);
      } catch (err: unknown) {
        if (seq !== requestSeqRef.current) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        const msg = err instanceof Error ? err.message : 'Failed to retrieve air quality data.';
        setAqiError(msg);
        setAqiResult(null);
        setPlan(null);
        setLoadingAqi(false);
        setLoadingPlan(false);
        setLiveAnnouncement(`Error loading air quality: ${msg}`);
      }
    },
    [loadPlanForCurrentState]
  );

  useEffect(() => {
    void loadCityData('Delhi');
  }, [loadCityData]);

  const handleHouseholdChange = useCallback(
    (updated: Household) => {
      setHousehold(updated);
      if (aqiResult) {
        void loadPlanForCurrentState(aqiResult, updated);
      }
    },
    [aqiResult, loadPlanForCurrentState]
  );

  const handleCityInputChange = (value: string) => {
    if (searchError) setSearchError(null);
    setCityInput(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized = sanitizeCityInput(cityInput);
    if (!sanitized) {
      setSearchError('Please enter an Indian city or town name.');
      return;
    }
    setSearchError(null);
    void loadCityData(sanitized);
  };

  const handleCitySelect = (cityName: string) => {
    const sanitized = sanitizeCityInput(cityName);
    setSearchError(null);
    setCityInput(sanitized);
    if (sanitized) {
      void loadCityData(sanitized);
    }
  };

  const handleRetryAqi = () => {
    void loadCityData(activeCity || cityInput || 'Delhi');
  };

  const handleRetryPlan = () => {
    if (aqiResult) {
      void loadPlanForCurrentState(aqiResult, household);
    }
  };

  const daySummary = useMemo(() => {
    if (!aqiResult || !plan) return null;
    return plan.summary ?? null;
  }, [aqiResult, plan]);

  return {
    cityInput,
    setCityInput: handleCityInputChange,
    activeCity,
    loadingAqi,
    aqiError,
    aqiResult,
    searchError,
    household,
    plan,
    loadingPlan,
    planError,
    liveAnnouncement,
    daySummary,
    handleSubmit,
    handleCitySelect,
    handleRetryAqi,
    handleRetryPlan,
    handleHouseholdChange,
    loadCityData,
  };
}
