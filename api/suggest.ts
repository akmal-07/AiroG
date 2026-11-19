import type { IncomingMessage, ServerResponse } from 'http';

export interface SuggestionItem {
  readonly name: string;
  readonly state?: string;
  readonly country: string;
  readonly label: string;
  readonly lat: number;
  readonly lon: number;
}

interface OpenWeatherGeoItem {
  readonly name: string;
  readonly lat: number;
  readonly lon: number;
  readonly country: string;
  readonly state?: string;
}

/**
 * Curated Indian fallback locations for zero-API-key dev and graceful offline degradation.
 */
const FALLBACK_LOCATIONS: readonly SuggestionItem[] = [
  { name: 'Delhi', state: 'Delhi', country: 'IN', label: 'Delhi, India', lat: 28.6139, lon: 77.209 },
  { name: 'Mumbai', state: 'Maharashtra', country: 'IN', label: 'Mumbai, Maharashtra', lat: 19.076, lon: 72.8777 },
  { name: 'Bengaluru', state: 'Karnataka', country: 'IN', label: 'Bengaluru, Karnataka', lat: 12.9716, lon: 77.5946 },
  { name: 'Kolkata', state: 'West Bengal', country: 'IN', label: 'Kolkata, West Bengal', lat: 22.5726, lon: 88.3639 },
  { name: 'Chennai', state: 'Tamil Nadu', country: 'IN', label: 'Chennai, Tamil Nadu', lat: 13.0827, lon: 80.2707 },
  { name: 'Hyderabad', state: 'Telangana', country: 'IN', label: 'Hyderabad, Telangana', lat: 17.385, lon: 78.4867 },
  { name: 'Tirupati', state: 'Andhra Pradesh', country: 'IN', label: 'Tirupati, Andhra Pradesh, IN', lat: 13.6288, lon: 79.4192 },
  { name: 'Indiranagar', state: 'Karnataka', country: 'IN', label: 'Indiranagar, Karnataka', lat: 12.9784, lon: 77.6408 },
  { name: 'Pune', state: 'Maharashtra', country: 'IN', label: 'Pune, Maharashtra', lat: 18.5204, lon: 73.8567 },
  { name: 'Ahmedabad', state: 'Gujarat', country: 'IN', label: 'Ahmedabad, Gujarat', lat: 23.0225, lon: 72.5714 },
  { name: 'Jaipur', state: 'Rajasthan', country: 'IN', label: 'Jaipur, Rajasthan', lat: 26.9124, lon: 75.7873 },
  { name: 'Lucknow', state: 'Uttar Pradesh', country: 'IN', label: 'Lucknow, Uttar Pradesh', lat: 26.8467, lon: 80.9462 },
];

/**
 * Cleanly formats a place label (e.g., "Indiranagar, Karnataka" or "Tirupati, Andhra Pradesh, IN").
 */
function formatLabel(name: string, state?: string, country?: string): string {
  const cleanName = name.trim();
  const cleanState = state?.trim();
  const cleanCountry = country?.trim().toUpperCase();

  const parts = [cleanName];
  if (cleanState && cleanState.toLowerCase() !== cleanName.toLowerCase()) {
    parts.push(cleanState);
  }
  if (cleanCountry) {
    if (cleanCountry === 'IN') {
      if (parts.length === 1) {
        parts.push('India');
      }
    } else {
      parts.push(cleanCountry);
    }
  }
  return parts.join(', ');
}

/**
 * Deduplicates and sorts locations, placing Indian locations first.
 */
function processLocations(rawItems: readonly OpenWeatherGeoItem[]): SuggestionItem[] {
  const seen = new Set<string>();
  const results: SuggestionItem[] = [];

  for (const item of rawItems) {
    const name = (item.name || '').trim();
    if (!name) continue;
    const state = item.state ? item.state.trim() : undefined;
    const country = (item.country || '').trim().toUpperCase();

    const dedupKey = `${name.toLowerCase()}|${(state || '').toLowerCase()}|${country.toLowerCase()}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    results.push({
      name,
      state,
      country,
      label: formatLabel(name, state, country),
      lat: item.lat,
      lon: item.lon,
    });
  }

  // Sort Indian locations (country === 'IN') first
  results.sort((a, b) => {
    const aIsIndia = a.country === 'IN' ? 1 : 0;
    const bIsIndia = b.country === 'IN' ? 1 : 0;
    return bIsIndia - aIsIndia;
  });

  return results.slice(0, 6);
}

/**
 * Matches query against local fallback locations.
 */
function getFallbackMatches(cleanQuery: string): SuggestionItem[] {
  const lower = cleanQuery.toLowerCase();
  return FALLBACK_LOCATIONS.filter(
    (loc) =>
      loc.name.toLowerCase().includes(lower) ||
      (loc.state && loc.state.toLowerCase().includes(lower)) ||
      loc.label.toLowerCase().includes(lower)
  ).slice(0, 6);
}

/**
 * Serverless handler for live city search autocomplete (/api/suggest?q=...)
 */
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  const sendJson = (status: number, data: unknown) => {
    res.statusCode = status;
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
    res.end(JSON.stringify(data));
  };

  try {
    const host = req.headers.host || 'localhost';
    const parsedUrl = new URL(req.url || '', `http://${host}`);
    const rawQuery = parsedUrl.searchParams.get('q') || '';

    // Require >= 2 characters, sanitize input, max 60 characters
    const cleanQuery = rawQuery
      .trim()
      .replace(/[^\w\s,.-]/gi, '')
      .slice(0, 60);

    if (cleanQuery.length < 2) {
      sendJson(200, { suggestions: [] });
      return;
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;

    // If API key is unconfigured, return graceful fallback matches without error
    if (!apiKey) {
      const fallbacks = getFallbackMatches(cleanQuery);
      sendJson(200, { suggestions: fallbacks });
      return;
    }

    // Query OpenWeather Direct Geocoding with 8-second timeout
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
      cleanQuery
    )}&limit=6&appid=${encodeURIComponent(apiKey)}`;

    const response = await fetch(geoUrl, {
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      // Fallback gracefully on upstream error
      const fallbacks = getFallbackMatches(cleanQuery);
      sendJson(200, { suggestions: fallbacks });
      return;
    }

    const data = (await response.json()) as readonly OpenWeatherGeoItem[];
    const processed = processLocations(Array.isArray(data) ? data : []);

    // If upstream returned empty, check local fallback
    if (processed.length === 0) {
      const fallbacks = getFallbackMatches(cleanQuery);
      sendJson(200, { suggestions: fallbacks });
      return;
    }

    sendJson(200, { suggestions: processed });
  } catch (_err: unknown) {
    // Never log or leak keys. Return suggestions gracefully on timeout/errors
    sendJson(200, { suggestions: [] });
  }
}
