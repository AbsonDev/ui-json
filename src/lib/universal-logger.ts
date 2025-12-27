/**
 * Universal Logger - Works on both client and server
 * Uses console everywhere to avoid winston import issues in client bundles
 */

interface LoggerInterface {
  error: (message: string, ...args: any[]) => void
  warn: (message: string, ...args: any[]) => void
  info: (message: string, ...args: any[]) => void
  http: (message: string, ...args: any[]) => void
  debug: (message: string, ...args: any[]) => void
}

// Simple logger using console - works everywhere
const universalLogger: LoggerInterface = {
  error: (message: string, ...args: any[]) => console.error(message, ...args),
  warn: (message: string, ...args: any[]) => console.warn(message, ...args),
  info: (message: string, ...args: any[]) => console.info(message, ...args),
  http: (message: string, ...args: any[]) => console.log(`[HTTP] ${message}`, ...args),
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(message, ...args)
    }
  },
}

export default universalLogger
