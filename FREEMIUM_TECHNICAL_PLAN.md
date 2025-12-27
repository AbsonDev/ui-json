# 🎯 Plano Técnico - Freemium Implementation
**Tech Leader: Planejamento Arquitetural**
**Data:** 2025-12-25
**Projeto:** UI-JSON Visualizer - Monetization MVP
**Timeline:** 4 semanas
**Complexidade:** Alta

---

## 📋 Executive Summary

Implementação completa de modelo freemium com:
- Stripe integration para pagamentos recorrentes
- Sistema de quotas e usage limits
- Enforcement via middleware e server actions
- UI/UX para pricing, paywall e billing
- Analytics para tracking de conversão
- Testes automatizados end-to-end

**Objetivo:** Gerar primeiros $5k MRR em 60 dias pós-lançamento

---

## 🏗️ Arquitetura Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
├─────────────────────────────────────────────────────────────┤
│  Pricing Page │ Paywall Modals │ Billing Settings │ Usage UI│
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│              Server Actions & API Routes                     │
├─────────────────────────────────────────────────────────────┤
│ subscriptionActions.ts │ checkoutSession │ webhookHandler    │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                  Middleware Layer                            │
├─────────────────────────────────────────────────────────────┤
│  Auth Check │ Usage Limits │ Feature Gating │ Rate Limiting  │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│              Database (PostgreSQL + Prisma)                  │
├─────────────────────────────────────────────────────────────┤
│  User │ Subscription │ UsageMetrics │ Invoice │ PaymentMethod│
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                  External Services                           │
├─────────────────────────────────────────────────────────────┤
│        Stripe API │ Sentry │ Analytics (Mixpanel)           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema Design

### 1. **User Model Extension**

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String
  isAdmin       Boolean   @default(false)

  // 🆕 FREEMIUM FIELDS
  planTier      PlanTier  @default(FREE)
  stripeCustomerId String? @unique

  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  apps               App[]
  subscriptions      Subscription[]
  usageMetrics       UsageMetric[]
  invoices           Invoice[]
  databaseConnections DatabaseConnection[]

  @@index([email])
  @@index([stripeCustomerId])
  @@index([planTier])
  @@index([createdAt])
}

enum PlanTier {
  FREE
  PRO
  TEAM
  ENTERPRISE
}
```

### 2. **Subscription Model** (NEW)

```prisma
model Subscription {
  id                    String   @id @default(cuid())

  // Stripe IDs
  stripeSubscriptionId  String   @unique
  stripePriceId         String
  stripeProductId       String

  // Subscription details
  planTier              PlanTier
  status                SubscriptionStatus

  // Billing cycle
  currentPeriodStart    DateTime
  currentPeriodEnd      DateTime
  cancelAtPeriodEnd     Boolean  @default(false)
  canceledAt            DateTime?

  // Pricing
  amount                Int      // in cents (e.g., 1900 = $19.00)
  currency              String   @default("usd")
  interval              BillingInterval

  // Trial
  trialStart            DateTime?
  trialEnd              DateTime?

  // Metadata
  metadata              Json?

  // User relation
  userId                String
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([userId])
  @@index([stripeSubscriptionId])
  @@index([status])
  @@index([userId, status])
  @@index([currentPeriodEnd])
  @@map("subscriptions")
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  INCOMPLETE
  INCOMPLETE_EXPIRED
  TRIALING
  UNPAID
}

enum BillingInterval {
  MONTH
  YEAR
}
```

### 3. **UsageMetric Model** (NEW)

```prisma
model UsageMetric {
  id          String   @id @default(cuid())

  // User relation
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Metrics tracking
  appsCount           Int      @default(0)
  buildsCount         Int      @default(0)
  exportsCount        Int      @default(0)
  templatesUsedCount  Int      @default(0)
  apiCallsCount       Int      @default(0)
  storageUsedMB       Float    @default(0)

  // Period tracking
  periodStart         DateTime
  periodEnd           DateTime

  // Reset tracking
  resetAt             DateTime?

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([userId])
  @@index([userId, periodEnd])
  @@index([periodEnd])
  @@map("usage_metrics")
}
```

### 4. **Invoice Model** (NEW)

```prisma
model Invoice {
  id                  String   @id @default(cuid())

  // Stripe data
  stripeInvoiceId     String   @unique
  stripePaymentIntentId String?

  // Invoice details
  amount              Int      // in cents
  currency            String   @default("usd")
  status              InvoiceStatus

  // URLs
  hostedInvoiceUrl    String?
  invoicePdf          String?

  // Dates
  periodStart         DateTime
  periodEnd           DateTime
  dueDate             DateTime?
  paidAt              DateTime?

  // User relation
  userId              String
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([userId])
  @@index([stripeInvoiceId])
  @@index([status])
  @@index([userId, createdAt])
  @@map("invoices")
}

enum InvoiceStatus {
  DRAFT
  OPEN
  PAID
  VOID
  UNCOLLECTIBLE
}
```

### 5. **PlanConfig Model** (NEW)

```prisma
model PlanConfig {
  id          String   @id @default(cuid())

  planTier    PlanTier @unique

  // Feature limits
  maxApps             Int      // -1 for unlimited
  maxBuilds           Int      // per month
  maxExports          Int      // per month
  maxTemplates        Int      // -1 for all
  maxApiCalls         Int      // per month
  maxStorageMB        Int

  // Feature flags
  customDomain        Boolean  @default(false)
  prioritySupport     Boolean  @default(false)
  removeWatermark     Boolean  @default(false)
  teamCollaboration   Boolean  @default(false)
  analytics           Boolean  @default(false)
  versionHistory      Boolean  @default(false)
  aiAssistant         Boolean  @default(false)

  // Pricing
  priceMonthly        Int?     // in cents
  priceYearly         Int?     // in cents

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@map("plan_configs")
}
```

---

## 🎯 Plan Tier Definitions

### FREE Plan
```typescript
{
  planTier: 'FREE',
  maxApps: 3,
  maxBuilds: 0,
  maxExports: 5, // JSON only per month
  maxTemplates: 3, // basic templates only
  maxApiCalls: 100, // per month
  maxStorageMB: 100,
  customDomain: false,
  prioritySupport: false,
  removeWatermark: false,
  teamCollaboration: false,
  analytics: false,
  versionHistory: false, // 7 days only
  aiAssistant: true, // limited to 10 requests/day
  priceMonthly: 0,
  priceYearly: 0,
}
```

### PRO Plan ($19/month)
```typescript
{
  planTier: 'PRO',
  maxApps: -1, // unlimited
  maxBuilds: 10, // per month
  maxExports: -1, // unlimited (all formats)
  maxTemplates: -1, // all templates
  maxApiCalls: 10000, // per month
  maxStorageMB: 5000,
  customDomain: true,
  prioritySupport: false,
  removeWatermark: true,
  teamCollaboration: false,
  analytics: true,
  versionHistory: true, // 30 days
  aiAssistant: true, // 100 requests/day
  priceMonthly: 1900, // $19.00
  priceYearly: 19900, // $199.00 (2 months free)
}
```

### TEAM Plan ($49/user/month)
```typescript
{
  planTier: 'TEAM',
  maxApps: -1,
  maxBuilds: 50, // per team per month
  maxExports: -1,
  maxTemplates: -1,
  maxApiCalls: 100000,
  maxStorageMB: 50000,
  customDomain: true,
  prioritySupport: true,
  removeWatermark: true,
  teamCollaboration: true,
  analytics: true,
  versionHistory: true, // 90 days
  aiAssistant: true, // unlimited
  priceMonthly: 4900, // $49.00 per user
  priceYearly: 49900, // $499.00 per user (2 months free)
}
```

---

## 🔧 Implementation Phases

### **WEEK 1: Database & Core Infrastructure**

#### Day 1-2: Database Schema
```bash
# Tasks:
- [ ] Add new models to schema.prisma
- [ ] Create migration script
- [ ] Seed PlanConfig with initial data
- [ ] Run migration on dev database
- [ ] Test rollback scenario
```

**Files to Create/Modify:**
- `prisma/schema.prisma` - Add new models
- `prisma/migrations/` - New migration
- `prisma/seed.ts` - Seed plan configs

**Schema Migration Script:**
```bash
npm run db:generate
npx prisma migrate dev --name add_freemium_models
npm run db:push
```

**Seed Data:**
```typescript
// prisma/seed.ts
const planConfigs = [
  {
    planTier: 'FREE',
    maxApps: 3,
    maxBuilds: 0,
    maxExports: 5,
    // ... rest of config
  },
  // PRO, TEAM, ENTERPRISE configs
]

await prisma.planConfig.createMany({ data: planConfigs })
```

#### Day 3-4: Stripe Setup
```bash
# Tasks:
- [ ] Create Stripe account & get API keys
- [ ] Install Stripe SDK
- [ ] Create products & prices in Stripe dashboard
- [ ] Setup webhook endpoint
- [ ] Configure environment variables
```

**Install Dependencies:**
```bash
npm install stripe @stripe/stripe-js
npm install --save-dev @types/stripe
```

**Environment Variables:**
```env
# .env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Products (from Stripe dashboard)
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_TEAM_MONTHLY=price_...
STRIPE_PRICE_TEAM_YEARLY=price_...
```

**Stripe Product Setup (via Dashboard):**
1. Create Products:
   - "UI-JSON Pro Monthly" - $19/month
   - "UI-JSON Pro Yearly" - $199/year
   - "UI-JSON Team Monthly" - $49/user/month
   - "UI-JSON Team Yearly" - $499/user/year

2. Configure Billing:
   - Enable Customer Portal
   - Set up payment methods (card, bank transfer)
   - Configure tax collection (if needed)
   - Set retry logic for failed payments

#### Day 5-7: Usage Limits System
```bash
# Tasks:
- [ ] Create lib/subscription/limits.ts
- [ ] Create lib/subscription/enforcement.ts
- [ ] Create hooks/useUsageLimits.ts
- [ ] Add middleware checks
- [ ] Write unit tests
```

**Files to Create:**

`src/lib/subscription/limits.ts`:
```typescript
import { PlanTier, User } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export interface PlanLimits {
  maxApps: number
  maxBuilds: number
  maxExports: number
  maxTemplates: number
  maxApiCalls: number
  maxStorageMB: number
  features: {
    customDomain: boolean
    prioritySupport: boolean
    removeWatermark: boolean
    teamCollaboration: boolean
    analytics: boolean
    versionHistory: boolean
    aiAssistant: boolean
  }
}

export async function getPlanLimits(planTier: PlanTier): Promise<PlanLimits> {
  const config = await prisma.planConfig.findUnique({
    where: { planTier }
  })

  if (!config) {
    throw new Error(`Plan config not found for tier: ${planTier}`)
  }

  return {
    maxApps: config.maxApps,
    maxBuilds: config.maxBuilds,
    maxExports: config.maxExports,
    maxTemplates: config.maxTemplates,
    maxApiCalls: config.maxApiCalls,
    maxStorageMB: config.maxStorageMB,
    features: {
      customDomain: config.customDomain,
      prioritySupport: config.prioritySupport,
      removeWatermark: config.removeWatermark,
      teamCollaboration: config.teamCollaboration,
      analytics: config.analytics,
      versionHistory: config.versionHistory,
      aiAssistant: config.aiAssistant,
    }
  }
}

export async function checkAppLimit(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { apps: true }
  })

  if (!user) return false

  const limits = await getPlanLimits(user.planTier)

  // -1 means unlimited
  if (limits.maxApps === -1) return true

  return user.apps.length < limits.maxApps
}

export async function checkBuildLimit(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) return false

  const limits = await getPlanLimits(user.planTier)

  if (limits.maxBuilds === -1) return true

  // Get builds count for current month
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const buildsThisMonth = await prisma.build.count({
    where: {
      app: { userId },
      createdAt: { gte: firstDayOfMonth }
    }
  })

  return buildsThisMonth < limits.maxBuilds
}

export async function checkExportLimit(userId: string): Promise<boolean> {
  // Similar implementation
}

export async function checkFeatureAccess(
  userId: string,
  feature: keyof PlanLimits['features']
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) return false

  const limits = await getPlanLimits(user.planTier)
  return limits.features[feature]
}
```

`src/lib/subscription/enforcement.ts`:
```typescript
import { auth } from '@/lib/auth'
import { checkAppLimit, checkBuildLimit, checkExportLimit, checkFeatureAccess } from './limits'

export class UsageLimitError extends Error {
  constructor(
    message: string,
    public limitType: string,
    public currentUsage: number,
    public limit: number
  ) {
    super(message)
    this.name = 'UsageLimitError'
  }
}

export async function enforceAppLimit() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const canCreate = await checkAppLimit(session.user.id)

  if (!canCreate) {
    throw new UsageLimitError(
      'You have reached your app limit. Upgrade to Pro for unlimited apps.',
      'apps',
      3, // current usage (get from DB)
      3  // limit
    )
  }
}

export async function enforceBuildLimit() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const canBuild = await checkBuildLimit(session.user.id)

  if (!canBuild) {
    throw new UsageLimitError(
      'You have reached your monthly build limit. Upgrade to Pro for more builds.',
      'builds',
      10,
      10
    )
  }
}

export async function enforceFeatureAccess(feature: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const hasAccess = await checkFeatureAccess(session.user.id, feature as any)

  if (!hasAccess) {
    throw new Error(`This feature requires a paid plan. Upgrade to access ${feature}.`)
  }
}
```

---

### **WEEK 2: Stripe Integration & Payments**

#### Day 8-10: Checkout Flow

**Create Stripe Client:**
`src/lib/stripe.ts`:
```typescript
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})
```

**Checkout Session API:**
`src/app/api/checkout/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const checkoutSchema = z.object({
  priceId: z.string(),
  planTier: z.enum(['PRO', 'TEAM', 'ENTERPRISE']),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { priceId, planTier } = checkoutSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        }
      })

      customerId = customer.id

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId }
      })
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        }
      ],
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?checkout=canceled`,
      metadata: {
        userId: user.id,
        planTier,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planTier,
        },
        trial_period_days: 14, // 14-day free trial
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url
    })

  } catch (error) {
    console.error('Checkout error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Customer Portal API:**
`src/app/api/billing-portal/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/dashboard/settings/billing`,
    })

    return NextResponse.json({ url: portalSession.url })

  } catch (error) {
    console.error('Billing portal error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

#### Day 11-14: Webhook Handler

**Webhook Endpoint:**
`src/app/api/webhooks/stripe/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { logError } from '@/lib/logger'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Webhook signature verification failed'))
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    logError(error instanceof Error ? error : new Error('Webhook handler error'))
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId

  if (!userId) {
    throw new Error('No userId in checkout session metadata')
  }

  // Subscription will be handled by subscription.created event
  console.log(`Checkout completed for user ${userId}`)
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  const planTier = subscription.metadata?.planTier as 'PRO' | 'TEAM' | 'ENTERPRISE'

  if (!userId || !planTier) {
    throw new Error('Missing metadata in subscription')
  }

  const status = mapStripeStatus(subscription.status)

  // Upsert subscription
  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      stripeProductId: subscription.items.data[0].price.product as string,
      planTier,
      status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      amount: subscription.items.data[0].price.unit_amount || 0,
      currency: subscription.items.data[0].price.currency,
      interval: subscription.items.data[0].price.recurring?.interval === 'year' ? 'YEAR' : 'MONTH',
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      userId,
    },
    update: {
      status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    }
  })

  // Update user plan tier
  await prisma.user.update({
    where: { id: userId },
    data: { planTier }
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: 'CANCELED' }
  })

  const userId = subscription.metadata?.userId
  if (userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { planTier: 'FREE' }
    })
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const userId = invoice.metadata?.userId || invoice.customer_email

  if (!userId) return

  await prisma.invoice.upsert({
    where: { stripeInvoiceId: invoice.id },
    create: {
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId: invoice.payment_intent as string,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'PAID',
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
      paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
      userId: userId as string,
    },
    update: {
      status: 'PAID',
      paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
    }
  })
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const userId = invoice.metadata?.userId

  if (!userId) return

  await prisma.invoice.update({
    where: { stripeInvoiceId: invoice.id },
    data: { status: 'UNCOLLECTIBLE' }
  })

  // TODO: Send email notification to user
}

function mapStripeStatus(status: Stripe.Subscription.Status): 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'TRIALING' | 'UNPAID' {
  const statusMap: Record<Stripe.Subscription.Status, any> = {
    'active': 'ACTIVE',
    'past_due': 'PAST_DUE',
    'canceled': 'CANCELED',
    'incomplete': 'INCOMPLETE',
    'incomplete_expired': 'INCOMPLETE_EXPIRED',
    'trialing': 'TRIALING',
    'unpaid': 'UNPAID',
    'paused': 'CANCELED',
  }

  return statusMap[status]
}
```

---

### **WEEK 3: Server Actions & Middleware**

#### Day 15-17: Subscription Actions

`src/actions/subscriptions.ts`:
```typescript
'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPlanLimits } from '@/lib/subscription/limits'

export async function getCurrentSubscription() {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ['ACTIVE', 'TRIALING'] }
    },
    orderBy: { createdAt: 'desc' }
  })

  return subscription
}

export async function getUserPlanDetails() {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscriptions: {
        where: { status: { in: ['ACTIVE', 'TRIALING'] } },
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      apps: true,
    }
  })

  if (!user) {
    throw new Error('User not found')
  }

  const limits = await getPlanLimits(user.planTier)

  return {
    planTier: user.planTier,
    limits,
    currentUsage: {
      apps: user.apps.length,
      // TODO: Get other usage metrics
    },
    subscription: user.subscriptions[0] || null
  }
}

export async function getUsageMetrics() {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [appsCount, buildsCount, exportsCount] = await Promise.all([
    prisma.app.count({
      where: { userId: session.user.id }
    }),
    prisma.build.count({
      where: {
        app: { userId: session.user.id },
        createdAt: { gte: firstDayOfMonth }
      }
    }),
    // TODO: Track exports in a separate table
    Promise.resolve(0)
  ])

  return {
    apps: appsCount,
    builds: buildsCount,
    exports: exportsCount,
  }
}
```

#### Day 18-21: Enforcement Middleware

Update `src/middleware.ts`:
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from './lib/auth'
import { prisma } from './lib/prisma'

export async function middleware(request: NextRequest) {
  const session = await auth()

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check if user has active subscription for certain routes
    if (request.nextUrl.pathname.startsWith('/dashboard/analytics')) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          subscriptions: {
            where: { status: { in: ['ACTIVE', 'TRIALING'] } },
            take: 1
          }
        }
      })

      if (!user || user.planTier === 'FREE') {
        return NextResponse.redirect(
          new URL('/pricing?feature=analytics', request.url)
        )
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
  ]
}
```

---

### **WEEK 4: UI Components & Launch**

#### Day 22-24: Pricing Page

`src/app/pricing/page.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'

export default function PricingPage() {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly')

  const plans = [
    {
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      priceId: { monthly: null, yearly: null },
      features: [
        { text: '3 apps', included: true },
        { text: '5 JSON exports/month', included: true },
        { text: 'Basic templates (3)', included: true },
        { text: 'AI Assistant (10/day)', included: true },
        { text: 'Mobile builds', included: false },
        { text: 'All export formats', included: false },
        { text: 'Remove watermark', included: false },
        { text: 'Analytics', included: false },
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Pro',
      price: { monthly: 19, yearly: 199 },
      priceId: {
        monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY,
        yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY,
      },
      features: [
        { text: 'Unlimited apps', included: true },
        { text: 'Unlimited exports', included: true },
        { text: 'All templates', included: true },
        { text: 'AI Assistant (100/day)', included: true },
        { text: '10 mobile builds/month', included: true },
        { text: 'All export formats', included: true },
        { text: 'Remove watermark', included: true },
        { text: 'Analytics dashboard', included: true },
        { text: 'Version history (30 days)', included: true },
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Team',
      price: { monthly: 49, yearly: 499 },
      priceId: {
        monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM_MONTHLY,
        yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM_YEARLY,
      },
      features: [
        { text: 'Everything in Pro', included: true },
        { text: '50 mobile builds/month', included: true },
        { text: 'Team collaboration', included: true },
        { text: 'Real-time co-editing', included: true },
        { text: 'Advanced analytics', included: true },
        { text: 'Priority support', included: true },
        { text: 'Version history (90 days)', included: true },
      ],
      cta: 'Start Free Trial',
      popular: false,
    },
  ]

  async function handleCheckout(priceId: string | null, planTier: string) {
    if (!priceId) return

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, planTier })
      })

      const { url } = await res.json()

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Checkout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Start for free. Scale as you grow.
          </p>

          {/* Interval Toggle */}
          <div className="inline-flex items-center gap-4 bg-white p-1 rounded-lg">
            <button
              onClick={() => setInterval('monthly')}
              className={`px-6 py-2 rounded-md transition ${
                interval === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('yearly')}
              className={`px-6 py-2 rounded-md transition ${
                interval === 'yearly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl p-8 relative ${
                plan.popular
                  ? 'ring-2 ring-blue-600 shadow-xl scale-105'
                  : 'shadow-lg'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              )}

              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>

              <div className="mb-6">
                <span className="text-5xl font-bold">
                  ${plan.price[interval]}
                </span>
                {plan.price[interval] > 0 && (
                  <span className="text-gray-600">
                    /{interval === 'monthly' ? 'mo' : 'yr'}
                  </span>
                )}
              </div>

              <button
                onClick={() => handleCheckout(
                  plan.priceId[interval],
                  plan.name.toUpperCase()
                )}
                className={`w-full py-3 rounded-lg font-medium mb-8 transition ${
                  plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </button>

              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={feature.included ? '' : 'text-gray-400'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

#### Day 25-26: Paywall Components

`src/components/Paywall.tsx`:
```typescript
'use client'

import { X } from 'lucide-react'
import Link from 'next/link'

interface PaywallProps {
  feature: string
  description: string
  onClose?: () => void
}

export function Paywall({ feature, description, onClose }: PaywallProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-8 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>

          <h3 className="text-2xl font-bold mb-2">
            Upgrade to Access {feature}
          </h3>

          <p className="text-gray-600 mb-6">
            {description}
          </p>

          <div className="space-y-3">
            <Link
              href="/pricing"
              className="block w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              View Pricing Plans
            </Link>

            {onClose && (
              <button
                onClick={onClose}
                className="block w-full text-gray-600 hover:text-gray-800"
              >
                Maybe Later
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

`src/components/UsageIndicator.tsx`:
```typescript
'use client'

import { useEffect, useState } from 'react'
import { getUserPlanDetails } from '@/actions/subscriptions'

export function UsageIndicator() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    getUserPlanDetails().then(setData)
  }, [])

  if (!data) return null

  const { limits, currentUsage, planTier } = data

  const appUsagePercent = limits.maxApps === -1
    ? 0
    : (currentUsage.apps / limits.maxApps) * 100

  return (
    <div className="bg-white rounded-lg p-4 border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Apps</span>
        <span className="text-sm text-gray-600">
          {currentUsage.apps} / {limits.maxApps === -1 ? '∞' : limits.maxApps}
        </span>
      </div>

      {limits.maxApps !== -1 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              appUsagePercent >= 90 ? 'bg-red-600' :
              appUsagePercent >= 70 ? 'bg-yellow-600' :
              'bg-green-600'
            }`}
            style={{ width: `${Math.min(appUsagePercent, 100)}%` }}
          />
        </div>
      )}

      {planTier === 'FREE' && appUsagePercent >= 80 && (
        <div className="mt-3 text-xs text-amber-700 bg-amber-50 p-2 rounded">
          ⚠️ You're close to your limit. <a href="/pricing" className="underline">Upgrade to Pro</a>
        </div>
      )}
    </div>
  )
}
```

#### Day 27-28: Testing & Launch Prep

**Testing Checklist:**
```bash
# Unit Tests
- [ ] Limits calculation tests
- [ ] Enforcement logic tests
- [ ] Webhook handler tests
- [ ] Server action tests

# Integration Tests
- [ ] Full checkout flow (test mode)
- [ ] Subscription creation/update
- [ ] Plan upgrade/downgrade
- [ ] Cancellation flow

# Manual Testing
- [ ] Sign up → free plan
- [ ] Create 3 apps (hit limit)
- [ ] Upgrade to Pro
- [ ] Create unlimited apps
- [ ] Cancel subscription
- [ ] Verify downgrade to free

# Stripe Testing
- [ ] Test webhook locally (Stripe CLI)
- [ ] Test all webhook events
- [ ] Verify idempotency
- [ ] Test failed payments
- [ ] Test trial period

# Security
- [ ] Rate limiting on checkout
- [ ] CSRF protection
- [ ] Webhook signature validation
- [ ] SQL injection prevention
- [ ] XSS prevention
```

**Test Stripe Webhook Locally:**
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger invoice.paid
```

**Pre-Launch Checklist:**
```bash
✅ Database migrations run
✅ Environment variables set
✅ Stripe products created
✅ Webhook endpoint configured
✅ PlanConfig seeded
✅ All tests passing
✅ Sentry error tracking active
✅ Analytics configured
✅ Pricing page live
✅ Documentation updated
✅ Monitoring dashboards ready
```

---

## 🧪 Testing Strategy

### Unit Tests
- `limits.test.ts` - Plan limits calculation
- `enforcement.test.ts` - Usage enforcement
- `subscriptions.test.ts` - Server actions

### Integration Tests
- `checkout-flow.test.ts` - Full checkout process
- `webhook-handler.test.ts` - Webhook processing
- `plan-upgrade.test.ts` - Upgrade scenarios

### E2E Tests (Playwright)
```typescript
// tests/e2e/checkout.spec.ts
test('User can upgrade to Pro plan', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.fill('[name=email]', 'test@example.com')
  await page.fill('[name=password]', 'password123')
  await page.click('button[type=submit]')

  // Go to pricing
  await page.goto('/pricing')

  // Click Pro plan
  await page.click('text=Start Free Trial')

  // Should redirect to Stripe Checkout
  await page.waitForURL(/checkout.stripe.com/)

  // Fill test card
  await page.fill('[name=cardNumber]', '4242424242424242')
  await page.fill('[name=cardExpiry]', '1234')
  await page.fill('[name=cardCvc]', '123')

  // Submit
  await page.click('text=Subscribe')

  // Should redirect back to dashboard
  await page.waitForURL(/dashboard/)

  // Verify Pro badge
  await expect(page.locator('text=Pro')).toBeVisible()
})
```

---

## 📊 Analytics & Metrics

### Track These Events:
```typescript
// Using Mixpanel or Amplitude

// Signup funnel
track('Signup Started')
track('Signup Completed', { planTier: 'FREE' })

// Activation
track('First App Created')
track('First Template Used')
track('First Export')

// Monetization
track('Pricing Page Viewed')
track('Checkout Started', { planTier: 'PRO', interval: 'monthly' })
track('Checkout Completed', { planTier: 'PRO', amount: 19 })
track('Trial Started')
track('Trial Converted')
track('Subscription Canceled', { reason: 'too expensive' })

// Engagement
track('App Created')
track('Build Started')
track('Export Downloaded')
track('Template Used', { templateId: 'ecommerce-basic' })

// Limits
track('Usage Limit Reached', { limitType: 'apps' })
track('Paywall Shown', { feature: 'analytics' })
track('Upgrade Button Clicked', { from: 'paywall' })
```

---

## 🚨 Error Handling & Edge Cases

### 1. **Failed Payments**
```typescript
// Webhook: invoice.payment_failed
- Mark subscription as PAST_DUE
- Send email notification
- Grace period: 7 days
- After 7 days → downgrade to FREE
```

### 2. **Subscription Conflicts**
```typescript
// User has multiple active subscriptions (shouldn't happen)
- Use most recent subscription
- Cancel older subscriptions
- Log to Sentry
```

### 3. **Webhook Failures**
```typescript
// Stripe retries webhooks automatically
- Idempotent handlers (use stripeSubscriptionId as unique key)
- Log all webhook events to DB for debugging
- Alert on repeated failures (Sentry)
```

### 4. **Rate Limiting**
```typescript
// Prevent checkout spam
- Max 5 checkout attempts per hour per user
- Use Redis or in-memory cache
```

### 5. **Proration**
```typescript
// User upgrades mid-cycle
- Stripe handles proration automatically
- Credit unused time from old plan
- Charge difference for new plan
```

---

## 🔒 Security Considerations

### 1. **Webhook Security**
```typescript
✅ Verify Stripe signature
✅ Use HTTPS only
✅ Validate all webhook data
✅ Rate limit webhook endpoint
✅ Log suspicious activity
```

### 2. **Payment Data**
```typescript
✅ NEVER store credit card numbers
✅ Use Stripe Customer Portal for updates
✅ PCI compliance via Stripe
✅ Encrypt sensitive metadata
```

### 3. **Authorization**
```typescript
✅ Verify user owns subscription before changes
✅ Check plan limits before allowing actions
✅ Prevent plan tier manipulation
✅ Audit log all subscription changes
```

---

## 📈 Success Metrics (KPIs)

### Week 1-2 Post-Launch:
- Pricing page views: 500+
- Checkout starts: 50+
- Trial signups: 25+
- MRR: $500+

### Month 1:
- Signups: 2,000
- Paid users: 100
- Conversion rate: 5%
- MRR: $1,900
- Churn: <5%

### Month 3:
- Signups: 10,000
- Paid users: 600
- Conversion rate: 6%
- MRR: $11,400
- Churn: <3%

---

## 🚀 Deployment Plan

### Pre-Deployment:
1. Run all tests
2. Update environment variables in production
3. Run database migrations
4. Create Stripe products in production mode
5. Configure production webhook endpoint

### Deployment:
```bash
# 1. Deploy code
git checkout main
git merge freemium-implementation
git push origin main

# 2. Run migrations
npm run db:migrate

# 3. Seed plan configs
npm run db:seed

# 4. Verify deployment
curl https://yourdomain.com/api/health
```

### Post-Deployment:
1. Test checkout flow in production (with test mode)
2. Verify webhook endpoint receiving events
3. Monitor Sentry for errors
4. Check analytics tracking
5. Announce launch to users

---

## 📚 Documentation

### For Users:
- Pricing page with FAQs
- Billing documentation
- Plan comparison chart
- Upgrade/downgrade guide

### For Developers:
- Stripe integration guide
- Webhook handler documentation
- Testing guide
- Troubleshooting guide

---

## 🎯 Post-Launch Optimization

### Week 1:
- A/B test pricing page
- Optimize checkout flow based on drop-off
- Adjust trial period if needed
- Collect user feedback

### Week 2-4:
- Add usage notifications (80% limit)
- Implement referral program
- Add annual plan discount
- Create case studies

### Month 2-3:
- Team plan features
- Enterprise sales process
- Custom enterprise pricing
- White-label options

---

## 📞 Support & Monitoring

### Monitoring:
- Sentry for errors
- Stripe Dashboard for revenue
- Analytics for user behavior
- Database monitoring (query performance)

### Alerts:
- Failed webhooks
- Payment failures spike
- Unusual churn rate
- Revenue drop

### Support:
- Email support for Pro+ users
- Chat support for Team+ users
- Knowledge base for all users
- Status page for incidents

---

## ✅ Final Checklist

**Before Starting Development:**
- [ ] Stripe account created
- [ ] Product requirements reviewed
- [ ] Database schema approved
- [ ] Security review completed
- [ ] Timeline confirmed

**Week 1 - Database:**
- [ ] Schema updated
- [ ] Migrations created
- [ ] Seed data added
- [ ] Indexes optimized

**Week 2 - Stripe:**
- [ ] SDK installed
- [ ] Products created
- [ ] Checkout flow working
- [ ] Webhooks tested

**Week 3 - Enforcement:**
- [ ] Limits system built
- [ ] Middleware updated
- [ ] Server actions created
- [ ] Tests passing

**Week 4 - Launch:**
- [ ] UI components built
- [ ] Pricing page live
- [ ] Analytics configured
- [ ] Documentation complete
- [ ] Deployed to production

---

## 🎉 Conclusion

Este plano técnico cobre todos os aspectos da implementação do freemium model, desde database schema até deployment em produção.

**Próximos Passos:**
1. Revisar e aprovar este plano
2. Criar branch `freemium-implementation`
3. Começar com Week 1 - Database Schema
4. Daily standups para acompanhar progresso
5. Weekly demos para validar features

**Estimativa Final:**
- **Duração:** 4 semanas
- **Effort:** 1 dev full-time
- **Complexidade:** Alta
- **Risco:** Médio
- **ROI Esperado:** $5k MRR em 60 dias

---

**Tech Leader:** Pronto para começar? 🚀
