// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('fetchAqi 5-Minute Session Cache Lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockSuccessfulApiResponse = {
    city: 'Jaipur',
    aqi: 145,
    pm25: 55,
    pm10: 120,
    forecast: [],
  };

  it('serves repeated requests for the same city inside TTL with only 1 fetch call', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSuccessfulApiResponse,
    });
    vi.stubGlobal('fetch', fetchMock);

    const { fetchAqiData } = await import('../api/fetchAqi');

    const first = await fetchAqiData('Jaipur');
    expect(first.reading.city).toBe('Jaipur');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Fast-forward 2 minutes (120,000ms) - well within 300,000ms TTL
    vi.advanceTimersByTime(120_000);

    const second = await fetchAqiData('jaipur');
    expect(second).toBe(first); // Exact cached reference
    expect(fetchMock).toHaveBeenCalledTimes(1); // No second network call
  });

  it('triggers a fresh network fetch after 300_001ms (cache expiration)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSuccessfulApiResponse,
    });
    vi.stubGlobal('fetch', fetchMock);

    const { fetchAqiData } = await import('../api/fetchAqi');

    await fetchAqiData('Jaipur');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Fast-forward past 5-minute TTL (300,001ms)
    vi.advanceTimersByTime(300_001);

    await fetchAqiData('jaipur');
    expect(fetchMock).toHaveBeenCalledTimes(2); // Fresh fetch triggered!
  });

  it('triggers a separate network fetch for a different city (cache miss)', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      const city = url.includes('Delhi') ? 'Delhi' : 'Pune';
      return Promise.resolve({
        ok: true,
        json: async () => ({
          city,
          aqi: 150,
          pm25: 60,
          pm10: 130,
          forecast: [],
        }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const { fetchAqiData } = await import('../api/fetchAqi');

    await fetchAqiData('Delhi');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await fetchAqiData('Pune');
    expect(fetchMock).toHaveBeenCalledTimes(2); // Miss: different city triggers fetch
  });

  it('does not cache failed or unknown city requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });
    vi.stubGlobal('fetch', fetchMock);

    const { fetchAqiData } = await import('../api/fetchAqi');

    // Attempting an unknown city that fails both API and demo fallback
    await expect(fetchAqiData('UnknownGhostTown999')).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Second attempt should try again and not return a cached failure
    await expect(fetchAqiData('UnknownGhostTown999')).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
