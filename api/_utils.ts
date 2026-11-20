import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Serverless HTTP request interface.
 */
export type ApiRequest = IncomingMessage;

/**
 * Serverless HTTP response interface.
 */
export type ApiResponse = ServerResponse;

/** Request timeout constants in milliseconds */
export const TIMEOUT_SUGGEST_MS = 8_000;
export const TIMEOUT_GEO_MS = 10_000;
export const TIMEOUT_AQI_MS = 15_000;
export const TIMEOUT_PLAN_MS = 18_000;
export const TIMEOUT_DEFAULT_MS = 15_000;

/** Edge cache control header values */
export const CACHE_CONTROL_EDGE = 'public, s-maxage=300, stale-while-revalidate=600';
export const CACHE_CONTROL_NO_STORE = 'no-store';

/** Input validation and payload limits */
export const MAX_QUERY_LENGTH = 60;
export const MAX_PAYLOAD_SIZE = 1_000_000; // 1 MB

/**
 * Resolves the authorized origins for incoming API requests.
 * Allows ONLY:
 * 1. Production canonical domain: 'https://airog.vercel.app'
 * 2. Exact Vercel deployment URL: 'https://${process.env.VERCEL_URL}' (when defined)
 * 3. Localhost development origins ('http://localhost:5173', 'http://localhost:3000') only in non-production.
 */
export function getAllowedOrigins(): string[] {
  const allowed = ['https://airog.vercel.app'];

  const rawVercelUrl = process.env['VERCEL_URL']?.trim();
  if (rawVercelUrl) {
    const origin =
      rawVercelUrl.startsWith('http://') || rawVercelUrl.startsWith('https://')
        ? rawVercelUrl
        : `https://${rawVercelUrl}`;
    if (!allowed.includes(origin)) {
      allowed.push(origin);
    }
  }

  if (process.env['NODE_ENV'] !== 'production') {
    allowed.push('http://localhost:5173', 'http://localhost:3000');
  }

  return allowed;
}

/**
 * Applies security-hardened CORS headers based on request Origin.
 * Always sets 'Vary: Origin' to prevent edge caching confusion.
 * When req.headers.origin is present and NOT in the allowlist,
 * it does NOT echo the origin and does NOT set Access-Control-Allow-Origin.
 */
export function applyCorsHeaders(req: ApiRequest, res: ApiResponse): void {
  res.setHeader('Vary', 'Origin');

  const origin = req.headers?.origin;

  // If no Origin header was sent (e.g. same-origin or server-to-server request)
  if (!origin || typeof origin !== 'string') {
    res.setHeader('Access-Control-Allow-Origin', 'https://airog.vercel.app');
    return;
  }

  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
}

/**
 * Ensures the incoming HTTP request matches one of the allowed methods.
 * Responds with 200 for OPTIONS preflight, or 405 + Allow header if method is disallowed.
 * Returns true if the request method is allowed and execution should continue.
 */
export function ensureMethod(
  req: ApiRequest,
  res: ApiResponse,
  allowed: readonly string[]
): boolean {
  applyCorsHeaders(req, res);
  res.setHeader('Access-Control-Allow-Methods', [...allowed, 'OPTIONS'].join(', '));
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return false;
  }

  if (!req.method || !allowed.includes(req.method)) {
    res.setHeader('Allow', allowed.join(', '));
    sendError(res, 405, `Method Not Allowed. Allowed: ${allowed.join(', ')}`);
    return false;
  }

  return true;
}

/**
 * Sends a structured JSON response with specified status and Cache-Control headers.
 */
export function sendJson(
  res: ApiResponse,
  statusCode: number,
  data: unknown,
  cacheControl: string = CACHE_CONTROL_NO_STORE
): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', cacheControl);
  res.end(JSON.stringify(data));
}

/**
 * Sends an error response in the standardized shape: { error: string }.
 */
export function sendError(
  res: ApiResponse,
  statusCode: number,
  message: string,
  cacheControl: string = CACHE_CONTROL_NO_STORE
): void {
  sendJson(res, statusCode, { error: message }, cacheControl);
}

/**
 * Retrieves and trims an environment variable safely, returning undefined if blank.
 */
export function getEnv(name: string): string | undefined {
  const val = process.env[name]?.trim();
  return val ? val : undefined;
}

/**
 * Sanitizes user search query (alphanumeric, spaces, comma, period, hyphen; trimmed; capped).
 */
export function sanitizeQuery(input: string, maxLength: number = MAX_QUERY_LENGTH): string {
  return input
    .trim()
    .replace(/[^\w\s,.-]/gi, '')
    .slice(0, maxLength);
}

/**
 * Fetches an external URL with an AbortSignal timeout.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = TIMEOUT_DEFAULT_MS
): Promise<Response> {
  const signal = init.signal ?? AbortSignal.timeout(timeoutMs);
  return fetch(url, { ...init, signal });
}

/**
 * Reads and parses a JSON body from an incoming HTTP request stream with size limits.
 */
export async function readJsonBody<T>(
  req: ApiRequest,
  maxBytes: number = MAX_PAYLOAD_SIZE
): Promise<T> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk: Buffer | string) => {
      raw += chunk;
      if (raw.length > maxBytes) {
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
