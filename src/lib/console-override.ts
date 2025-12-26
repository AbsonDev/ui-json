/**
 * Console Override for Production
 *
 * This module overrides console methods to use Winston logger in production,
 * preventing sensitive information leaks and improving log management.
 *
 * Usage: Import this file early in your application bootstrap.
 */

import logger, { logError, logSecurityEvent } from './logger'

// Store original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
}

/**
 * Override console methods in production
 */
export function overrideConsole() {
  if (process.env.NODE_ENV === 'production') {
    // Override console.log -> logger.info
    console.log = (...args: any[]) => {
      logger.info(args.join(' '))
    }

    // Override console.error -> logger.error
    console.error = (...args: any[]) => {
      if (args[0] instanceof Error) {
        logError(args[0], { context: args.slice(1) })
      } else {
        logger.error(args.join(' '))
      }
    }

    // Override console.warn -> logger.warn
    console.warn = (...args: any[]) => {
      logger.warn(args.join(' '))
    }

    // Override console.info -> logger.info
    console.info = (...args: any[]) => {
      logger.info(args.join(' '))
    }

    // Override console.debug -> logger.debug
    console.debug = (...args: any[]) => {
      logger.debug(args.join(' '))
    }

    logger.info('✅ Console methods overridden to use Winston logger')
  }
}

/**
 * Restore original console methods (useful for testing)
 */
export function restoreConsole() {
  console.log = originalConsole.log
  console.error = originalConsole.error
  console.warn = originalConsole.warn
  console.info = originalConsole.info
  console.debug = originalConsole.debug
}

// Auto-override in production
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  overrideConsole()
}
