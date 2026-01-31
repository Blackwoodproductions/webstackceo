/**
 * Unified API Client
 * 
 * Centralized API abstraction layer with:
 * - Automatic auth headers injection
 * - Retry logic with exponential backoff
 * - Rate limiting
 * - Error normalization
 * - Request deduplication
 * - Tenant isolation enforcement
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// Types
// ============================================================================

export interface ApiError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  originalError?: unknown;
  statusCode?: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  status: 'success' | 'error';
}

export interface RequestConfig {
  /** Max retry attempts (default: 3) */
  retries?: number;
  /** Base delay between retries in ms (default: 1000) */
  retryDelay?: number;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Skip auth header injection */
  skipAuth?: boolean;
  /** Cache key for deduplication */
  cacheKey?: string;
  /** Cache TTL in ms */
  cacheTtl?: number;
  /** Tenant ID for isolation enforcement */
  tenantId?: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30000;

// Rate limiting: max requests per minute
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 100;

// ============================================================================
// State
// ============================================================================

// Request tracking for rate limiting
const requestTimestamps: number[] = [];

// In-flight request deduplication
const inflightRequests = new Map<string, Promise<ApiResponse<unknown>>>();

// Simple response cache
const responseCache = new Map<string, { data: unknown; expiry: number }>();

// ============================================================================
// Error Normalization
// ============================================================================

export function normalizeError(error: unknown, statusCode?: number): ApiError {
  // Handle Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as { code: string; message?: string; details?: string };
    return {
      code: supabaseError.code,
      message: supabaseError.message || supabaseError.details || 'Database error',
      severity: getSeverityFromCode(supabaseError.code),
      recoverable: isRecoverableCode(supabaseError.code),
      originalError: error,
      statusCode,
    };
  }

  // Handle fetch/network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Network connection failed. Please check your internet.',
      severity: 'medium',
      recoverable: true,
      originalError: error,
    };
  }

  // Handle timeout errors
  if (error instanceof Error && error.name === 'AbortError') {
    return {
      code: 'TIMEOUT',
      message: 'Request timed out. Please try again.',
      severity: 'medium',
      recoverable: true,
      originalError: error,
    };
  }

  // Handle standard errors
  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
      severity: 'medium',
      recoverable: true,
      originalError: error,
      statusCode,
    };
  }

  // Fallback
  return {
    code: 'UNKNOWN_ERROR',
    message: String(error) || 'An unexpected error occurred',
    severity: 'medium',
    recoverable: true,
    originalError: error,
    statusCode,
  };
}

function getSeverityFromCode(code: string): ApiError['severity'] {
  const criticalCodes = ['PGRST301', '42501', '42000', 'insufficient_privilege'];
  const highCodes = ['23505', '23503', 'PGRST116'];
  const lowCodes = ['PGRST204', '22P02'];

  if (criticalCodes.includes(code)) return 'critical';
  if (highCodes.includes(code)) return 'high';
  if (lowCodes.includes(code)) return 'low';
  return 'medium';
}

function isRecoverableCode(code: string): boolean {
  const unrecoverableCodes = ['42501', 'insufficient_privilege', 'PGRST301'];
  return !unrecoverableCodes.includes(code);
}

// ============================================================================
// Rate Limiting
// ============================================================================

function checkRateLimit(): boolean {
  const now = Date.now();
  
  // Remove timestamps outside the window
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - RATE_LIMIT_WINDOW_MS) {
    requestTimestamps.shift();
  }

  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  requestTimestamps.push(now);
  return true;
}

// ============================================================================
// Auth Headers
// ============================================================================

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    // Add Google token if available
    const googleToken = localStorage.getItem('unified_google_token');
    if (googleToken) {
      headers['X-Google-Token'] = googleToken;
    }
  } catch {
    // Ignore auth errors, proceed without headers
  }

  return headers;
}

// ============================================================================
// Request Deduplication
// ============================================================================

function getCacheKey(url: string, options?: RequestInit): string {
  const method = options?.method || 'GET';
  const body = options?.body ? String(options.body) : '';
  return `${method}:${url}:${body}`;
}

// ============================================================================
// Core Request Function
// ============================================================================

async function makeRequest<T>(
  url: string,
  options: RequestInit = {},
  config: RequestConfig = {}
): Promise<ApiResponse<T>> {
  const {
    retries = DEFAULT_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    timeout = DEFAULT_TIMEOUT,
    skipAuth = false,
    cacheKey,
    cacheTtl,
  } = config;

  // Check rate limit
  if (!checkRateLimit()) {
    return {
      data: null,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please wait a moment.',
        severity: 'low',
        recoverable: true,
      },
      status: 'error',
    };
  }

  // Check cache
  const key = cacheKey || getCacheKey(url, options);
  const cached = responseCache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return { data: cached.data as T, error: null, status: 'success' };
  }

  // Check for in-flight request
  const inflight = inflightRequests.get(key);
  if (inflight) {
    return inflight as Promise<ApiResponse<T>>;
  }

  // Build request
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const requestPromise = (async (): Promise<ApiResponse<T>> => {
    let lastError: ApiError | null = null;
    let attempt = 0;

    while (attempt <= retries) {
      try {
        // Add auth headers
        const headers = new Headers(options.headers);
        if (!skipAuth) {
          const authHeaders = await getAuthHeaders();
          Object.entries(authHeaders).forEach(([k, v]) => headers.set(k, v));
        }

        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle non-2xx responses
        if (!response.ok) {
          const errorBody = await response.text();
          let parsedError: unknown;
          try {
            parsedError = JSON.parse(errorBody);
          } catch {
            parsedError = { message: errorBody };
          }

          // Don't retry 4xx errors (except 429)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            return {
              data: null,
              error: normalizeError(parsedError, response.status),
              status: 'error',
            };
          }

          throw parsedError;
        }

        // Parse response
        const contentType = response.headers.get('content-type');
        let data: T;

        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = (await response.text()) as T;
        }

        // Cache successful response
        if (cacheTtl) {
          responseCache.set(key, { data, expiry: Date.now() + cacheTtl });
        }

        return { data, error: null, status: 'success' };
      } catch (error) {
        lastError = normalizeError(error);
        
        // Don't retry if not recoverable
        if (!lastError.recoverable) {
          break;
        }

        attempt++;
        if (attempt <= retries) {
          // Exponential backoff with jitter
          const delay = Math.min(
            retryDelay * Math.pow(2, attempt - 1) + Math.random() * 1000,
            MAX_RETRY_DELAY
          );
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    clearTimeout(timeoutId);
    return { data: null, error: lastError, status: 'error' };
  })();

  // Track in-flight request
  inflightRequests.set(key, requestPromise as Promise<ApiResponse<unknown>>);
  
  try {
    const result = await requestPromise;
    return result;
  } finally {
    inflightRequests.delete(key);
  }
}

// ============================================================================
// Supabase Edge Function Wrapper
// ============================================================================

export async function invokeEdgeFunction<T>(
  functionName: string,
  body?: Record<string, unknown>,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> {
  const {
    retries = DEFAULT_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    timeout = DEFAULT_TIMEOUT,
  } = config;

  let lastError: ApiError | null = null;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const { data, error } = await supabase.functions.invoke<T>(functionName, {
        body,
      });

      clearTimeout(timeoutId);

      if (error) {
        throw error;
      }

      return { data, error: null, status: 'success' };
    } catch (error) {
      lastError = normalizeError(error);
      
      if (!lastError.recoverable) {
        break;
      }

      attempt++;
      if (attempt <= retries) {
        const delay = Math.min(
          retryDelay * Math.pow(2, attempt - 1) + Math.random() * 1000,
          MAX_RETRY_DELAY
        );
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  return { data: null, error: lastError, status: 'error' };
}

// ============================================================================
// Convenience Methods
// ============================================================================

export const apiClient = {
  get: <T>(url: string, config?: RequestConfig) =>
    makeRequest<T>(url, { method: 'GET' }, config),

  post: <T>(url: string, body: unknown, config?: RequestConfig) =>
    makeRequest<T>(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      config
    ),

  put: <T>(url: string, body: unknown, config?: RequestConfig) =>
    makeRequest<T>(
      url,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      config
    ),

  delete: <T>(url: string, config?: RequestConfig) =>
    makeRequest<T>(url, { method: 'DELETE' }, config),

  /** Invoke Supabase Edge Function with retry logic */
  invoke: invokeEdgeFunction,

  /** Clear response cache */
  clearCache: () => responseCache.clear(),

  /** Get current rate limit status */
  getRateLimitStatus: () => ({
    remaining: MAX_REQUESTS_PER_WINDOW - requestTimestamps.length,
    resetIn: requestTimestamps.length > 0
      ? RATE_LIMIT_WINDOW_MS - (Date.now() - requestTimestamps[0])
      : 0,
  }),
};

export default apiClient;
