import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  applyCorsHeaders,
  getAllowedOrigins,
  sanitizeQuery,
  getEnv,
  ensureMethod,
  type ApiRequest,
  type ApiResponse,
} from '../_utils.js';

function createMockRequest(options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
}): ApiRequest {
  return {
    method: options.method ?? 'GET',
    url: options.url ?? '/',
    headers: options.headers ?? {},
    on: () => {},
  } as unknown as ApiRequest;
}

function createMockResponse(): {
  res: ApiResponse;
  getResult: () => {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
  };
} {
  const headers: Record<string, string> = {};
  let statusCode = 200;
  let body = '';

  const res = {
    get statusCode() {
      return statusCode;
    },
    set statusCode(code: number) {
      statusCode = code;
    },
    setHeader(name: string, value: string) {
      headers[name.toLowerCase()] = String(value);
      return res;
    },
    getHeader(name: string) {
      return headers[name.toLowerCase()];
    },
    end(chunk?: unknown) {
      if (chunk) {
        body = String(chunk);
      }
      return res;
    },
  } as unknown as ApiResponse;

  return {
    res,
    getResult: () => ({ statusCode, headers, body }),
  };
}

describe('api/_utils CORS & Helper Tests', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('applies default production origin when request origin is undefined', () => {
    const req = createMockRequest({});
    const { res, getResult } = createMockResponse();

    applyCorsHeaders(req, res);
    const result = getResult();

    expect(result.headers['access-control-allow-origin']).toBe('https://airog.vercel.app');
    expect(result.headers['vary']).toBe('Origin');
  });

  it('allows localhost development origin in non-production mode', () => {
    process.env['NODE_ENV'] = 'development';
    const req = createMockRequest({ headers: { origin: 'http://localhost:5173' } });
    const { res, getResult } = createMockResponse();

    applyCorsHeaders(req, res);
    const result = getResult();

    expect(result.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(result.headers['vary']).toBe('Origin');
  });

  it('rejects localhost development origin when running in production mode', () => {
    process.env['NODE_ENV'] = 'production';
    const req = createMockRequest({ headers: { origin: 'http://localhost:5173' } });
    const { res, getResult } = createMockResponse();

    applyCorsHeaders(req, res);
    const result = getResult();

    expect(result.headers['access-control-allow-origin']).toBeUndefined();
    expect(result.headers['vary']).toBe('Origin');
  });

  it('allows exact VERCEL_URL preview deployment origin when configured', () => {
    process.env['VERCEL_URL'] = 'airog-preview-branch.vercel.app';
    const req = createMockRequest({
      headers: { origin: 'https://airog-preview-branch.vercel.app' },
    });
    const { res, getResult } = createMockResponse();

    applyCorsHeaders(req, res);
    const result = getResult();

    expect(result.headers['access-control-allow-origin']).toBe(
      'https://airog-preview-branch.vercel.app'
    );
    expect(result.headers['vary']).toBe('Origin');
  });

  it('rejects untrusted vercel subdomain (attacker.vercel.app) without CORS header', () => {
    process.env['VERCEL_URL'] = 'airog-preview-branch.vercel.app';
    const req = createMockRequest({
      headers: { origin: 'https://attacker.vercel.app' },
    });
    const { res, getResult } = createMockResponse();

    applyCorsHeaders(req, res);
    const result = getResult();

    expect(result.headers['access-control-allow-origin']).toBeUndefined();
    expect(result.headers['vary']).toBe('Origin');
  });

  it('rejects untrusted third-party origins without setting Access-Control-Allow-Origin', () => {
    const req = createMockRequest({ headers: { origin: 'https://malicious-site.com' } });
    const { res, getResult } = createMockResponse();

    applyCorsHeaders(req, res);
    const result = getResult();

    expect(result.headers['access-control-allow-origin']).toBeUndefined();
    expect(result.headers['vary']).toBe('Origin');
  });

  it('getAllowedOrigins handles empty or malformed VERCEL_URL safely', () => {
    delete process.env['VERCEL_URL'];
    process.env['NODE_ENV'] = 'production';
    const origins = getAllowedOrigins();
    expect(origins).toEqual(['https://airog.vercel.app']);
  });

  it('ensureMethod returns 405 for disallowed HTTP methods with Allow header', () => {
    const req = createMockRequest({ method: 'DELETE', url: '/api/aqi' });
    const { res, getResult } = createMockResponse();

    const allowed = ensureMethod(req, res, ['GET', 'POST']);

    expect(allowed).toBe(false);
    const result = getResult();
    expect(result.statusCode).toBe(405);
    expect(result.headers['allow']).toBe('GET, POST');
  });

  it('sanitizeQuery strips disallowed characters and enforces length limit', () => {
    const dangerous = '  <script>Delhi!@#$%^&*()_+</script>  ';
    const sanitized = sanitizeQuery(dangerous, 10);

    expect(sanitized).not.toContain('<');
    expect(sanitized).not.toContain('>');
    expect(sanitized.length).toBeLessThanOrEqual(10);
  });

  it('getEnv returns trimmed value when set or undefined when missing/empty', () => {
    process.env['TEST_NON_EMPTY_KEY'] = '  some-secret-key  ';
    process.env['TEST_EMPTY_KEY'] = '   ';

    expect(getEnv('TEST_NON_EMPTY_KEY')).toBe('some-secret-key');
    expect(getEnv('TEST_EMPTY_KEY')).toBeUndefined();
    expect(getEnv('TEST_NON_EXISTENT_KEY')).toBeUndefined();

    delete process.env['TEST_NON_EMPTY_KEY'];
    delete process.env['TEST_EMPTY_KEY'];
  });
});
