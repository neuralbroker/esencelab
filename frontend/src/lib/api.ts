/**
 * Shared frontend HTTP client.
 *
 * This module decides the API base URL, adds the auth token to requests,
 * caches selected GET calls, and handles 401 responses in one place.
 *
 * Other frontend files should use this module instead of creating their own
 * fetch logic so auth, caching, and error behavior stay consistent.
 */
import axios from 'axios';
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3001/api';
    }
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

type CacheMatcher = string | RegExp | ((key: string) => boolean);

type CachedGetOptions = {
  params?: Record<string, any>;
  ttlMs?: number;
  forceRefresh?: boolean;
  timeoutMs?: number;
  cacheKey?: string;
};

const DEFAULT_CACHE_TTL_MS = 15_000;
const MAX_CACHE_ENTRIES = 200;
const responseCache = new Map<string, { expiresAt: number; payload: any }>();
const inFlightGetRequests = new Map<string, Promise<any>>();

const getAuthScopeKey = () => {
  if (typeof window === 'undefined') return 'server';
  const user = localStorage.getItem('user') || '';
  const token = localStorage.getItem('token') || '';
  if (user) return `user:${user}`;
  if (token) return `token:${token.slice(-16)}`;
  return 'anon';
};

const serializeParams = (params?: Record<string, any>) => {
  if (!params) return '';
  const pairs = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map((item) => [key, String(item)] as const);
      }
      return [[key, String(value)] as const];
    })
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      if (leftKey === rightKey) return leftValue.localeCompare(rightValue);
      return leftKey.localeCompare(rightKey);
    });
  return new URLSearchParams(pairs as [string, string][]).toString();
};

const createCacheKey = (url: string, params?: Record<string, any>, cacheKey?: string) => {
  if (cacheKey) return cacheKey;
  const serialized = serializeParams(params);
  return `${getAuthScopeKey()}::${url}?${serialized}`;
};

const pruneResponseCache = () => {
  const now = Date.now();
  for (const [key, entry] of Array.from(responseCache.entries())) {
    if (entry.expiresAt <= now) responseCache.delete(key);
  }
  if (responseCache.size <= MAX_CACHE_ENTRIES) return;
  const sorted = Array.from(responseCache.entries()).sort((a, b) => a[1].expiresAt - b[1].expiresAt);
  const overflow = responseCache.size - MAX_CACHE_ENTRIES;
  for (let i = 0; i < overflow; i += 1) {
    responseCache.delete(sorted[i][0]);
  }
};

export const invalidateApiCache = (matcher?: CacheMatcher) => {
  if (!matcher) {
    responseCache.clear();
    inFlightGetRequests.clear();
    return;
  }
  const test = (key: string) => {
    if (typeof matcher === 'string') return key.includes(matcher);
    if (matcher instanceof RegExp) return matcher.test(key);
    return matcher(key);
  };
  for (const key of Array.from(responseCache.keys())) {
    if (test(key)) responseCache.delete(key);
  }
  for (const key of Array.from(inFlightGetRequests.keys())) {
    if (test(key)) inFlightGetRequests.delete(key);
  }
};

export const cachedGet = async <T = any>(
  url: string,
  options: CachedGetOptions = {}
): Promise<T> => {
  const ttlMs = options.ttlMs ?? DEFAULT_CACHE_TTL_MS;
  const key = createCacheKey(url, options.params, options.cacheKey);
  pruneResponseCache();

  if (!options.forceRefresh) {
    const cached = responseCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.payload as T;
    }
  }

  const existingRequest = inFlightGetRequests.get(key);
  if (existingRequest) {
    return existingRequest as Promise<T>;
  }

  const request = api
    .get(url, {
      params: options.params,
      timeout: options.timeoutMs,
    })
    .then((response) => {
      responseCache.set(key, {
        expiresAt: Date.now() + Math.max(500, ttlMs),
        payload: response.data,
      });
      return response.data as T;
    })
    .finally(() => {
      inFlightGetRequests.delete(key);
    });

  inFlightGetRequests.set(key, request);
  return request as Promise<T>;
};

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url || '');
    const isAuthRequest =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/logout');

    if (status === 401 && !isAuthRequest) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        invalidateApiCache();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
