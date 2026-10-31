export type ApiResult<T> = { success: boolean; message?: string; data?: T; user?: T; token?: string };

export class ApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export function apiBase(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL?.trim() ?? '';
  try {
    const url = new URL(raw);
    const loopback = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
    if ((url.protocol !== 'https:' && !loopback) || url.username || url.password || url.search || url.hash || !url.hostname) {
      throw new Error('Invalid URL');
    }
    return url.href.replace(/\/+$/, '');
  } catch {
    throw new Error('Set EXPO_PUBLIC_API_URL to the HTTPS website URL (or a loopback local development server).');
  }
}

export async function api<T>(path: string, options: RequestInit = {}, token?: string): Promise<ApiResult<T>> {
  if (!/^(?:mobile_api\/(?:auth|content|submissions|profile)\.php|contact\.php|register\.php)(?:\?[a-z_]+=[a-z_]+(?:&[a-z_]+=[a-zA-Z0-9_%.-]+)*)?$/.test(path)) {
    throw new ApiError('Invalid API path.');
  }
  const base = apiBase();
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${base}/${path}`, { ...options, headers, cache: 'no-store' });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Network unavailable. Please check your connection and try again.');
  }
  let payload: ApiResult<T> | null = null;
  try {
    payload = JSON.parse(await response.text()) as ApiResult<T>;
  } catch {
    // The server may send an HTML error page; never expose it to the resident.
  }
  if (!response.ok || !payload || payload.success !== true) {
    throw new ApiError(payload?.message ?? `Request failed (${response.status}).`, response.status);
  }
  return payload;
}