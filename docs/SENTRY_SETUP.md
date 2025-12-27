# Sentry Error Tracking Setup

This guide explains how to set up Sentry for error tracking and performance monitoring in the UI-JSON Visualizer.

## What is Sentry?

Sentry is a real-time error tracking platform that helps you:
- Monitor errors and exceptions in production
- Track performance issues
- Get detailed error reports with stack traces
- Set up alerts for critical errors
- View user sessions with Session Replay

## Setup Instructions

### 1. Create a Sentry Account

1. Go to [https://sentry.io](https://sentry.io)
2. Sign up for a free account
3. Create a new project and select "Next.js" as the platform

### 2. Get Your DSN

After creating your project, Sentry will provide you with a DSN (Data Source Name). It looks like:

```
https://[key]@[organization].ingest.sentry.io/[project-id]
```

### 3. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Sentry Error Tracking
SENTRY_DSN="your-sentry-dsn-here"
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn-here"
SENTRY_ORG="your-sentry-org"
SENTRY_PROJECT="your-sentry-project"

# Optional: For uploading source maps
SENTRY_AUTH_TOKEN="your-sentry-auth-token"
```

**Note:** The same DSN is used for both server and client.

### 4. Generate Auth Token (Optional)

To enable source map uploading for better error debugging:

1. Go to Settings > Auth Tokens in Sentry
2. Create a new token with `project:releases` scope
3. Add it to your `.env.local` as `SENTRY_AUTH_TOKEN`

## Features Enabled

### Error Tracking
- **Client-side errors**: JavaScript errors in the browser
- **Server-side errors**: API errors, server action errors
- **Edge runtime errors**: Middleware and edge function errors

### Performance Monitoring
- **Transaction tracking**: API endpoint response times
- **Database query monitoring**: Prisma query performance
- **Web vitals**: Core Web Vitals tracking

### Session Replay
- **Error replays**: Automatic replay for all error sessions
- **Sample replays**: 10% of normal sessions
- **Privacy**: All text masked, media blocked

### Data Privacy
- Sensitive headers removed (authorization, cookie)
- Query parameters sanitized (password, token, api_key, secret)
- User data anonymized

## Configuration Details

### Sampling Rates

**Development:**
- Traces: 100% (all transactions tracked)
- Error Replays: 100%
- Session Replays: 10%

**Production:**
- Traces: 10% (to reduce costs)
- Error Replays: 100%
- Session Replays: 10%

### Ignored Errors

The following errors are automatically filtered:
- Browser extension errors
- Network errors (handled by application)
- ResizeObserver errors (benign)
- 404 errors
- Database connection errors (monitored by health check)

### CSP Configuration

The Content Security Policy has been updated to allow Sentry:
```
connect-src 'self' https://generativelanguage.googleapis.com https://*.sentry.io
```

## Testing Your Setup

### 1. Test Client-Side Error

Add a button to any page:

```tsx
<button onClick={() => { throw new Error('Test Sentry Client Error'); }}>
  Test Sentry
</button>
```

### 2. Test Server-Side Error

Create a test API route:

```typescript
// app/api/sentry-test/route.ts
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  try {
    throw new Error('Test Sentry Server Error');
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}
```

### 3. Check Sentry Dashboard

1. Trigger the errors
2. Go to your Sentry project dashboard
3. You should see the errors appear within seconds

## Advanced Usage

### Manual Error Capture

```typescript
import * as Sentry from '@sentry/nextjs';

try {
  // risky operation
} catch (error) {
  Sentry.captureException(error, {
    level: 'error',
    tags: {
      component: 'AppEditor',
      action: 'save',
    },
    extra: {
      appId: '123',
      userId: 'user-456',
    },
  });
}
```

### Performance Monitoring

```typescript
import * as Sentry from '@sentry/nextjs';

const transaction = Sentry.startTransaction({
  op: 'task',
  name: 'Process Large App',
});

try {
  // your code here
} finally {
  transaction.finish();
}
```

### User Context

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});
```

### Breadcrumbs

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.addBreadcrumb({
  category: 'app',
  message: 'User opened app editor',
  level: 'info',
  data: {
    appId: '123',
  },
});
```

## Integration with Prisma

The server configuration includes Prisma integration for database query monitoring:

```typescript
integrations: [
  Sentry.prismaIntegration(),
],
```

This provides:
- Slow query detection
- Query error tracking
- Database connection monitoring

## Alerts

Set up alerts in Sentry:

1. Go to Alerts > Create Alert
2. Choose conditions (e.g., "When an error occurs more than 10 times in 1 hour")
3. Set up notifications (email, Slack, PagerDuty, etc.)

## Performance Budgets

Consider setting up performance budgets:

1. Go to Performance > Settings
2. Set thresholds for:
   - API response time (e.g., < 500ms)
   - Database queries (e.g., < 100ms)
   - Page load time (e.g., < 2s)

## Cost Management

Sentry offers a free tier with:
- 5,000 errors per month
- 10,000 performance units per month
- 500 session replays per month

To manage costs in production:
- Adjust `tracesSampleRate` (currently 10%)
- Adjust `replaysSessionSampleRate` (currently 10%)
- Use `beforeSend` to filter unnecessary errors
- Set up quotas in Sentry dashboard

## Troubleshooting

### Errors Not Appearing

1. Check DSN is correct
2. Verify environment variables are set
3. Check CSP allows Sentry domain
4. Look for console errors about Sentry

### Too Many Errors

1. Use `ignoreErrors` config
2. Filter with `beforeSend`
3. Set up rate limiting in Sentry dashboard

### Source Maps Not Working

1. Verify `SENTRY_AUTH_TOKEN` is set
2. Check build logs for source map upload
3. Ensure `org` and `project` are correct

## Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Dashboard](https://sentry.io)
- [Sentry Status](https://status.sentry.io)

## Security Considerations

- Never commit `.env.local` with real tokens
- Rotate auth tokens periodically
- Use different projects for dev/staging/production
- Review what data is being sent to Sentry
- Be aware of GDPR/privacy implications
