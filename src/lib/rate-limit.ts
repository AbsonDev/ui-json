/**
 * Production-ready rate limiter with multiple backend support
 *
 * Supports:
 * - Upstash Redis (recommended for production with serverless/edge)
 * - In-memory (development only)
 *
 * Environment variables:
 * - UPSTASH_REDIS_REST_URL: Upstash Redis REST URL
 * - UPSTASH_REDIS_REST_TOKEN: Upstash Redis REST token
 * - NODE_ENV: 'development' | 'production'
 */

import logger from './logger'

interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

interface RateLimitBackend {
  check(identifier: string, limit: number, windowMs: number): Promise<RateLimitResult>
  reset(identifier: string): Promise<void>
}

// ============================================
// In-Memory Backend (Development Only)
// ============================================
class InMemoryRateLimiter implements RateLimitBackend {
  private store: Map<string, { count: number; resetAt: number }> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60 * 1000)
  }

  async check(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
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

  async reset(identifier: string): Promise<void> {
    this.store.delete(identifier)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key)
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.store.clear()
  }
}

// ============================================
// Upstash Redis Backend (Production)
// ============================================
class UpstashRateLimiter implements RateLimitBackend {
  private baseUrl: string
  private token: string

  constructor(url: string, token: string) {
    this.baseUrl = url
    this.token = token
  }

  async check(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const key = `ratelimit:${identifier}`
    const now = Date.now()
    const windowSeconds = Math.ceil(windowMs / 1000)

    try {
      // Use Redis pipeline for atomic operations
      const commands = [
        ['INCR', key],
        ['PEXPIRE', key, windowMs],
        ['PTTL', key]
      ]

      const response = await fetch(`${this.baseUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commands),
      })

      if (!response.ok) {
        throw new Error(`Upstash error: ${response.statusText}`)
      }

      const results = await response.json()
      const count = results[0].result as number
      const ttl = results[2].result as number // TTL in milliseconds

      const resetAt = ttl > 0 ? now + ttl : now + windowMs
      const remaining = Math.max(0, limit - count)

      return {
        success: count <= limit,
        remaining,
        resetAt,
      }
    } catch (error) {
      // In production, log the error but fail closed (deny request) for security
      // This prevents rate limit bypass if Redis is temporarily down
      const isProduction = process.env.NODE_ENV === 'production'

      logger.error('Rate limit check failed', {
        error: error instanceof Error ? error.message : String(error),
        identifier,
      })

      if (isProduction) {
        // Fail closed: deny the request to prevent abuse
        return {
          success: false,
          remaining: 0,
          resetAt: now + windowMs,
        }
      } else {
        // Development: fail open (allow request)
        return {
          success: true,
          remaining: limit,
          resetAt: now + windowMs,
        }
      }
    }
  }

  async reset(identifier: string): Promise<void> {
    const key = `ratelimit:${identifier}`

    try {
      await fetch(`${this.baseUrl}/del/${key}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      })
    } catch (error) {
      logger.error('Rate limit reset failed', {
        error: error instanceof Error ? error.message : String(error),
        identifier,
      })
    }
  }
}

// ============================================
// Rate Limiter Factory
// ============================================
function createRateLimiter(): RateLimitBackend {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN
  const isProduction = process.env.NODE_ENV === 'production'

  // CRITICAL: In production, Redis is REQUIRED for proper rate limiting
  if (isProduction) {
    if (!upstashUrl || !upstashToken) {
      throw new Error(
        '❌ PRODUCTION ERROR: Rate limiting requires Redis configuration.\n' +
        'In-memory rate limiting is NOT safe for multi-instance deployments.\n' +
        'Required environment variables:\n' +
        '  - UPSTASH_REDIS_REST_URL\n' +
        '  - UPSTASH_REDIS_REST_TOKEN\n' +
        'Get credentials from: https://console.upstash.com/'
      )
    }

    logger.info('Using Upstash Redis for rate limiting (production)')
    return new UpstashRateLimiter(upstashUrl, upstashToken)
  }

  // Development: in-memory is fine
  logger.info('Using in-memory rate limiter (development)')
  return new InMemoryRateLimiter()
}

// Singleton instance
const rateLimiter = createRateLimiter()

// ============================================
// Public API
// ============================================

/**
 * Login rate limiter: 5 requests per minute
 */
export const loginRateLimiter = {
  check: (identifier: string) =>
    rateLimiter.check(identifier, 5, 60 * 1000),
  reset: (identifier: string) =>
    rateLimiter.reset(identifier),
}

/**
 * Register rate limiter: 3 requests per minute
 */
export const registerRateLimiter = {
  check: (identifier: string) =>
    rateLimiter.check(identifier, 3, 60 * 1000),
  reset: (identifier: string) =>
    rateLimiter.reset(identifier),
}

/**
 * Admin rate limiter: 10 requests per minute
 */
export const adminRateLimiter = {
  check: (identifier: string) =>
    rateLimiter.check(identifier, 10, 60 * 1000),
  reset: (identifier: string) =>
    rateLimiter.reset(identifier),
}

/**
 * API rate limiter: 60 requests per minute
 */
export const apiRateLimiter = {
  check: (identifier: string) =>
    rateLimiter.check(identifier, 60, 60 * 1000),
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
