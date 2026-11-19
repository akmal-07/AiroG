import { describe, it, expect } from 'vitest';
import {
  calculateCpcbAqi,
  getAqiBand,
  isCpcbBandKey,
  findBestOutdoorWindow,
  CPCB_BANDS,
} from '../aqi';
import type { ForecastHour } from '../types';

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

describe('AQI Fetcher & 10-Minute Session Cache', () => {
  it('serves repeated requests from session cache', async () => {
    const { fetchAqiData } = await import('../fetchAqi');
    const first = await fetchAqiData('Delhi');
    const second = await fetchAqiData('delhi');

    expect(first.reading.city).toBe('Delhi');
    expect(first).toBe(second); // Same cached object reference
  });
});
