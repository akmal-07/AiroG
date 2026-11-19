import type { IncomingMessage, ServerResponse } from 'http';

interface PlanApiRequestBody {
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

async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk: Buffer | string) => {
      raw += chunk;
      if (raw.length > 1e6) {
        reject(new Error('Request payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw) as T);
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', (err) => reject(err));
  });
}

/**
 * Serverless API handler: /api/plan
 * Generates personalized daily action plan using Google Gemini.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const sendJson = (statusCode: number, data: unknown): void => {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    });
    res.end(JSON.stringify(data));
  };

  if (req.method !== 'POST') {
    sendJson(405, { error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      sendJson(500, { error: 'Gemini API key is not configured on the server.' });
      return;
    }

    const body = await readJsonBody<PlanApiRequestBody>(req);
    const { city, aqi, pm25, pm10, category, bestWindow, peak, household } = body;

    if (!city || typeof aqi !== 'number' || !household) {
      sendJson(400, { error: 'Invalid request body. Missing required fields.' });
      return;
    }

    const prompt = `You are AiroG, a specialized urban air quality advisor helping an Indian family navigate winter smog.
Generate a tailored daily action plan for:
- City: ${city}
- AQI: ${aqi} (CPCB Category: ${category})
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

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!geminiRes.ok) {
      sendJson(502, { error: 'Failed to communicate with AI provider.' });
      return;
    }

    const geminiData = (await geminiRes.json()) as GeminiResponse;
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      sendJson(502, { error: 'Empty response returned by AI provider.' });
      return;
    }

    const parsed = JSON.parse(text) as { readonly items?: unknown };
    sendJson(200, parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    sendJson(500, { error: message });
  }
}
