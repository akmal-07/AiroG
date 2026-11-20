// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import handler from '../aqi.js';
import { createMockRequest, createMockResponse } from './mockHttp.js';

describe('Serverless Handler: /api/aqi', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('rejects disallowed HTTP methods with 405 and Allow header', async () => {
    const req = createMockRequest({ method: 'POST', url: '/api/aqi?city=Delhi' });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(405);
    expect(result.headers['allow']).toContain('GET');
    expect(result.json()).toEqual({ error: expect.stringContaining('Method Not Allowed') });
  });

  it('handles OPTIONS preflight with 200 and CORS headers', async () => {
    const req = createMockRequest({ method: 'OPTIONS', url: '/api/aqi' });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(200);
    expect(result.headers['access-control-allow-origin']).toBe('*');
  });

  it('returns 400 when city query parameter is missing or empty', async () => {
    const req = createMockRequest({ method: 'GET', url: '/api/aqi' });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(400);
    expect(result.json()).toEqual({ error: expect.stringContaining('city') });
  });

  it('returns 500 when OPENWEATHER_API_KEY is not configured without leaking internals', async () => {
    delete process.env['OPENWEATHER_API_KEY'];
    const req = createMockRequest({ method: 'GET', url: '/api/aqi?city=Delhi' });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(500);
    expect(result.json()).toEqual({
      error: 'OpenWeather API key is not configured on the server.',
    });
  });

  it('returns 404 when city is not found in geocoding results', async () => {
    process.env['OPENWEATHER_API_KEY'] = 'test-key';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [], // Empty geocode array
      })
    );

    const req = createMockRequest({ method: 'GET', url: '/api/aqi?city=UnknownCity123' });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(404);
    expect(result.json()).toEqual({ error: expect.stringContaining('not found') });
  });

  it('handles upstream geocoding failure with corresponding status code', async () => {
    process.env['OPENWEATHER_API_KEY'] = 'test-key';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      })
    );

    const req = createMockRequest({ method: 'GET', url: '/api/aqi?city=Delhi' });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(503);
    expect(result.json()).toEqual({ error: expect.stringContaining('Failed to geocode') });
  });

  it('skips geocoding call completely when lat and lon are provided (coordinate bypass)', async () => {
    process.env['OPENWEATHER_API_KEY'] = 'test-key';

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('air_pollution')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            list: [
              {
                dt: 1700000000,
                components: { co: 1.0, no2: 20, o3: 30, so2: 5, pm2_5: 25, pm10: 40 },
              },
            ],
          }),
        });
      }
      throw new Error(`Unexpected call to ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    const req = createMockRequest({
      method: 'GET',
      url: '/api/aqi?city=Delhi&lat=28.6139&lon=77.2090',
    });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(200);
    // Geocoding URL (/geo/1.0/direct) was never called!
    expect(fetchMock).toHaveBeenCalledTimes(2); // Only current + forecast pollution
    expect(
      fetchMock.mock.calls.every(
        (call) => typeof call[0] === 'string' && call[0].includes('air_pollution')
      )
    ).toBe(true);
  });

  it('fetches pollution & forecast in parallel and calculates CPCB AQI correctly', async () => {
    process.env['OPENWEATHER_API_KEY'] = 'test-key';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/geo/1.0/direct')) {
          return Promise.resolve({
            ok: true,
            json: async () => [{ name: 'Delhi', lat: 28.6, lon: 77.2, country: 'IN' }],
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            list: [
              {
                dt: 1700000000,
                components: { co: 2.1, no2: 68.4, o3: 42.1, so2: 18.5, pm2_5: 135.3, pm10: 275.0 },
              },
            ],
          }),
        });
      })
    );

    const req = createMockRequest({ method: 'GET', url: '/api/aqi?city=Delhi' });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(200);
    const data = result.json<{ city: string; aqi: number; pm25: number; pm10: number }>();
    expect(data.city).toBe('Delhi');
    expect(data.aqi).toBe(312); // Delhi PM2.5 135.3 -> AQI 312 Very Poor
    expect(result.headers['cache-control']).toBe(
      'public, s-maxage=300, stale-while-revalidate=600'
    );
  });

  it('returns 502 when OpenWeather returns empty pollution reading', async () => {
    process.env['OPENWEATHER_API_KEY'] = 'test-key';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/geo/1.0/direct')) {
          return Promise.resolve({
            ok: true,
            json: async () => [{ name: 'Delhi', lat: 28.6, lon: 77.2, country: 'IN' }],
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ list: [] }), // Empty list
        });
      })
    );

    const req = createMockRequest({ method: 'GET', url: '/api/aqi?city=Delhi' });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(502);
    expect(result.json()).toEqual({ error: expect.stringContaining('Empty air pollution') });
  });

  it('returns 504 on upstream timeout without leaking API key', async () => {
    process.env['OPENWEATHER_API_KEY'] = 'secret-weather-key-999';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('The operation timed out.', 'TimeoutError'))
    );

    const req = createMockRequest({ method: 'GET', url: '/api/aqi?city=Delhi' });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(504);
    expect(result.json()).toEqual({
      error: 'Upstream pollution provider timed out.',
    });
    expect(result.body).not.toContain('secret-weather-key-999');
  });

  it('sets public stale-while-revalidate Cache-Control header on success', async () => {
    process.env['OPENWEATHER_API_KEY'] = 'test-key';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/geo/1.0/direct')) {
          return Promise.resolve({
            ok: true,
            json: async () => [{ name: 'Mumbai', lat: 19.07, lon: 72.87, country: 'IN' }],
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            list: [
              {
                dt: 1700000000,
                components: { co: 1.0, no2: 15, o3: 20, so2: 5, pm2_5: 35, pm10: 60 },
              },
            ],
          }),
        });
      })
    );

    const req = createMockRequest({ method: 'GET', url: '/api/aqi?city=Mumbai' });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(200);
    expect(result.headers['cache-control']).toBe(
      'public, s-maxage=300, stale-while-revalidate=600'
    );
  });
});
