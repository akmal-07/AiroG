import type { AqiFetchResult, AqiReading, ForecastHour } from '@/types';
import { getDemoAqi } from '../data/demo';
import { calculateCpcbAqi, findBestOutdoorWindow, getAqiBand } from '../utils/aqi';

interface CacheEntry {
  readonly result: AqiFetchResult;
  readonly timestamp: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes session cache
const aqiCache = new Map<string, CacheEntry>();

interface ApiAqiResponse {
  readonly city: string;
  readonly aqi: number;
  readonly pm25?: number;
  readonly pm10?: number;
  readonly no2?: number;
  readonly o3?: number;
  readonly co?: number;
  readonly so2?: number;
  readonly updatedAt?: string;
  readonly forecast?: readonly ForecastHour[];
  readonly error?: string;
}

/**
 * Fetches AQI for a given city via the serverless proxy /api/aqi.
 * If the API is unavailable, network fails, or keys are missing, falls back to curated Indian demo data.
 * Throws a user-friendly error if the city is unknown to both live API and demo dataset.
 */
export async function fetchAqiData(city: string): Promise<AqiFetchResult> {
  const normalizedKey = city.trim().toLowerCase();
  if (!normalizedKey) {
    throw new Error('Please enter a valid city name.');
  }

  // 1. Check in-memory cache
  const cached = aqiCache.get(normalizedKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }

  // 2. Attempt live serverless API fetch
  try {
    const response = await fetch(`/api/aqi?city=${encodeURIComponent(city.trim())}`);

    if (response.ok) {
      const data = (await response.json()) as ApiAqiResponse;

      if (data && typeof data.city === 'string') {
        const computedAqi = typeof data.aqi === 'number' && data.aqi > 0
          ? data.aqi
          : calculateCpcbAqi(data.pm25, data.pm10);

        const category = getAqiBand(computedAqi).key;
        const forecast: readonly ForecastHour[] = Array.isArray(data.forecast) ? data.forecast : [];
        const bestWindow = findBestOutdoorWindow(forecast);

        const reading: AqiReading = {
          city: data.city,
          aqi: computedAqi,
          pm25: data.pm25,
          pm10: data.pm10,
          category,
          updatedAt: data.updatedAt || new Date().toISOString(),
          isDemo: false,
          pollutants: {
            pm25: data.pm25,
            pm10: data.pm10,
            no2: data.no2,
            o3: data.o3,
            co: data.co,
            so2: data.so2,
          },
          forecast,
        };

        const result: AqiFetchResult = {
          reading,
          bestWindow,
          isDemo: false,
        };

        aqiCache.set(normalizedKey, { result, timestamp: now });
        return result;
      }
    }
  } catch {
    // Network or proxy failure: gracefully fall through to demo data
  }

  // 3. Fallback to curated Indian demo data (handles "Tirupati, Andhra Pradesh, IN" -> "Tirupati")
  const cityNameOnly = city.split(',')[0]?.trim() || city;
  const demoReading = getDemoAqi(city) || getDemoAqi(cityNameOnly);
  if (demoReading) {
    const forecast = demoReading.forecast || [];
    const bestWindow = findBestOutdoorWindow(forecast);

    const result: AqiFetchResult = {
      reading: {
        ...demoReading,
        isDemo: true,
      },
      bestWindow,
      isDemo: true,
    };

    aqiCache.set(normalizedKey, { result, timestamp: now });
    return result;
  }

  // 4. City not found in live API or demo data
  throw new Error(`Unable to find air quality data for "${city}". Please try Delhi, Mumbai, Bengaluru, or another major city.`);
}
