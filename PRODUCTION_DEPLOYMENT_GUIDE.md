# 🚀 Production Deployment Guide - Quick Start

**Last Updated:** 2025-12-27  
**Production Ready Score:** 9.2/10

## ✅ Pre-Deployment Checklist

Before deploying to production, complete these steps:

### 1. Environment Validation

```bash
# Validate all required environment variables
npm run validate:env
```

This script checks:
- ✅ All required variables are set
- ✅ Secrets meet minimum length requirements
- ✅ API keys have correct format
- ✅ URLs are properly formatted

### 2. Build Validation

```bash
# Test production build locally
npm run build
```

### 3. Test Suite

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e
```

---

## 🔧 Required Services Setup

### 1. Database (PostgreSQL)

**Recommended:** [Supabase](https://supabase.com) or [Neon](https://neon.tech)

```bash
# Set in environment
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# Run migrations
npm run db:migrate:deploy

# Seed initial data
npm run db:seed

# Initialize system configs
npm run db:init-config
```

### 2. Redis (Upstash) - REQUIRED

**Get your credentials:** [Upstash Console](https://console.upstash.com/)

```bash
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"
```

⚠️ **Critical:** App will not start in production without Redis configured.

### 3. Stripe (Payments)

**Setup:**
1. Switch to Live mode in [Stripe Dashboard](https://dashboard.stripe.com)
2. Get API keys from Developers → API Keys
3. Create webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
4. Create products and get price IDs

```bash
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_PRO_MONTHLY="price_..."
STRIPE_PRICE_PRO_YEARLY="price_..."
STRIPE_PRICE_TEAM_MONTHLY="price_..."
STRIPE_PRICE_TEAM_YEARLY="price_..."
```

### 4. Email (Resend)

**Setup:** [Resend Dashboard](https://resend.com/api-keys)

```bash
RESEND_API_KEY="re_..."
```

### 5. Analytics (Mixpanel)

**Setup:** [Mixpanel Project Settings](https://mixpanel.com)

```bash
NEXT_PUBLIC_MIXPANEL_TOKEN="your-token"
```

### 6. Error Tracking (Sentry) - Optional but Recommended

**Setup:** [Sentry Projects](https://sentry.io)

```bash
SENTRY_DSN="https://...@sentry.io/..."
NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
```

---

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

**Step 1:** Install Vercel CLI

```bash
npm i -g vercel
```

**Step 2:** Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add all required variables.

**Step 3:** Deploy

```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

The `vercel.json` configuration automatically handles:
- ✅ Build command with migrations
- ✅ Security headers
- ✅ Cron jobs
- ✅ Cache optimization
- ✅ Function timeouts

**Step 4:** Post-Deploy Validation

```bash
# Run smoke tests
SMOKE_TEST_URL="https://your-app.vercel.app" npm run smoke:test
```

### Option 2: Docker

**Build:**

```bash
docker build -t ui-json:latest .
```

**Run:**

```bash
docker run -d \
  -p 3000:3000 \
  --env-file .env.production \
  --name ui-json \
  ui-json:latest
```

### Option 3: Manual Server (PM2)

```bash
# Install dependencies
npm ci --legacy-peer-deps

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate:deploy

# Seed database
npm run db:seed

# Initialize configs
npm run db:init-config

# Build
npm run build

# Start with PM2
pm2 start npm --name "ui-json" -- start
pm2 save
pm2 startup
```

---

## 🧪 Testing Your Deployment

### 1. Health Check

```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-12-27T..."
}
```

### 2. Smoke Tests

```bash
SMOKE_TEST_URL="https://your-domain.com" npm run smoke:test
```

Tests:
- ✅ Health endpoint
- ✅ Homepage loads
- ✅ Login page accessible
- ✅ Register page accessible
- ✅ Pricing page loads
- ✅ Dashboard redirects when unauthenticated

### 3. Critical User Flows

Manually test:
- [ ] User registration
- [ ] User login
- [ ] Create app
- [ ] Publish app
- [ ] View published app
- [ ] AI generation
- [ ] Stripe checkout (test mode first!)
- [ ] Subscription management

---

## 📊 Monitoring Setup

### 1. Uptime Monitoring

Use [UptimeRobot](https://uptimerobot.com) or [Better Uptime](https://betteruptime.com):

```
Monitor: https://your-domain.com/healthz
Interval: 5 minutes
```

### 2. Error Tracking

Sentry automatically captures:
- Unhandled exceptions
- Failed API requests
- Client-side errors

Configure alerts in Sentry Dashboard.

### 3. Performance Monitoring

Vercel Analytics (if using Vercel):
- Dashboard → Analytics
- Monitor response times
- Track Core Web Vitals

---

## 🔄 CI/CD Pipeline

The project includes automated GitHub Actions workflows:

### Workflow: CI/CD Pipeline (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main`, `develop`, or `claude/**` branches
- Pull requests to `main` or `develop`

**Jobs:**
1. **Lint & Type Check** - ESLint and TypeScript validation
2. **Unit Tests** - Jest with coverage reporting
3. **E2E Tests** - Playwright browser tests
4. **Build Validation** - Production build test
5. **Security Scan** - npm audit + secret detection
6. **Deploy Staging** - Auto-deploy `develop` branch
7. **Deploy Production** - Auto-deploy `main` branch

**Setup:**

Add these GitHub Secrets:
```
VERCEL_TOKEN - Your Vercel token
```

### Workflow: Mobile Build (`.github/workflows/mobile-build.yml`)

**Triggers:**
- Push to `main` or `develop`
- Changes in mobile-related files

**Outputs:**
- Android AAB (debug/release)
- iOS IPA (commented out, requires macOS)

---

## 🚨 Troubleshooting

### Build Fails on Prisma Generate

**Cause:** Network restrictions or firewall blocking Prisma binaries.

**Solution:**
```bash
# Use local environment variable
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npm install
```

In production (Vercel), this is handled automatically.

### Environment Variable Validation Fails

**Cause:** Missing or incorrectly formatted environment variables.

**Solution:**
```bash
# Run validation script
npm run validate:env

# Fix any reported issues
# Then retry build
npm run build
```

### Rate Limiting Not Working

**Cause:** Redis not configured or unreachable.

**Solution:**
1. Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
2. Test connection in Upstash Console
3. Check Redis health in Upstash Dashboard

### Emails Not Sending

**Cause:** Resend API key invalid or domain not verified.

**Solution:**
1. Verify domain in Resend Dashboard
2. Check API key is active
3. Review email logs: `SELECT * FROM email_logs ORDER BY created_at DESC`

### Stripe Webhooks Failing

**Cause:** Webhook secret mismatch or signature verification failed.

**Solution:**
1. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
2. Check webhook URL is publicly accessible
3. Review webhook logs in Stripe Dashboard

---

## 📈 Post-Launch Checklist

After successful deployment:

### Week 1
- [ ] Monitor error rates in Sentry
- [ ] Check uptime monitoring alerts
- [ ] Verify cron jobs running (trial emails at 10am UTC)
- [ ] Test payment flows with real cards (small amounts)
- [ ] Monitor database performance
- [ ] Check Redis hit rates

### Week 2
- [ ] Review user feedback
- [ ] Analyze conversion funnel (Mixpanel)
- [ ] Check invoice generation
- [ ] Verify subscription renewals
- [ ] Review published apps performance

### Ongoing
- [ ] Weekly database backups verification
- [ ] Monthly security updates (`npm audit`)
- [ ] Quarterly load testing
- [ ] Performance optimization based on metrics

---

## 🆘 Support

### For Deployment Issues

1. Check this guide first
2. Review [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed steps
3. Check [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) for system status
4. Review [MIGRATIONS.md](./MIGRATIONS.md) for database issues

### For Runtime Issues

1. Check Sentry for error details
2. Review application logs
3. Check health endpoint: `/api/health`
4. Verify all external services are operational

### Service Status Pages

- Vercel: https://vercel-status.com
- Upstash: https://status.upstash.com
- Stripe: https://status.stripe.com
- Resend: https://status.resend.com

---

## 📝 Quick Reference

### Useful Commands

```bash
# Validate environment
npm run validate:env

# Run all tests
npm test && npm run test:e2e

# Build for production
npm run build

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production

# Run smoke tests
npm run smoke:test

# Health check
npm run health:check

# Database operations
npm run db:migrate:deploy   # Run migrations
npm run db:seed             # Seed data
npm run db:init-config      # Init system configs
npm run db:migrate:status   # Check migration status
```

### Environment Variable Groups

**Critical (App won't start without these):**
- DATABASE_URL
- NEXTAUTH_SECRET
- ENCRYPTION_KEY
- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN

**Payment (Required for monetization):**
- All STRIPE_* variables
- RESEND_API_KEY
- CRON_SECRET

**Analytics (Recommended):**
- NEXT_PUBLIC_MIXPANEL_TOKEN
- SENTRY_DSN

**Features:**
- GEMINI_API_KEY (AI Assistant)

---

**Ready to deploy?** Follow the steps above and your app will be live! 🚀

For questions or issues, check the troubleshooting section or review the detailed deployment documentation.
