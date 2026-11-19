import type { IncomingMessage, ServerResponse } from 'http';

interface OpenWeatherGeo {
  readonly name: string;
  readonly lat: number;
  readonly lon: number;
  readonly country: string;
}

interface OpenWeatherPollutionItem {
  readonly dt: number;
  readonly components: {
    readonly co: number;
    readonly no?: number;
    readonly no2: number;
    readonly o3: number;
    readonly so2: number;
    readonly pm2_5: number;
    readonly pm10: number;
    readonly nh3?: number;
  };
}

interface OpenWeatherPollutionResponse {
  readonly list: readonly OpenWeatherPollutionItem[];
}

interface Breakpoint {
  readonly bLo: number;
  readonly bHi: number;
  readonly iLo: number;
  readonly iHi: number;
}

const PM25_BREAKPOINTS: readonly Breakpoint[] = [
  { bLo: 0, bHi: 30, iLo: 0, iHi: 50 },
  { bLo: 31, bHi: 60, iLo: 51, iHi: 100 },
  { bLo: 61, bHi: 90, iLo: 101, iHi: 200 },
  { bLo: 91, bHi: 120, iLo: 201, iHi: 300 },
  { bLo: 121, bHi: 250, iLo: 301, iHi: 400 },
  { bLo: 251, bHi: 380, iLo: 401, iHi: 500 },
];

const PM10_BREAKPOINTS: readonly Breakpoint[] = [
  { bLo: 0, bHi: 50, iLo: 0, iHi: 50 },
  { bLo: 51, bHi: 100, iLo: 51, iHi: 100 },
  { bLo: 101, bHi: 250, iLo: 101, iHi: 200 },
  { bLo: 251, bHi: 350, iLo: 201, iHi: 300 },
  { bLo: 351, bHi: 430, iLo: 301, iHi: 400 },
  { bLo: 431, bHi: 510, iLo: 401, iHi: 500 },
];

function calculateSubIndex(concentration: number, breakpoints: readonly Breakpoint[]): number {
  if (concentration < 0 || !Number.isFinite(concentration)) return 0;
  for (const bp of breakpoints) {
    if (concentration >= bp.bLo && concentration <= bp.bHi) {
      const slope = (bp.iHi - bp.iLo) / (bp.bHi - bp.bLo);
      return Math.round(slope * (concentration - bp.bLo) + bp.iLo);
    }
  }
  const last = breakpoints[breakpoints.length - 1]!;
  if (concentration > last.bHi) {
    const slope = (last.iHi - last.iLo) / (last.bHi - last.bLo);
    return Math.min(500, Math.max(401, Math.round(slope * (concentration - last.bLo) + last.iLo)));
  }
  return 0;
}

function computeCpcbAqi(pm25?: number, pm10?: number): number {
  const subPm25 = typeof pm25 === 'number' && Number.isFinite(pm25) ? calculateSubIndex(pm25, PM25_BREAKPOINTS) : 0;
  const subPm10 = typeof pm10 === 'number' && Number.isFinite(pm10) ? calculateSubIndex(pm10, PM10_BREAKPOINTS) : 0;
  return Math.max(subPm25, subPm10);
}

/**
 * Serverless API handler: /api/aqi?city=<name>
 * Geocodes city and calls OpenWeather Air Pollution endpoints.
 * Returns CPCB AQI, pollutant components, and hourly forecast.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const sendJson = (statusCode: number, data: unknown): void => {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': statusCode === 200 ? 'public, s-maxage=600, stale-while-revalidate=300' : 'no-store',
    });
    res.end(JSON.stringify(data));
  };

  try {
    const host = req.headers.host ?? 'localhost';
    const parsedUrl = new URL(req.url ?? '/', `http://${host}`);
    const city = parsedUrl.searchParams.get('city')?.trim();

    if (!city) {
      sendJson(400, { error: 'Missing required query parameter "city".' });
      return;
    }

    const apiKey = process.env.OPENWEATHER_API_KEY?.trim();
    if (!apiKey) {
      sendJson(500, { error: 'OpenWeather API key is not configured on the server.' });
      return;
    }

    // 1. Geocode City
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${encodeURIComponent(apiKey)}`;
    const geoResponse = await fetch(geoUrl);

    if (!geoResponse.ok) {
      sendJson(geoResponse.status, { error: `Failed to geocode city "${city}".` });
      return;
    }

    const geoData = (await geoResponse.json()) as readonly OpenWeatherGeo[];
    if (!geoData || geoData.length === 0 || !geoData[0]) {
      sendJson(404, { error: `City "${city}" not found.` });
      return;
    }

    const { lat, lon, name } = geoData[0];

    // 2. Fetch current pollution and forecast in parallel
    const currentUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${encodeURIComponent(apiKey)}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${encodeURIComponent(apiKey)}`;

    const [currentRes, forecastRes] = await Promise.all([
      fetch(currentUrl),
      fetch(forecastUrl),
    ]);

    if (!currentRes.ok || !forecastRes.ok) {
      sendJson(502, { error: 'Failed to fetch pollution data from OpenWeather.' });
      return;
    }

    const currentData = (await currentRes.json()) as OpenWeatherPollutionResponse;
    const forecastData = (await forecastRes.json()) as OpenWeatherPollutionResponse;

    const currentItem = currentData.list[0];
    if (!currentItem) {
      sendJson(502, { error: 'Empty air pollution reading returned from provider.' });
      return;
    }

    const c = currentItem.components;
    const computedAqi = computeCpcbAqi(c.pm2_5, c.pm10);

    // Format forecast (next 24 entries)
    const forecast = (forecastData.list || []).slice(0, 24).map((f) => ({
      time: new Date(f.dt * 1000).toISOString(),
      aqi: computeCpcbAqi(f.components.pm2_5, f.components.pm10),
      pm25: f.components.pm2_5,
      pm10: f.components.pm10,
    }));

    sendJson(200, {
      city: name,
      aqi: computedAqi,
      pm25: c.pm2_5,
      pm10: c.pm10,
      no2: c.no2,
      o3: c.o3,
      co: c.co,
      so2: c.so2,
      updatedAt: new Date(currentItem.dt * 1000).toISOString(),
      forecast,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    sendJson(500, { error: message });
  }
}
