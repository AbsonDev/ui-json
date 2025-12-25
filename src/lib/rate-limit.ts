/**
 * Simple in-memory rate limiter for authentication endpoints
 *
 * NOTE: This implementation stores rate limit data in memory.
 * For production with multiple server instances, consider using:
 * - Upstash Rate Limit (recommended)
 * - Redis-based rate limiting
 * - Database-based rate limiting
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60 * 1000)
  }

  /**
   * Check if a request should be rate limited
   * @param identifier - Unique identifier (e.g., IP address or email)
   * @param limit - Maximum number of requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns { success: boolean, remaining: number, resetAt: number }
   */
  check(
    identifier: string,
    limit: number,
    windowMs: number
  ): { success: boolean; remaining: number; resetAt: number } {
    const now = Date.now()
    const entry = this.store.get(identifier)

    // No entry or expired entry
    if (!entry || now > entry.resetAt) {
      const resetAt = now + windowMs
      this.store.set(identifier, {
        count: 1,
        resetAt,
      })

      return {
        success: true,
        remaining: limit - 1,
        resetAt,
      }
    }

    // Entry exists and not expired
    if (entry.count >= limit) {
      return {
        success: false,
        remaining: 0,
        resetAt: entry.resetAt,
      }
    }

    // Increment count
    entry.count++
    this.store.set(identifier, entry)

    return {
      success: true,
      remaining: limit - entry.count,
      resetAt: entry.resetAt,
    }
  }

  /**
   * Reset rate limit for a specific identifier
   * @param identifier - Unique identifier to reset
   */
  reset(identifier: string): void {
    this.store.delete(identifier)
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key)
      }
    }
  }

  /**
   * Get current store size (for monitoring)
   */
  getSize(): number {
    return this.store.size
  }

  /**
   * Clear all rate limit data
   */
  clear(): void {
    this.store.clear()
  }

  /**
   * Destroy the rate limiter and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }
}

// Singleton instance
const rateLimiter = new RateLimiter()

// Predefined rate limiters for common use cases
export const loginRateLimiter = {
  check: (identifier: string) =>
    rateLimiter.check(identifier, 5, 60 * 1000), // 5 requests per minute
  reset: (identifier: string) =>
    rateLimiter.reset(identifier),
}

export const registerRateLimiter = {
  check: (identifier: string) =>
    rateLimiter.check(identifier, 3, 60 * 1000), // 3 requests per minute
  reset: (identifier: string) =>
    rateLimiter.reset(identifier),
}

export const adminRateLimiter = {
  check: (identifier: string) =>
    rateLimiter.check(identifier, 10, 60 * 1000), // 10 requests per minute
  reset: (identifier: string) =>
    rateLimiter.reset(identifier),
}

export const apiRateLimiter = {
  check: (identifier: string) =>
    rateLimiter.check(identifier, 60, 60 * 1000), // 60 requests per minute
  reset: (identifier: string) =>
    rateLimiter.reset(identifier),
}

/**
 * Get client identifier from request
 * Uses IP address or X-Forwarded-For header
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from headers (for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to a generic identifier
  // In production, you might want to use a session ID or user ID
  return 'unknown-client'
}

/**
 * Create a rate limit response
 */
export function createRateLimitResponse(resetAt: number): Response {
  const resetInSeconds = Math.ceil((resetAt - Date.now()) / 1000)

  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`,
      retryAfter: resetInSeconds,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(resetInSeconds),
        'X-RateLimit-Reset': String(Math.floor(resetAt / 1000)),
      },
    }
  )
}

// Export the main rate limiter for custom use cases
export default rateLimiter
