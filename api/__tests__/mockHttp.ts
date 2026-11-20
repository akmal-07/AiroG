import { EventEmitter } from 'events';
import type { ApiRequest, ApiResponse } from '../_utils.js';

export function createMockRequest(options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: unknown;
}): ApiRequest {
  const req = new EventEmitter() as unknown as ApiRequest;
  req.method = options.method ?? 'GET';
  req.url = options.url ?? '/';
  req.headers = options.headers ?? {};

  if (options.body !== undefined) {
    process.nextTick(() => {
      req.emit('data', Buffer.from(JSON.stringify(options.body)));
      req.emit('end');
    });
  } else {
    process.nextTick(() => {
      req.emit('end');
    });
  }

  return req;
}

export interface MockResponseResult {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  json: <T = unknown>() => T;
}

export function createMockResponse(): { res: ApiResponse; getResult: () => MockResponseResult } {
  let statusCode = 200;
  const headers: Record<string, string> = {};
  let body = '';

  const res = {
    get statusCode() {
      return statusCode;
    },
    set statusCode(code: number) {
      statusCode = code;
    },
    setHeader(key: string, value: string) {
      headers[key.toLowerCase()] = String(value);
    },
    getHeader(key: string) {
      return headers[key.toLowerCase()];
    },
    writeHead(code: number, headersObj?: Record<string, string>) {
      statusCode = code;
      if (headersObj) {
        for (const [k, v] of Object.entries(headersObj)) {
          headers[k.toLowerCase()] = String(v);
        }
      }
      return res;
    },
    end(data?: string | Buffer) {
      if (data) {
        body += data.toString();
      }
    },
  } as unknown as ApiResponse;

  const getResult = (): MockResponseResult => ({
    statusCode,
    headers,
    body,
    json: <T = unknown>() => (body ? (JSON.parse(body) as T) : (null as unknown as T)),
  });

  return { res, getResult };
}
