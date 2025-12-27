# Production Deployment Guide

This guide covers deploying UI-JSON to production with proper security, performance, and reliability configurations.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Variables](#environment-variables)
3. [Database Setup](#database-setup)
4. [External Services](#external-services)
5. [Deployment Steps](#deployment-steps)
6. [Post-Deployment](#post-deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Backup & Recovery](#backup--recovery)
9. [Rollback Procedure](#rollback-procedure)

---

## Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] All environment variables are configured (see below)
- [ ] Database migrations are tested
- [ ] Redis (Upstash) is configured for rate limiting
- [ ] Stripe is configured with production keys
- [ ] Sentry is configured for error tracking
- [ ] Email service (Resend) is configured
- [ ] Security secrets are generated and stored securely
- [ ] SSL/TLS certificates are configured
- [ ] Domain DNS is properly configured
- [ ] Backup strategy is in place

---

## Environment Variables

### Required Variables

All required variables must be set in production. The app will fail to start if any are missing.

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# NextAuth (Authentication)
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"

# Encryption (for database credentials)
ENCRYPTION_KEY="<exactly-32-characters>"

# AI (Google Gemini)
GEMINI_API_KEY="your-gemini-api-key"

# Stripe (Payment)
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_PRO_MONTHLY="price_..."
STRIPE_PRICE_PRO_YEARLY="price_..."
STRIPE_PRICE_TEAM_MONTHLY="price_..."
STRIPE_PRICE_TEAM_YEARLY="price_..."

# Email Service (Resend)
RESEND_API_KEY="re_..."

# Cron Job Authentication
CRON_SECRET="<generate-with-openssl-rand-base64-32>"

# Rate Limiting (Upstash Redis) - REQUIRED IN PRODUCTION
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# Analytics (Mixpanel)
NEXT_PUBLIC_MIXPANEL_TOKEN="your-mixpanel-token"

# Error Tracking (Sentry - Optional but Recommended)
SENTRY_DSN="https://...@sentry.io/..."
NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"
SENTRY_AUTH_TOKEN="your-auth-token"

# Node Environment
NODE_ENV="production"
```

### Generating Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate CRON_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY (exactly 32 characters)
openssl rand -base64 32 | cut -c1-32
```

---

## Database Setup

### 1. Provision PostgreSQL Database

**Recommended Providers:**
- Supabase (recommended)
- Neon
- Railway
- AWS RDS
- Render

**Minimum Requirements:**
- PostgreSQL 14+
- 1GB RAM minimum (2GB+ recommended)
- SSL/TLS enabled
- Connection pooling enabled

### 2. Configure Connection String

```bash
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public&sslmode=require&connection_limit=10"
```

**Important:** Always use `sslmode=require` in production.

### 3. Run Database Migrations

**CRITICAL:** Always use `prisma migrate deploy` in production, NOT `db:push`.

```bash
# Apply all pending migrations
npm run db:migrate

# Or manually
npx prisma migrate deploy
```

### 4. Initialize System Configurations

After migrations, initialize default configurations:

```bash
# Run in production environment
npm run db:init-config
```

This seeds the `system_configs` table with default values for:
- Trial duration
- Email schedules
- AI limits
- Rate limits
- Feature flags

### 5. Create Plan Configs

Run the seed script to create plan configurations:

```bash
npm run db:seed
```

---

## External Services

### Upstash Redis (Required)

**Purpose:** Rate limiting and caching

1. Create account at https://console.upstash.com/
2. Create a Redis database (Global or Regional)
3. Copy REST URL and Token
4. Set environment variables:
   ```bash
   UPSTASH_REDIS_REST_URL="https://..."
   UPSTASH_REDIS_REST_TOKEN="..."
   ```

**Note:** Redis is REQUIRED in production. The app will not start without it.

### Stripe (Required for Payments)

1. Create account at https://stripe.com
2. Switch to Live mode
3. Get API keys from Dashboard → Developers → API Keys
4. Create webhook endpoint:
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
5. Copy webhook secret
6. Create products and price IDs in Dashboard

### Resend (Required for Emails)

1. Create account at https://resend.com
2. Verify your domain
3. Get API key from Settings → API Keys
4. Set `RESEND_API_KEY`

### Sentry (Recommended)

1. Create account at https://sentry.io
2. Create project
3. Get DSN from Settings
4. Set Sentry environment variables

### Mixpanel (Required for Analytics)

1. Create account at https://mixpanel.com
2. Create project
3. Get project token
4. Set `NEXT_PUBLIC_MIXPANEL_TOKEN`

---

## Deployment Steps

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   ```bash
   vercel --prod
   ```

2. **Configure Environment Variables**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add all required variables
   - Ensure they're set for "Production"

3. **Configure Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Add Build Hook**
   ```bash
   # Before build, run migrations
   "vercel-build": "prisma generate && prisma migrate deploy && next build"
   ```

5. **Configure Cron Jobs**

   Create `vercel.json`:
   ```json
   {
     "crons": [{
       "path": "/api/cron/trial-emails",
       "schedule": "0 10 * * *"
     }]
   }
   ```

6. **Deploy**
   ```bash
   vercel --prod
   ```

### Option 2: Docker

1. **Build Image**
   ```bash
   docker build -t ui-json:latest .
   ```

2. **Run Container**
   ```bash
   docker run -d \
     -p 3000:3000 \
     --env-file .env.production \
     --name ui-json \
     ui-json:latest
   ```

### Option 3: Node.js Server

1. **Build**
   ```bash
   npm run build
   ```

2. **Start with PM2**
   ```bash
   pm2 start npm --name "ui-json" -- start
   pm2 save
   pm2 startup
   ```

---

## Post-Deployment

### 1. Verify Environment

```bash
# Check if app is running
curl https://your-domain.com/api/health

# Expected response:
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-..."
}
```

### 2. Test Critical Flows

- [ ] User registration
- [ ] User login
- [ ] Create app
- [ ] AI generation
- [ ] Export functionality
- [ ] Stripe checkout (test mode first!)
- [ ] Webhook processing

### 3. Configure DNS

Ensure proper DNS records:
```
A     @      <server-ip>
CNAME www    your-domain.com
```

### 4. SSL/TLS

- Vercel: Automatic
- Custom server: Use Let's Encrypt
  ```bash
  certbot --nginx -d your-domain.com -d www.your-domain.com
  ```

### 5. Setup Monitoring

Configure Sentry alerts for:
- Error rate > 1%
- Response time > 2s
- Database connection failures

---

## Monitoring & Maintenance

### Health Checks

The app provides a health check endpoint:

```bash
GET /api/health
```

Monitor this endpoint with:
- UptimeRobot
- Pingdom
- Better Uptime
- StatusPage

### Logs

**View Logs:**
```bash
# Vercel
vercel logs --prod

# PM2
pm2 logs ui-json

# Docker
docker logs ui-json
```

**Log Locations:**
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- `logs/exceptions.log` - Uncaught exceptions
- `logs/rejections.log` - Unhandled promise rejections

### Performance Monitoring

Monitor these metrics:
- Response times (API routes)
- Database query times
- Cache hit rate
- Memory usage
- CPU usage

### Database Maintenance

**Weekly Tasks:**
```sql
-- Analyze tables for query optimization
ANALYZE;

-- Vacuum to reclaim storage
VACUUM ANALYZE;
```

**Monthly Tasks:**
- Review slow queries
- Check index usage
- Review database size growth
- Archive old logs

---

## Backup & Recovery

### Database Backups

**Automated Backups (Recommended):**

Most managed PostgreSQL providers offer automatic backups:
- Supabase: Daily backups, 7-day retention
- Neon: Point-in-time recovery
- AWS RDS: Automated snapshots

**Manual Backup:**
```bash
# Backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20250101.sql
```

**Backup Schedule:**
- Daily: Full database backup
- Weekly: Archive backup to S3/GCS
- Monthly: Long-term archive

### Configuration Backup

Backup system configurations:
```sql
-- Export system configs
COPY system_configs TO '/tmp/system_configs.csv' CSV HEADER;
```

### Redis Backup

Redis data is non-critical (cache) but Upstash offers:
- Daily snapshots
- Point-in-time recovery

---

## Rollback Procedure

### 1. Application Rollback

**Vercel:**
```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback <deployment-url>
```

**PM2:**
```bash
# Stop current
pm2 stop ui-json

# Checkout previous version
git checkout <previous-commit>

# Rebuild and restart
npm run build
pm2 restart ui-json
```

### 2. Database Rollback

**CRITICAL:** Database rollbacks are complex. Test migrations thoroughly before production.

```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back <migration-name>

# Apply previous migration
npx prisma migrate deploy
```

**Better Approach:** Use database snapshots
```bash
# Restore from snapshot
pg_restore -d $DATABASE_URL snapshot.dump
```

### 3. Verify Rollback

After rollback:
- [ ] Check health endpoint
- [ ] Verify critical flows
- [ ] Check error rates in Sentry
- [ ] Monitor logs for errors

---

## Security Checklist

- [ ] All secrets are rotated from development values
- [ ] SSL/TLS is enforced (no HTTP)
- [ ] CORS is properly configured
- [ ] Rate limiting is active (Redis required)
- [ ] SQL injection protection (Prisma handles this)
- [ ] XSS protection (React handles this)
- [ ] CSRF protection (NextAuth handles this)
- [ ] Security headers are configured
- [ ] Environment variables are never committed to git
- [ ] Database credentials are encrypted (AES-256)
- [ ] Admin routes are protected
- [ ] Stripe webhooks verify signatures
- [ ] Cron jobs require authentication

---

## Troubleshooting

### App Won't Start

1. Check environment variable validation errors:
   ```bash
   npm run build
   ```

2. Verify database connection:
   ```bash
   npx prisma db pull
   ```

3. Check Redis connection:
   ```bash
   curl https://your-redis.upstash.io/ping \
     -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
   ```

### Rate Limiting Not Working

- Ensure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
- Check Redis health in Upstash console
- Verify app is in production mode (`NODE_ENV=production`)

### Emails Not Sending

- Verify Resend API key
- Check domain verification in Resend
- Review email logs in Resend dashboard
- Check `email_logs` table in database

### Stripe Webhooks Failing

- Verify webhook secret matches Stripe dashboard
- Check webhook signature verification
- Review Stripe webhook logs
- Ensure endpoint is publicly accessible

---

## Performance Optimization

### Enable Caching

The app now includes Redis caching for:
- Plan configurations (5 min TTL)
- User subscriptions (5 min TTL)
- AI limits (5 min TTL)

### Database Optimization

```sql
-- Add missing indexes if needed
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_subscriptions_user ON subscriptions(user_id, status);
```

### CDN Configuration

Serve static assets through CDN:
- Images: Vercel Image Optimization
- Scripts: Vercel Edge Network
- Custom: CloudFlare/Fastly

---

## Support

For production issues:
1. Check Sentry for errors
2. Review application logs
3. Check database logs
4. Verify external service status
5. Contact support if needed

**Emergency Contacts:**
- Database: [Provider Support]
- Hosting: [Provider Support]
- Email: support@resend.com
- Payments: support@stripe.com

---

**Last Updated:** 2025-12-27
**Version:** 1.0.0
