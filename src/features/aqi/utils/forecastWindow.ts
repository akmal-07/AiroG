import type { ForecastHour, OutdoorWindowInfo } from '@/types';
import { getAqiBand } from './aqi';

/**
 * Formats a timestamp or time string into a 12-hour human time (e.g., "2:00 PM").
 */
export function formatTimeLabel(timeStr: string): string {
  if (/\d+:\d+\s+(?:AM|PM)/i.test(timeStr)) {
    return timeStr;
  }
  try {
    const date = new Date(timeStr);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
  } catch {
    // Fail-safe fallback to raw string
  }
  return timeStr;
}

/**
 * Finds the day's best outdoor window (lowest-AQI stretch of 2+ contiguous hours)
 * and the peak smog hour from an hourly forecast.
 *
 * When forecast telemetry is unavailable, it derives conservatively from current live AQI
 * or marks window times cleanly as "Unavailable" without inventing hardcoded numbers.
 */
export function findBestOutdoorWindow(
  forecast: readonly ForecastHour[],
  currentAqi?: number
): OutdoorWindowInfo {
  if (!forecast || forecast.length === 0) {
    const aqi =
      typeof currentAqi === 'number' && Number.isFinite(currentAqi) && currentAqi >= 0
        ? Math.round(currentAqi)
        : 0;
    const category = aqi > 0 ? getAqiBand(aqi).key : 'Good';

    return {
      startHour: 'Unavailable',
      endHour: 'Unavailable',
      windowText: 'Forecast window unavailable',
      averageAqi: aqi,
      category,
      peakHour: 'Unavailable',
      peakAqi: aqi,
      peakCategory: category,
    };
  }

  // 1. Find the peak smog hour
  let peakIndex = 0;
  let maxAqi = -1;

  for (let i = 0; i < forecast.length; i++) {
    const item = forecast[i]!;
    if (item.aqi > maxAqi) {
      maxAqi = item.aqi;
      peakIndex = i;
    }
  }

  const peakItem = forecast[peakIndex]!;
  const peakHour = formatTimeLabel(peakItem.time);
  const peakAqi = Math.round(peakItem.aqi);
  const peakCategory = getAqiBand(peakAqi).key;

  // 2. Single-hour forecast edge case
  if (forecast.length === 1) {
    const item = forecast[0]!;
    const timeFormatted = formatTimeLabel(item.time);
    const aqi = Math.round(item.aqi);
    return {
      startHour: timeFormatted,
      endHour: timeFormatted,
      windowText: timeFormatted,
      averageAqi: aqi,
      category: getAqiBand(aqi).key,
      peakHour,
      peakAqi,
      peakCategory,
    };
  }

  // 3. Find lowest-AQI stretch of 2 contiguous hours
  let bestStartIndex = 0;
  let minWindowSum = Infinity;
  const windowSpan = 2;
  const maxSearchIndex = forecast.length - windowSpan;

  for (let i = 0; i <= maxSearchIndex; i++) {
    const sum = forecast[i]!.aqi + forecast[i + 1]!.aqi;
    if (sum < minWindowSum) {
      minWindowSum = sum;
      bestStartIndex = i;
    }
  }

  const startItem = forecast[bestStartIndex]!;
  const endItem = forecast[bestStartIndex + 1]!;
  const avgAqi = Math.round(minWindowSum / windowSpan);

  const startHour = formatTimeLabel(startItem.time);
  const endHour = formatTimeLabel(endItem.time);
  const windowText = `${startHour} – ${endHour}`;

  return {
    startHour,
    endHour,
    windowText,
    averageAqi: avgAqi,
    category: getAqiBand(avgAqi).key,
    peakHour,
    peakAqi,
    peakCategory,
  };
}
