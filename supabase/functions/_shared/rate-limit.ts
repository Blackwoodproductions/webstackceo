/**
 * Shared rate limiting utilities for edge functions
 * Uses in-memory store with IP-based limiting
 */

// Simple in-memory rate limit store (per-isolate)
// Note: In production, consider using Redis or Supabase for distributed rate limiting
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyPrefix?: string;    // Optional prefix for the key
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Check if a request should be rate limited
 */
export function checkRateLimit(
  clientId: string, 
  config: RateLimitConfig
): RateLimitResult {
  const { windowMs, maxRequests, keyPrefix = '' } = config;
  const key = `${keyPrefix}:${clientId}`;
  const now = Date.now();
  
  // Get or create entry
  let entry = rateLimitStore.get(key);
  
  // Reset if window has passed
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    rateLimitStore.set(key, entry);
  }
  
  // Check if over limit
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  
  // Increment and allow
  entry.count++;
  
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Extract client identifier from request (IP or fingerprint)
 */
export function getClientId(req: Request): string {
  // Try to get real IP from various headers
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    // Take the first IP in the chain (original client)
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback to a hash of user agent + accept-language
  const ua = req.headers.get('user-agent') || '';
  const lang = req.headers.get('accept-language') || '';
  return simpleHash(`${ua}:${lang}`);
}

/**
 * Simple string hash for fallback identification
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `hash_${Math.abs(hash).toString(16)}`;
}

/**
 * Apply rate limiting headers to response
 */
export function addRateLimitHeaders(
  headers: Headers, 
  result: RateLimitResult
): void {
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000).toString());
  
  if (!result.allowed && result.retryAfter) {
    headers.set('Retry-After', result.retryAfter.toString());
  }
}

/**
 * Create a rate-limited response
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  const headers = new Headers({
    'Content-Type': 'application/json',
  });
  addRateLimitHeaders(headers, result);
  
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers,
    }
  );
}

// Cleanup old entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt + 60000) { // Keep for 1 minute after expiry
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Run every minute
