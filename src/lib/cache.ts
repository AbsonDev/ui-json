/**
 * Centralized caching layer with Redis (Upstash) support
 *
 * Features:
 * - Automatic fallback to in-memory cache in development
 * - TTL support
 * - Type-safe get/set operations
 * - JSON serialization/deserialization
 */

import logger from './logger'

interface CacheBackend {
  get<T = any>(key: string): Promise<T | null>
  set(key: string, value: any, ttlSeconds?: number): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
}

// ============================================
// In-Memory Cache Backend (Development)
// ============================================
class InMemoryCache implements CacheBackend {
  private cache: Map<string, { value: any; expiresAt: number | null }> = new Map()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60 * 1000)
  }

  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.value as T
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null
    this.cache.set(key, { value, expiresAt })
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async clear(): Promise<void> {
    this.cache.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.cache.clear()
  }
}

// ============================================
// Redis Cache Backend (Production)
// ============================================
class RedisCache implements CacheBackend {
  private baseUrl: string
  private token: string

  constructor(url: string, token: string) {
    this.baseUrl = url
    this.token = token
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const response = await fetch(`${this.baseUrl}/get/${key}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error(`Redis GET failed: ${response.statusText}`)
      }

      const data = await response.json()
      const value = data.result

      if (value === null) return null

      // Try to parse as JSON
      try {
        return JSON.parse(value) as T
      } catch {
        return value as T
      }
    } catch (error) {
      logger.error('Redis cache GET failed', {
        key,
        error: error instanceof Error ? error.message : String(error),
      })
      return null
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      // Serialize value
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value)

      const commands: any[] = [['SET', key, serializedValue]]

      if (ttlSeconds) {
        commands.push(['EXPIRE', key, ttlSeconds])
      }

      const response = await fetch(`${this.baseUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commands),
      })

      if (!response.ok) {
        throw new Error(`Redis SET failed: ${response.statusText}`)
      }
    } catch (error) {
      logger.error('Redis cache SET failed', {
        key,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/del/${key}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      })
    } catch (error) {
      logger.error('Redis cache DELETE failed', {
        key,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  async clear(): Promise<void> {
    logger.warn('Redis FLUSHALL not implemented for safety')
    // Intentionally not implemented to prevent accidental data loss
  }
}

// ============================================
// Cache Factory
// ============================================
function createCache(): CacheBackend {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN
  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction && upstashUrl && upstashToken) {
    logger.info('Using Redis cache (production)')
    return new RedisCache(upstashUrl, upstashToken)
  }

  logger.info('Using in-memory cache (development)')
  return new InMemoryCache()
}

// Singleton instance
const cache = createCache()

// ============================================
// Public API
// ============================================

/**
 * Get value from cache
 */
export async function getCached<T = any>(key: string): Promise<T | null> {
  return cache.get<T>(key)
}

/**
 * Set value in cache with optional TTL
 */
export async function setCached(key: string, value: any, ttlSeconds?: number): Promise<void> {
  return cache.set(key, value, ttlSeconds)
}

/**
 * Delete value from cache
 */
export async function deleteCached(key: string): Promise<void> {
  return cache.delete(key)
}

/**
 * Clear all cache (use with caution)
 */
export async function clearCache(): Promise<void> {
  return cache.clear()
}

/**
 * Cache helper for function results
 * Automatically caches function result with given key and TTL
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 300 // 5 minutes default
): Promise<T> {
  // Check cache first
  const cached = await getCached<T>(key)
  if (cached !== null) {
    return cached
  }

  // Execute function
  const result = await fn()

  // Cache result
  await setCached(key, result, ttlSeconds)

  return result
}

// Cache key builders for common use cases
export const CacheKeys = {
  planConfig: (tier: string) => `plan:${tier}`,
  userPlan: (userId: string) => `user:${userId}:plan`,
  aiLimits: (userId: string, month: string) => `user:${userId}:ai-limits:${month}`,
  appConfig: (appId: string) => `app:${appId}:config`,
  subscription: (userId: string) => `user:${userId}:subscription`,
}

export default cache
