import winston from 'winston'

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

// Define log colors for console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

// Tell winston about our custom colors
winston.addColors(colors)

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development'
  const isDevelopment = env === 'development'
  return isDevelopment ? 'debug' : 'warn'
}

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info

    // Base log message
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      // Remove stack from meta to format it separately
      const { stack, ...otherMeta } = meta

      if (Object.keys(otherMeta).length > 0) {
        log += ` ${JSON.stringify(otherMeta)}`
      }

      if (stack) {
        log += `\n${stack}`
      }
    }

    return log
  })
)

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      format
    ),
  }),

  // Error log file
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format,
  }),

  // Combined log file
  new winston.transports.File({
    filename: 'logs/combined.log',
    format,
  }),
]

// Create logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
})

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new winston.transports.File({ filename: 'logs/exceptions.log' })
)

logger.rejections.handle(
  new winston.transports.File({ filename: 'logs/rejections.log' })
)

// Create a stream object for Morgan HTTP logging integration
export const stream = {
  write: (message: string) => {
    logger.http(message.trim())
  },
}

// Helper functions for common logging patterns
export const logApiRequest = (method: string, path: string, userId?: string) => {
  logger.http(`API Request: ${method} ${path}`, { userId })
}

export const logApiResponse = (method: string, path: string, statusCode: number, duration: number) => {
  logger.http(`API Response: ${method} ${path} - ${statusCode} (${duration}ms)`)
}

export const logDatabaseQuery = (query: string, duration: number) => {
  logger.debug(`Database Query: ${query} (${duration}ms)`)
}

export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error(error.message, {
    error: error.name,
    stack: error.stack,
    ...context,
  })
}

export const logSecurityEvent = (event: string, details: Record<string, any>) => {
  logger.warn(`Security Event: ${event}`, details)
}

export const logUserAction = (action: string, userId: string, details?: Record<string, any>) => {
  logger.info(`User Action: ${action}`, { userId, ...details })
}

export default logger
