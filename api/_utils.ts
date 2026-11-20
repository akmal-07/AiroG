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

/** Security allowlist for CORS requests */
export const ALLOWED_ORIGINS: readonly string[] = [
  'https://airog.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

/**
 * Applies security-hardened CORS headers based on request Origin.
 * Matches origin against allowed origins; defaults to 'https://airog.vercel.app'.
 * Always sets 'Vary: Origin' to prevent edge caching confusion.
 */
export function applyCorsHeaders(req: ApiRequest, res: ApiResponse): void {
  const origin = req.headers?.origin;
  const isAllowed =
    typeof origin === 'string' &&
    (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app'));

  res.setHeader('Access-Control-Allow-Origin', isAllowed ? origin : 'https://airog.vercel.app');
  res.setHeader('Vary', 'Origin');
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
 * Sets public edge caching headers with stale-while-revalidate.
 */
export function setCacheHeaders(
  res: ApiResponse,
  cacheControl: string = CACHE_CONTROL_EDGE
): void {
  res.setHeader('Cache-Control', cacheControl);
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
