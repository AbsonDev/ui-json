/**
 * System Configuration Manager
 *
 * Provides centralized access to system configuration stored in database.
 * Implements caching for better performance.
 */

import { prisma } from './prisma'
import logger from './logger'

// Configuration cache with TTL
const configCache = new Map<string, { value: any; expiresAt: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Default configuration values
 * These are used as fallback if DB value doesn't exist
 */
const DEFAULT_CONFIG = {
  // Trial settings
  'trial.duration_days': 14,
  'trial.email_schedule': JSON.stringify([1, 4, 8, 11, 14]),

  // AI Execution Limits (for client apps)
  'limits.ai_execution.free': 100,
  'limits.ai_execution.pro': 1000,
  'limits.ai_execution.team': 10000,
  'limits.ai_execution.enterprise': -1, // unlimited

  // AI Request Limits (for editor)
  'limits.ai_request.free': 10,
  'limits.ai_request.pro': 100,
  'limits.ai_request.team': 500,
  'limits.ai_request.enterprise': -1, // unlimited

  // Rate Limiting
  'rate_limit.login': 5,
  'rate_limit.register': 3,
  'rate_limit.api': 60,
  'rate_limit.admin': 10,

  // Feature Flags
  'feature.ai_enabled': true,
  'feature.mobile_builds': true,
  'feature.stripe_enabled': true,
}

type ConfigKey = keyof typeof DEFAULT_CONFIG

/**
 * Get configuration value by key
 * Uses cache if available, falls back to database, then defaults
 */
export async function getConfig<T = any>(key: ConfigKey): Promise<T> {
  // Check cache first
  const cached = configCache.get(key)
  if (cached && Date.now() < cached.expiresAt) {
    return cached.value as T
  }

  try {
    // Fetch from database
    const config = await prisma.systemConfig.findUnique({
      where: { key },
    })

    if (config) {
      // Parse value based on data type
      let parsedValue: any

      switch (config.dataType) {
        case 'NUMBER':
          parsedValue = Number(config.value)
          break
        case 'BOOLEAN':
          parsedValue = config.value === 'true'
          break
        case 'JSON':
          parsedValue = JSON.parse(config.value)
          break
        default:
          parsedValue = config.value
      }

      // Update cache
      configCache.set(key, {
        value: parsedValue,
        expiresAt: Date.now() + CACHE_TTL,
      })

      return parsedValue as T
    }
  } catch (error) {
    logger.error('Failed to fetch config from database', {
      key,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  // Fallback to default
  const defaultValue = DEFAULT_CONFIG[key]

  // Parse JSON strings in defaults
  if (typeof defaultValue === 'string' && defaultValue.startsWith('[')) {
    try {
      return JSON.parse(defaultValue) as T
    } catch {
      return defaultValue as T
    }
  }

  return defaultValue as T
}

/**
 * Set configuration value
 * Updates database and clears cache
 */
export async function setConfig(
  key: ConfigKey,
  value: any,
  description?: string
): Promise<void> {
  // Determine data type
  let dataType: 'STRING' | 'NUMBER' | 'JSON' | 'BOOLEAN' = 'STRING'
  let stringValue: string

  if (typeof value === 'number') {
    dataType = 'NUMBER'
    stringValue = String(value)
  } else if (typeof value === 'boolean') {
    dataType = 'BOOLEAN'
    stringValue = String(value)
  } else if (typeof value === 'object') {
    dataType = 'JSON'
    stringValue = JSON.stringify(value)
  } else {
    stringValue = String(value)
  }

  // Extract category from key (first part before dot)
  const category = key.split('.')[0]

  // Update database
  await prisma.systemConfig.upsert({
    where: { key },
    update: {
      value: stringValue,
      dataType,
      description,
      category,
    },
    create: {
      key,
      value: stringValue,
      dataType,
      description,
      category,
    },
  })

  // Clear cache
  configCache.delete(key)

  logger.info('Configuration updated', { key, value })
}

/**
 * Get all configs by category
 */
export async function getConfigsByCategory(category: string): Promise<Record<string, any>> {
  const configs = await prisma.systemConfig.findMany({
    where: { category },
  })

  const result: Record<string, any> = {}

  for (const config of configs) {
    let parsedValue: any

    switch (config.dataType) {
      case 'NUMBER':
        parsedValue = Number(config.value)
        break
      case 'BOOLEAN':
        parsedValue = config.value === 'true'
        break
      case 'JSON':
        parsedValue = JSON.parse(config.value)
        break
      default:
        parsedValue = config.value
    }

    result[config.key] = parsedValue
  }

  return result
}

/**
 * Clear configuration cache
 * Useful after bulk updates
 */
export function clearConfigCache(): void {
  configCache.clear()
  logger.info('Configuration cache cleared')
}

/**
 * Initialize default configurations
 * Should be called during app startup or migration
 */
export async function initializeDefaultConfigs(): Promise<void> {
  logger.info('Initializing default configurations')

  const descriptions: Record<string, string> = {
    'trial.duration_days': 'Trial period duration in days',
    'trial.email_schedule': 'Days after trial start to send nurture emails (JSON array)',
    'limits.ai_execution.free': 'Monthly AI execution limit for FREE plan',
    'limits.ai_execution.pro': 'Monthly AI execution limit for PRO plan',
    'limits.ai_execution.team': 'Monthly AI execution limit for TEAM plan',
    'limits.ai_execution.enterprise': 'Monthly AI execution limit for ENTERPRISE plan (-1 = unlimited)',
    'limits.ai_request.free': 'Daily AI request limit for FREE plan (editor)',
    'limits.ai_request.pro': 'Daily AI request limit for PRO plan (editor)',
    'limits.ai_request.team': 'Daily AI request limit for TEAM plan (editor)',
    'limits.ai_request.enterprise': 'Daily AI request limit for ENTERPRISE plan (editor)',
    'rate_limit.login': 'Login attempts per minute',
    'rate_limit.register': 'Registration attempts per minute',
    'rate_limit.api': 'API requests per minute',
    'rate_limit.admin': 'Admin API requests per minute',
    'feature.ai_enabled': 'Enable AI features globally',
    'feature.mobile_builds': 'Enable mobile app builds',
    'feature.stripe_enabled': 'Enable Stripe payment processing',
  }

  for (const [key, defaultValue] of Object.entries(DEFAULT_CONFIG)) {
    await setConfig(
      key as ConfigKey,
      defaultValue,
      descriptions[key]
    )
  }

  logger.info('Default configurations initialized')
}
