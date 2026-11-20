// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import handler from '../plan.js';
import { createMockRequest, createMockResponse } from './mockHttp.js';

describe('Serverless Handler: /api/plan', () => {
  const originalEnv = process.env;

  const validPlanBody = {
    city: 'Delhi',
    aqi: 312,
    pm25: 135.3,
    pm10: 275.0,
    category: 'Very Poor',
    bestWindow: {
      windowText: '2:00 PM – 4:00 PM',
      averageAqi: 235,
      category: 'Poor',
    },
    peak: {
      hour: '8:00 PM',
      aqi: 368,
    },
    household: {
      adults: 2,
      children: 1,
      elders: 1,
      hasAsthma: true,
      hasPurifier: false,
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('rejects disallowed HTTP methods with 405 and Allow header', async () => {
    const req = createMockRequest({ method: 'GET', url: '/api/plan' });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(405);
    expect(result.headers['allow']).toContain('POST');
    expect(result.json()).toEqual({ error: expect.stringContaining('Method Not Allowed') });
  });

  it('handles OPTIONS preflight with 200 and hardened CORS headers', async () => {
    const req = createMockRequest({ method: 'OPTIONS', url: '/api/plan' });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(200);
    expect(result.headers['access-control-allow-origin']).toBe('https://airog.vercel.app');
    expect(result.headers['vary']).toBe('Origin');
  });

  it('returns 500 when GEMINI_API_KEY is not configured without leaking internals', async () => {
    delete process.env['GEMINI_API_KEY'];
    const req = createMockRequest({ method: 'POST', url: '/api/plan', body: validPlanBody });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(500);
    expect(result.json()).toEqual({
      error: 'Gemini API key is not configured on the server.',
    });
  });

  it('returns 400 when required payload fields are missing', async () => {
    process.env['GEMINI_API_KEY'] = 'test-gemini-key';
    const req = createMockRequest({
      method: 'POST',
      url: '/api/plan',
      body: { city: 'Delhi' }, // missing aqi and household
    });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(400);
    expect(result.json()).toEqual({ error: expect.stringContaining('Missing') });
  });

  it('returns 400 when category is not a recognized CPCB category', async () => {
    process.env['GEMINI_API_KEY'] = 'test-gemini-key';
    const req = createMockRequest({
      method: 'POST',
      url: '/api/plan',
      body: { ...validPlanBody, category: 'Dangerous_Injected_Category' },
    });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(400);
    expect(result.json()).toEqual({ error: expect.stringContaining('Invalid or unrecognized CPCB') });
  });

  it('returns 400 when household, bestWindow, or peak fields are malformed', async () => {
    process.env['GEMINI_API_KEY'] = 'test-gemini-key';

    // Malformed household (negative count or missing required boolean)
    const req1 = createMockRequest({
      method: 'POST',
      url: '/api/plan',
      body: { ...validPlanBody, household: { ...validPlanBody.household, adults: -1 } },
    });
    const { res: res1, getResult: getResult1 } = createMockResponse();
    await handler(req1, res1);
    expect(getResult1().statusCode).toBe(400);
    expect(getResult1().json()).toEqual({ error: expect.stringContaining('Malformed household, bestWindow, or peak') });

    // Malformed bestWindow (empty windowText)
    const req2 = createMockRequest({
      method: 'POST',
      url: '/api/plan',
      body: { ...validPlanBody, bestWindow: { ...validPlanBody.bestWindow, windowText: '   ' } },
    });
    const { res: res2, getResult: getResult2 } = createMockResponse();
    await handler(req2, res2);
    expect(getResult2().statusCode).toBe(400);

    // Malformed peak (null or missing hour)
    const req3 = createMockRequest({
      method: 'POST',
      url: '/api/plan',
      body: { ...validPlanBody, peak: null },
    });
    const { res: res3, getResult: getResult3 } = createMockResponse();
    await handler(req3, res3);
    expect(getResult3().statusCode).toBe(400);
  });

  it('sends thinkingConfig: { thinkingBudget: 0 } to Gemini to eliminate reasoning latency', async () => {
    process.env['GEMINI_API_KEY'] = 'test-gemini-key';

    const captured: { requestBody: { generationConfig?: Record<string, unknown> } | null } = {
      requestBody: null,
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
        if (init?.body) {
          captured.requestBody = JSON.parse(init.body as string) as {
            generationConfig?: Record<string, unknown>;
          };
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        items: [
                          {
                            id: 'item-1',
                            title: 'Shift Errands to Afternoon',
                            detail: 'Complete grocery runs between 2:00 PM – 4:00 PM.',
                            impact: 'Avoids nocturnal smog spike',
                            category: 'routines',
                          },
                        ],
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        });
      })
    );

    const req = createMockRequest({ method: 'POST', url: '/api/plan', body: validPlanBody });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(200);
    expect(captured.requestBody).not.toBeNull();
    expect(captured.requestBody?.generationConfig).toEqual({
      temperature: 0.2,
      responseMimeType: 'application/json',
      thinkingConfig: {
        thinkingBudget: 0,
      },
    });
  });

  it('returns structured JSON items and no-store Cache-Control on success', async () => {
    process.env['GEMINI_API_KEY'] = 'test-gemini-key';

    const mockItems = [
      {
        id: 'item-1',
        title: 'Run Errands in Cleanest Window',
        detail: 'Step out only between 2:00 PM – 4:00 PM.',
        impact: 'Avoids peak particulate load',
        category: 'routines',
      },
    ];

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify({ items: mockItems }) }],
              },
            },
          ],
        }),
      })
    );

    const req = createMockRequest({ method: 'POST', url: '/api/plan', body: validPlanBody });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(200);
    expect(result.json()).toEqual({ items: mockItems });
    expect(result.headers['cache-control']).toBe('no-store');
  });

  it('returns 502 when Gemini endpoint returns an error status', async () => {
    process.env['GEMINI_API_KEY'] = 'test-gemini-key';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
      })
    );

    const req = createMockRequest({ method: 'POST', url: '/api/plan', body: validPlanBody });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(502);
    expect(result.json()).toEqual({ error: 'Failed to communicate with AI provider.' });
  });

  it('returns 502 when Gemini returns empty candidate parts', async () => {
    process.env['GEMINI_API_KEY'] = 'test-gemini-key';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [], // No candidates
        }),
      })
    );

    const req = createMockRequest({ method: 'POST', url: '/api/plan', body: validPlanBody });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(502);
    expect(result.json()).toEqual({ error: 'Empty response returned by AI provider.' });
  });

  it('returns 504 on Gemini timeout without exposing secrets', async () => {
    process.env['GEMINI_API_KEY'] = 'secret-gemini-key-12345';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('The operation timed out.', 'TimeoutError'))
    );

    const req = createMockRequest({ method: 'POST', url: '/api/plan', body: validPlanBody });
    const { res, getResult } = createMockResponse();

    await handler(req, res);
    const result = getResult();

    expect(result.statusCode).toBe(504);
    expect(result.json()).toEqual({ error: 'AI provider response timed out.' });
    expect(result.body).not.toContain('secret-gemini-key-12345');
  });
});
