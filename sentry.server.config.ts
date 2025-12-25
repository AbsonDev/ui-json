import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // Adjust this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Release tracking
  release: process.env.npm_package_version || '0.1.0',

  // Performance monitoring for server
  integrations: [
    // Prisma integration for database query monitoring
    Sentry.prismaIntegration(),
  ],

  // Filter out sensitive data
  beforeSend(event, hint) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }

    // Remove sensitive query parameters
    if (event.request?.query_string) {
      const sensitiveParams = ['password', 'token', 'api_key', 'secret'];
      sensitiveParams.forEach(param => {
        if (event.request?.query_string?.includes(param)) {
          event.request.query_string = '[REDACTED]';
        }
      });
    }

    return event;
  },

  // Ignore certain errors
  ignoreErrors: [
    // Database connection errors (handled by health check)
    'ECONNREFUSED',
    // Next.js specific errors that are handled
    'NEXT_NOT_FOUND',
  ],
});
