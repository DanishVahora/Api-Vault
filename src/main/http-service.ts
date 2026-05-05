import { request } from 'undici';
import type { ApiRequest, ApiResponse, KeyValuePair } from '../shared/types';

function buildUrl(baseUrl: string, params: KeyValuePair[]): string {
  const enabledParams = params.filter((p) => p.enabled && p.key);
  if (enabledParams.length === 0) return baseUrl;

  const url = new URL(baseUrl);
  enabledParams.forEach((p) => {
    url.searchParams.append(p.key, p.value);
  });
  return url.toString();
}

function buildHeaders(headers: KeyValuePair[]): Record<string, string> {
  const result: Record<string, string> = {};
  headers
    .filter((h) => h.enabled && h.key)
    .forEach((h) => {
      result[h.key] = h.value;
    });
  return result;
}

export async function sendHttpRequest(apiRequest: ApiRequest): Promise<ApiResponse> {
  const startTime = performance.now();

  try {
    const url = buildUrl(apiRequest.url, apiRequest.params);
    const headers = buildHeaders(apiRequest.headers);

    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(apiRequest.method) && apiRequest.bodyType !== 'none') {
      body = apiRequest.body;
      if (apiRequest.bodyType === 'json' && !headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json';
      }
    }

    const response = await request(url, {
      method: apiRequest.method,
      headers,
      body,
    });

    const responseBody = await response.body.text();
    const endTime = performance.now();

    const responseHeaders: Record<string, string> = {};
    const rawHeaders = response.headers;
    for (const [key, value] of Object.entries(rawHeaders)) {
      if (value !== undefined) {
        responseHeaders[key] = Array.isArray(value) ? value.join(', ') : String(value);
      }
    }

    return {
      status: response.statusCode,
      statusText: getStatusText(response.statusCode),
      headers: responseHeaders,
      body: responseBody,
      size: Buffer.byteLength(responseBody, 'utf-8'),
      time: Math.round(endTime - startTime),
    };
  } catch (err: unknown) {
    const endTime = performance.now();
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      status: 0,
      statusText: 'Error',
      headers: {},
      body: '',
      size: 0,
      time: Math.round(endTime - startTime),
      error: errorMessage,
    };
  }
}

function getStatusText(code: number): string {
  const statuses: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    408: 'Request Timeout',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  };
  return statuses[code] || 'Unknown';
}
