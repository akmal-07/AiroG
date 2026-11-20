import {
  type ApiRequest,
  type ApiResponse,
  ensureMethod,
  sendJson,
  sendError,
  getEnv,
  readJsonBody,
  fetchWithTimeout,
  sanitizeQuery,
  TIMEOUT_PLAN_MS,
} from './_utils.js';

const VALID_CPCB_CATEGORIES = new Set([
  'Good',
  'Satisfactory',
  'Moderate',
  'Poor',
  'Very Poor',
  'Severe',
]);

export interface PlanApiRequestBody {
  readonly city: string;
  readonly aqi: number;
  readonly pm25?: number;
  readonly pm10?: number;
  readonly category: string;
  readonly bestWindow: {
    readonly windowText: string;
    readonly averageAqi: number;
    readonly category: string;
  };
  readonly peak: {
    readonly hour: string;
    readonly aqi: number;
  };
  readonly household: {
    readonly adults: number;
    readonly children: number;
    readonly elders: number;
    readonly hasAsthma: boolean;
    readonly hasPurifier: boolean;
  };
}

interface GeminiCandidate {
  readonly content?: {
    readonly parts?: readonly { readonly text?: string }[];
  };
}

interface GeminiResponse {
  readonly candidates?: readonly GeminiCandidate[];
  readonly error?: {
    readonly message?: string;
  };
}

/**
 * Serverless API handler: /api/plan
 * Generates personalized daily action plan using Google Gemini 2.5 Flash with strict zero-thinking budget.
 */
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (!ensureMethod(req, res, ['POST'])) {
    return;
  }

  try {
    const apiKey = getEnv('GEMINI_API_KEY');
    if (!apiKey) {
      sendError(res, 500, 'Gemini API key is not configured on the server.');
      return;
    }

    const body = await readJsonBody<PlanApiRequestBody>(req);
    const { city, aqi, pm25, pm10, category, bestWindow, peak, household } = body;

    const sanitizedCity = typeof city === 'string' ? sanitizeQuery(city) : '';
    if (!sanitizedCity || typeof aqi !== 'number' || !household) {
      sendError(res, 400, 'Invalid request body. Missing or invalid required fields.');
      return;
    }

    if (!category || typeof category !== 'string' || !VALID_CPCB_CATEGORIES.has(category.trim())) {
      sendError(res, 400, 'Invalid or unrecognized CPCB air quality category.');
      return;
    }

    const cleanCategory = category.trim();

    const prompt = `You are AiroG, a specialized urban air quality advisor helping an Indian family navigate winter smog.
Generate a tailored daily action plan for:
- City: ${sanitizedCity}
- AQI: ${aqi} (CPCB Category: ${cleanCategory})
- PM2.5: ${pm25 ?? 'N/A'} µg/m³, PM10: ${pm10 ?? 'N/A'} µg/m³
- Best Outdoor Window: ${bestWindow?.windowText ?? 'Afternoon'} (Avg AQI: ${bestWindow?.averageAqi ?? 'Moderate'})
- Peak Smog Hour: ${peak?.hour ?? 'Evening'} (Peak AQI: ${peak?.aqi ?? 350})
- Household: ${household.adults} adult(s), ${household.children} child(ren), ${household.elders} elder(s)
- Asthma/Respiratory Sensitivity: ${household.hasAsthma ? 'YES' : 'NO'}
- HEPA Air Purifier: ${household.hasPurifier ? 'YES' : 'NO'}

REQUIREMENTS:
1. Provide exactly 5 to 8 concrete, practical plan items distributed across these 3 categories:
   - "routines" (daily habits, window opening/closing schedule, shifting errands)
   - "indoor hacks" (air purifier usage, wet mopping, cooking ventilation, indoor isolation)
   - "greener alternatives" (commute modes, avoiding open burning, reducing household emissions)
2. CRITICAL: Any outdoor activity (errands, walking, commuting) MUST be scheduled strictly inside the best window: "${bestWindow?.windowText ?? 'early afternoon'}" and the detail MUST explicitly name this window.
3. Protect vulnerable family members (${household.children > 0 ? 'children, ' : ''}${household.elders > 0 ? 'elders, ' : ''}${household.hasAsthma ? 'asthma sufferers' : ''}) by restricting morning/evening outdoor exposure.
4. Detail must be 1-2 actionable, concise sentences in plain words.
5. STRICT NUMBERS RULE: In the "impact" field, provide a short plain-words explanation of what the action changes and why. DO NOT USE ANY NUMBERS OR PERCENTAGES in the impact field. Numbers will be calculated separately by deterministic code.
6. Return ONLY valid JSON in this schema:
{
  "items": [
    {
      "id": "string",
      "title": "string",
      "detail": "string",
      "impact": "string",
      "category": "routines" | "indoor hacks" | "greener alternatives"
    }
  ]
}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

    const geminiRes = await fetchWithTimeout(
      geminiUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
            thinkingConfig: {
              thinkingBudget: 0,
            },
          },
        }),
      },
      TIMEOUT_PLAN_MS
    );

    if (!geminiRes.ok) {
      sendError(res, 502, 'Failed to communicate with AI provider.');
      return;
    }

    const geminiData = (await geminiRes.json()) as GeminiResponse;
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      sendError(res, 502, 'Empty response returned by AI provider.');
      return;
    }

    const parsed = JSON.parse(text) as { readonly items?: unknown };
    sendJson(res, 200, parsed);
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
    const message = isTimeout
      ? 'AI provider response timed out.'
      : err instanceof Error
      ? err.message
      : 'Internal Server Error';
    sendError(res, isTimeout ? 504 : 500, message);
  }
}
