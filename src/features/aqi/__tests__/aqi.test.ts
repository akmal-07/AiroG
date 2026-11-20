import { describe, it, expect } from 'vitest';
import {
  calculateCpcbAqi,
  getAqiBand,
  isCpcbBandKey,
  findBestOutdoorWindow,
  CPCB_BANDS,
} from '../utils/aqi';
import type { ForecastHour } from '@/types';

describe('CPCB AQI Math & Breakpoints', () => {
  it('correctly calculates Delhi announcement example (PM2.5: 135.3 -> AQI 312 Very Poor)', () => {
    const aqi = calculateCpcbAqi(135.3, 275.0);
    expect(aqi).toBe(312);

    const band = getAqiBand(aqi);
    expect(band.key).toBe('Very Poor');
    expect(band.badgeText).toContain('text-rose');
  });

  it('determines all 6 CPCB bands accurately from standard breakpoints', () => {
    // Good (0-50)
    expect(getAqiBand(0).key).toBe('Good');
    expect(getAqiBand(50).key).toBe('Good');

    // Satisfactory (51-100)
    expect(getAqiBand(51).key).toBe('Satisfactory');
    expect(getAqiBand(100).key).toBe('Satisfactory');

    // Moderate (101-200)
    expect(getAqiBand(101).key).toBe('Moderate');
    expect(getAqiBand(200).key).toBe('Moderate');

    // Poor (201-300)
    expect(getAqiBand(201).key).toBe('Poor');
    expect(getAqiBand(300).key).toBe('Poor');

    // Very Poor (301-400)
    expect(getAqiBand(301).key).toBe('Very Poor');
    expect(getAqiBand(400).key).toBe('Very Poor');

    // Severe (401-500+)
    expect(getAqiBand(401).key).toBe('Severe');
    expect(getAqiBand(500).key).toBe('Severe');
    expect(getAqiBand(650).key).toBe('Severe');
  });

  it('calculates exact PM2.5 boundary breakpoints precisely', () => {
    expect(calculateCpcbAqi(30, 0)).toBe(50); // Good boundary
    expect(calculateCpcbAqi(60, 0)).toBe(100); // Satisfactory boundary
    expect(calculateCpcbAqi(90, 0)).toBe(200); // Moderate boundary
    expect(calculateCpcbAqi(120, 0)).toBe(300); // Poor boundary
    expect(calculateCpcbAqi(250, 0)).toBe(400); // Very Poor boundary
    expect(calculateCpcbAqi(380, 0)).toBe(500); // Severe boundary
  });

  it('calculates exact PM10 boundary breakpoints precisely', () => {
    expect(calculateCpcbAqi(0, 50)).toBe(50); // Good boundary
    expect(calculateCpcbAqi(0, 100)).toBe(100); // Satisfactory boundary
    expect(calculateCpcbAqi(0, 250)).toBe(200); // Moderate boundary
    expect(calculateCpcbAqi(0, 350)).toBe(300); // Poor boundary
    expect(calculateCpcbAqi(0, 430)).toBe(400); // Very Poor boundary
    expect(calculateCpcbAqi(0, 510)).toBe(500); // Severe boundary
  });

  it('determines the dominant pollutant by taking the max sub-index', () => {
    // PM2.5 is dominant: PM2.5 sub-index 300 vs PM10 sub-index 100
    expect(calculateCpcbAqi(120, 100)).toBe(300);

    // PM10 is dominant: PM10 sub-index 300 vs PM2.5 sub-index 100
    expect(calculateCpcbAqi(60, 350)).toBe(300);
  });

  it('handles zero, negative, and missing pollutant values safely', () => {
    expect(calculateCpcbAqi(0, 0)).toBe(0);
    expect(calculateCpcbAqi(-10, -5)).toBe(0);
    expect(calculateCpcbAqi(undefined, 100)).toBe(100);
    expect(calculateCpcbAqi(60, undefined)).toBe(100);
  });

  it('pairs color with text label across all CPCB bands', () => {
    for (const band of CPCB_BANDS) {
      expect(band.label).toBeTruthy();
      expect(band.badgeBg).toBeTruthy();
      expect(band.badgeText).toBeTruthy();
      expect(band.dotColor).toBeTruthy();
      expect(band.rangeText).toBeTruthy();
    }
  });

  it('validates CPCB band keys with type guard', () => {
    expect(isCpcbBandKey('Good')).toBe(true);
    expect(isCpcbBandKey('Very Poor')).toBe(true);
    expect(isCpcbBandKey('Hazardous')).toBe(false);
  });
});

describe('Forecast & Best Window Detection', () => {
  const sampleForecast: ForecastHour[] = [
    { time: '6:00 AM', aqi: 340, pm25: 160, pm10: 300 },
    { time: '8:00 AM', aqi: 360, pm25: 180, pm10: 320 },
    { time: '10:00 AM', aqi: 310, pm25: 135, pm10: 270 },
    { time: '12:00 PM', aqi: 270, pm25: 105, pm10: 230 },
    { time: '2:00 PM', aqi: 230, pm25: 95, pm10: 200 },
    { time: '4:00 PM', aqi: 240, pm25: 100, pm10: 210 },
    { time: '6:00 PM', aqi: 310, pm25: 135, pm10: 270 },
    { time: '8:00 PM', aqi: 375, pm25: 195, pm10: 350 },
    { time: '10:00 PM', aqi: 350, pm25: 170, pm10: 315 },
  ];

  it('detects the lowest 2-hour contiguous outdoor window and peak smog hour', () => {
    const windowInfo = findBestOutdoorWindow(sampleForecast);

    expect(windowInfo.windowText).toBe('2:00 PM – 4:00 PM');
    expect(windowInfo.averageAqi).toBe(235);
    expect(windowInfo.category).toBe('Poor');

    expect(windowInfo.peakHour).toBe('8:00 PM');
    expect(windowInfo.peakAqi).toBe(375);
    expect(windowInfo.peakCategory).toBe('Very Poor');
  });

  it('handles empty forecast gracefully with safe fallback', () => {
    const fallback = findBestOutdoorWindow([]);
    expect(fallback.windowText).toBeTruthy();
    expect(fallback.peakHour).toBeTruthy();
    expect(fallback.averageAqi).toBeGreaterThan(0);
  });
});

describe('AQI Fetcher, Coordinate Handling & Session Cache', () => {
  it('serves repeated requests from 5-minute session cache', async () => {
    const { fetchAqiData } = await import('../api/fetchAqi');
    const first = await fetchAqiData('Delhi');
    const second = await fetchAqiData('delhi');

    expect(first.reading.city).toBe('Delhi');
    expect(first).toBe(second); // Same cached object reference
  });

  it('sanitizes city input whitespace and case', async () => {
    const { fetchAqiData } = await import('../api/fetchAqi');
    const result = await fetchAqiData('   mUmBAi   ');
    expect(result.reading.city.toLowerCase()).toBe('mumbai');
    expect(result.reading.aqi).toBeGreaterThan(0);
  });

  it('matches multi-part location suggestions using fallback prefix matching', async () => {
    const { fetchAqiData } = await import('../api/fetchAqi');
    // Autocomplete returns label "Tirupati, Andhra Pradesh, IN"
    const result = await fetchAqiData('Tirupati, Andhra Pradesh, IN');
    expect(result.reading.city).toBe('Tirupati');
    expect(result.reading.aqi).toBe(45);
  });

  it('fetches successfully with optional coordinate parameters', async () => {
    const { fetchAqiData } = await import('../api/fetchAqi');
    const result = await fetchAqiData('Bengaluru', { lat: 12.9716, lon: 77.5946 });
    expect(result.reading.city).toBe('Bengaluru');
    expect(result.reading.aqi).toBe(68);
  });

  it('throws user-friendly error for empty or whitespace-only input', async () => {
    const { fetchAqiData } = await import('../api/fetchAqi');
    await expect(fetchAqiData('')).rejects.toThrow('Please enter a valid city name.');
    await expect(fetchAqiData('    ')).rejects.toThrow('Please enter a valid city name.');
  });

  it('throws user-friendly error for completely unknown non-existent cities', async () => {
    const { fetchAqiData } = await import('../api/fetchAqi');
    await expect(fetchAqiData('NonExistentCityXYZ12345')).rejects.toThrow(
      /Unable to find air quality data/
    );
  });
});
