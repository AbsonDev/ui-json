# 🔖 Freemium Implementation - Quick Reference
**Cheat Sheet para Desenvolvimento**

---

## 📦 Instalação Rápida

```bash
# Instalar dependências
npm install stripe @stripe/stripe-js
npm install --save-dev @types/stripe

# Configurar env
cp .env.example .env.local
# Adicionar:
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_PUBLISHABLE_KEY=pk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...

# Database
npx prisma migrate dev --name add_freemium_models
npm run db:seed
```

---

## 🗄️ Database - Schema Resumido

```prisma
// User (estendido)
model User {
  planTier         PlanTier @default(FREE)
  stripeCustomerId String?  @unique
  subscriptions    Subscription[]
  usageMetrics     UsageMetric[]
  invoices         Invoice[]
}

// Subscription (novo)
model Subscription {
  stripeSubscriptionId String @unique
  planTier             PlanTier
  status               SubscriptionStatus
  currentPeriodEnd     DateTime
  amount               Int
  userId               String
}

// UsageMetric (novo)
model UsageMetric {
  userId       String
  appsCount    Int
  buildsCount  Int
  periodStart  DateTime
  periodEnd    DateTime
}

// PlanConfig (novo)
model PlanConfig {
  planTier     PlanTier @unique
  maxApps      Int      // -1 = unlimited
  maxBuilds    Int
  features     Json
  priceMonthly Int?
}
```

---

## 🎯 Plan Limits - Quick Lookup

```typescript
// FREE
maxApps: 3
maxBuilds: 0
maxExports: 5
features: { removeWatermark: false, analytics: false }

// PRO ($19/mo)
maxApps: -1  // unlimited
maxBuilds: 10
maxExports: -1  // unlimited
features: { removeWatermark: true, analytics: true }

// TEAM ($49/mo)
maxApps: -1
maxBuilds: 50
maxExports: -1
features: {
  removeWatermark: true,
  analytics: true,
  teamCollaboration: true
}
```

---

## 💻 Code Snippets

### Check User Plan
```typescript
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const session = await auth()
const user = await prisma.user.findUnique({
  where: { id: session.user.id }
})

console.log(user.planTier) // FREE | PRO | TEAM
```

### Enforce App Limit
```typescript
import { enforceAppLimit } from '@/lib/subscription/enforcement'

export async function createApp(data) {
  // Check limit before creating
  await enforceAppLimit() // Throws UsageLimitError if exceeded

  // Create app
  const app = await prisma.app.create({ data })
  return app
}
```

### Check Feature Access
```typescript
import { checkFeatureAccess } from '@/lib/subscription/limits'

const hasAnalytics = await checkFeatureAccess(userId, 'analytics')

if (!hasAnalytics) {
  // Show paywall
  return <Paywall feature="Analytics" />
}
```

### Create Checkout Session
```typescript
// Client-side
async function handleUpgrade(priceId: string) {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    body: JSON.stringify({ priceId, planTier: 'PRO' })
  })

  const { url } = await res.json()
  window.location.href = url // Redirect to Stripe
}
```

### Get Usage Metrics
```typescript
import { getUsageMetrics } from '@/actions/subscriptions'

const usage = await getUsageMetrics()
// { apps: 2, builds: 5, exports: 3 }
```

---

## 🔌 API Routes

### Checkout
```
POST /api/checkout
Body: { priceId: string, planTier: 'PRO' | 'TEAM' }
Response: { sessionId: string, url: string }
```

### Billing Portal
```
POST /api/billing-portal
Response: { url: string }
```

### Webhook
```
POST /api/webhooks/stripe
Headers: stripe-signature
Body: Stripe event
```

---

## 🎨 UI Components

### Paywall Modal
```tsx
import { Paywall } from '@/components/Paywall'

<Paywall
  feature="Analytics"
  description="Upgrade to Pro to access analytics dashboard"
  onClose={() => setShowPaywall(false)}
/>
```

### Usage Indicator
```tsx
import { UsageIndicator } from '@/components/UsageIndicator'

<UsageIndicator />
// Shows: "Apps: 2/3" with progress bar
```

### Upgrade Button
```tsx
<Link href="/pricing" className="btn-primary">
  Upgrade to Pro
</Link>
```

---

## 🧪 Testing

### Test Stripe Checkout (Local)
```bash
# Terminal 1: Run app
npm run dev

# Terminal 2: Forward webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 3: Trigger events
stripe trigger checkout.session.completed
```

### Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Auth required: 4000 0025 0000 3155
```

### Test Limits
```typescript
// Create 3 apps as free user
await createApp({ name: 'App 1' })
await createApp({ name: 'App 2' })
await createApp({ name: 'App 3' })

// This should throw UsageLimitError
await createApp({ name: 'App 4' })
// Error: "You have reached your app limit. Upgrade to Pro for unlimited apps."
```

---

## 🔧 Stripe CLI Commands

```bash
# Install
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Listen to webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.paid
stripe trigger invoice.payment_failed

# View logs
stripe logs tail

# Get webhook secret
stripe listen --print-secret
```

---

## 📊 Stripe Dashboard - Quick Links

**Test Mode:**
- Products: https://dashboard.stripe.com/test/products
- Customers: https://dashboard.stripe.com/test/customers
- Subscriptions: https://dashboard.stripe.com/test/subscriptions
- Webhooks: https://dashboard.stripe.com/test/webhooks
- Logs: https://dashboard.stripe.com/test/logs

**Production:**
- Switch to Live mode in top-left corner

---

## 🚨 Common Errors

### Error: "No userId in metadata"
```typescript
// Fix: Add metadata to checkout session
metadata: {
  userId: user.id,
  planTier: 'PRO'
}
```

### Error: "Webhook signature verification failed"
```typescript
// Fix: Check STRIPE_WEBHOOK_SECRET
// Get it from: stripe listen --print-secret
```

### Error: "You have reached your app limit"
```typescript
// Expected! User needs to upgrade
// Show paywall or redirect to /pricing
```

### Error: "Prisma client not initialized"
```typescript
// Fix: Run migrations
npx prisma generate
npx prisma db push
```

---

## 🔍 Debugging

### Check User Subscription
```sql
-- Prisma Studio
npm run db:studio

-- Or SQL
SELECT u.email, u.planTier, s.status, s.currentPeriodEnd
FROM users u
LEFT JOIN subscriptions s ON s.userId = u.id
WHERE u.email = 'test@example.com';
```

### Check Usage Metrics
```sql
SELECT userId, appsCount, buildsCount, periodEnd
FROM usage_metrics
WHERE userId = 'clx...';
```

### Check Invoices
```sql
SELECT i.amount, i.status, i.paidAt, u.email
FROM invoices i
JOIN users u ON u.id = i.userId
ORDER BY i.createdAt DESC
LIMIT 10;
```

### Verify Stripe Sync
```typescript
// Check if Stripe customer exists
const user = await prisma.user.findUnique({
  where: { email: 'test@example.com' }
})

if (user.stripeCustomerId) {
  const customer = await stripe.customers.retrieve(user.stripeCustomerId)
  console.log(customer)
}
```

---

## 📈 Analytics Events

```typescript
// Track in Mixpanel/Amplitude
track('Pricing Page Viewed')
track('Checkout Started', { planTier: 'PRO' })
track('Trial Started', { planTier: 'PRO' })
track('Subscription Created', { amount: 19 })
track('Usage Limit Reached', { limitType: 'apps' })
track('Paywall Shown', { feature: 'analytics' })
track('Upgrade Clicked', { from: 'paywall' })
```

---

## 🎯 Feature Flags

```typescript
// Check if user can access feature
const features = {
  analytics: user.planTier !== 'FREE',
  removeWatermark: user.planTier !== 'FREE',
  teamCollaboration: user.planTier === 'TEAM',
  prioritySupport: user.planTier === 'TEAM',
}

// Usage
{features.analytics && <AnalyticsDashboard />}
```

---

## 🔐 Environment Variables

```bash
# Required
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Optional
STRIPE_PRICE_PRO_MONTHLY="price_..."
STRIPE_PRICE_PRO_YEARLY="price_..."
STRIPE_PRICE_TEAM_MONTHLY="price_..."
STRIPE_PRICE_TEAM_YEARLY="price_..."
```

---

## 📋 Pre-Launch Checklist

**Development:**
- [ ] All migrations run
- [ ] PlanConfig seeded
- [ ] Stripe products created
- [ ] Webhook endpoint configured
- [ ] Tests passing (125+)

**Stripe Setup:**
- [ ] Products created (Pro, Team)
- [ ] Prices set ($19, $199, $49, $499)
- [ ] Webhook configured
- [ ] Customer Portal enabled
- [ ] Payment methods configured

**Code:**
- [ ] Limits enforcement works
- [ ] Webhooks handling all events
- [ ] Pricing page live
- [ ] Paywall components working
- [ ] Billing settings page

**Testing:**
- [ ] Checkout flow (test mode)
- [ ] Subscription creation
- [ ] Plan upgrade
- [ ] Cancellation
- [ ] Webhook processing

**Production:**
- [ ] Environment variables set
- [ ] Stripe in live mode
- [ ] Webhook URL updated
- [ ] Analytics configured
- [ ] Sentry configured

---

## 🆘 Help & Resources

**Documentation:**
- Stripe Docs: https://stripe.com/docs
- Prisma Docs: https://www.prisma.io/docs
- Next.js Docs: https://nextjs.org/docs

**Support:**
- Stripe Support: https://support.stripe.com
- Internal Docs: `/docs/FREEMIUM_TECHNICAL_PLAN.md`

**Tools:**
- Stripe Dashboard: https://dashboard.stripe.com
- Prisma Studio: `npm run db:studio`
- Sentry: https://sentry.io

---

**Última atualização:** 2025-12-25
**Versão:** 1.0
