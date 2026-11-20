// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import handler from '../suggest.js';
import { createMockRequest, createMockResponse } from './mockHttp.js';

describe('Serverless Handler: /api/suggest', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('rejects disallowed HTTP methods with 405 and Allow header', async () => {
    const req = createMockRequest({ method: 'POST', url: '/api/suggest?q=del' });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(405);
    expect(result.headers['allow']).toContain('GET');
    expect(result.json()).toEqual({ error: expect.stringContaining('Method Not Allowed') });
  });

  it('handles OPTIONS preflight with 200 and CORS headers', async () => {
    const req = createMockRequest({ method: 'OPTIONS', url: '/api/suggest' });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(200);
    expect(result.headers['access-control-allow-origin']).toBe('*');
  });

  it('returns empty suggestions for query length under 2 characters', async () => {
    const req = createMockRequest({ method: 'GET', url: '/api/suggest?q=d' });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(200);
    expect(result.json()).toEqual({ suggestions: [] });
    expect(result.headers['cache-control']).toBe(
      'public, s-maxage=300, stale-while-revalidate=600'
    );
  });

  it('sanitizes unsafe characters in user query', async () => {
    delete process.env['OPENWEATHER_API_KEY'];
    const req = createMockRequest({
      method: 'GET',
      url: '/api/suggest?q=Delhi!%40%23%24%25%5E%26*()',
    });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(200);
    const data = result.json<{ suggestions: Array<{ name: string }> }>();
    expect(data.suggestions.length).toBeGreaterThan(0);
    expect(data.suggestions[0]?.name).toBe('Delhi');
  });

  it('falls back to curated Indian locations when OPENWEATHER_API_KEY is not set', async () => {
    delete process.env['OPENWEATHER_API_KEY'];
    const req = createMockRequest({ method: 'GET', url: '/api/suggest?q=tir' });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(200);
    const data = result.json<{ suggestions: Array<{ name: string; country: string }> }>();
    expect(data.suggestions.some((s) => s.name === 'Tirupati')).toBe(true);
    expect(data.suggestions.every((s) => s.country === 'IN')).toBe(true);
  });

  it('queries OpenWeather geocoding and sorts Indian locations first when API key is present', async () => {
    process.env['OPENWEATHER_API_KEY'] = 'test-owm-key-123';

    const mockGeoResponse = [
      { name: 'London', country: 'GB', lat: 51.5, lon: -0.1 },
      { name: 'Delhi', state: 'Delhi', country: 'IN', lat: 28.6, lon: 77.2 },
    ];

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockGeoResponse,
      })
    );

    const req = createMockRequest({ method: 'GET', url: '/api/suggest?q=delhi' });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(200);
    const data = result.json<{ suggestions: Array<{ name: string; country: string }> }>();
    expect(data.suggestions.length).toBe(2);
    expect(data.suggestions[0]?.country).toBe('IN'); // Indian locations sorted first
    expect(data.suggestions[0]?.name).toBe('Delhi');
  });

  it('falls back to curated locations if OpenWeather returns an error status', async () => {
    process.env['OPENWEATHER_API_KEY'] = 'test-owm-key-123';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })
    );

    const req = createMockRequest({ method: 'GET', url: '/api/suggest?q=bengaluru' });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(200);
    const data = result.json<{ suggestions: Array<{ name: string }> }>();
    expect(data.suggestions.some((s) => s.name === 'Bengaluru')).toBe(true);
  });

  it('returns empty suggestions without leaking secrets when upstream fetch times out', async () => {
    process.env['OPENWEATHER_API_KEY'] = 'secret-api-key-999';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('The operation timed out.', 'TimeoutError'))
    );

    const req = createMockRequest({ method: 'GET', url: '/api/suggest?q=mumbai' });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(200);
    expect(result.json()).toEqual({ suggestions: [] });
    expect(result.body).not.toContain('secret-api-key-999');
  });

  it('sets public stale-while-revalidate Cache-Control header on successful response', async () => {
    delete process.env['OPENWEATHER_API_KEY'];
    const req = createMockRequest({ method: 'GET', url: '/api/suggest?q=kolkata' });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(200);
    expect(result.headers['cache-control']).toBe(
      'public, s-maxage=300, stale-while-revalidate=600'
    );
  });
});
