# 🚀 Freemium Implementation - Roadmap Executivo
**Projeto:** UI-JSON Visualizer Monetization
**Objetivo:** $5k MRR em 60 dias pós-lançamento
**Timeline:** 4 semanas

---

## 📊 Pricing Strategy

### FREE (Tier 1)
```
💰 $0/mês
📱 3 apps
📤 5 exports/mês (JSON only)
📚 3 templates básicos
🤖 AI: 10 requests/dia
⏱️ Version history: 7 dias
```

### PRO (Tier 2) - **FOCO PRINCIPAL**
```
💰 $19/mês ou $199/ano (economize 17%)
📱 Apps ilimitados
📤 Exports ilimitados (todos os formatos)
📚 Todos os templates (20+)
🤖 AI: 100 requests/dia
📦 10 builds mobile/mês
🎨 Remove watermark
📊 Analytics dashboard
⏱️ Version history: 30 dias
🎁 14 dias de trial GRÁTIS
```

### TEAM (Tier 3)
```
💰 $49/usuário/mês
✨ Tudo do Pro +
👥 Colaboração em tempo real
📦 50 builds/mês
🎯 Priority support
📊 Advanced analytics
⏱️ Version history: 90 dias
```

---

## 🏗️ Arquitetura - Overview

```
┌──────────────────────────────────────────────┐
│         FRONTEND (Next.js + React)           │
│   Pricing │ Paywall │ Checkout │ Settings    │
└────────────────────┬─────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────┐
│           SERVER ACTIONS + API               │
│  createCheckout │ manageSubscription         │
└────────────────────┬─────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────┐
│              MIDDLEWARE                      │
│  Check Limits │ Enforce Quotas │ Gate Features│
└────────────────────┬─────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────┐
│         DATABASE (PostgreSQL)                │
│  User │ Subscription │ Invoice │ UsageMetrics│
└────────────────────┬─────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────┐
│          STRIPE + ANALYTICS                  │
└──────────────────────────────────────────────┘
```

---

## 📅 Timeline - 4 Semanas

### WEEK 1: Foundation 🏗️
**Objetivo:** Database schema + Stripe setup

**Day 1-2: Database Schema**
- ✅ Adicionar modelos: Subscription, UsageMetric, Invoice, PlanConfig
- ✅ Criar migrations
- ✅ Seed plan configs
- ✅ Testar rollback

**Day 3-4: Stripe Integration**
- ✅ Criar conta Stripe + API keys
- ✅ Instalar Stripe SDK
- ✅ Criar produtos no dashboard
- ✅ Configurar webhook endpoint

**Day 5-7: Usage Limits System**
- ✅ Criar lib/subscription/limits.ts
- ✅ Criar enforcement.ts
- ✅ Hook useUsageLimits
- ✅ Testes unitários

**Entregável:** Database pronta + Stripe configurado

---

### WEEK 2: Payments 💳
**Objetivo:** Checkout flow + Webhooks funcionando

**Day 8-10: Checkout Flow**
- ✅ API route /api/checkout
- ✅ Customer Portal /api/billing-portal
- ✅ Criar Stripe customers
- ✅ Checkout sessions

**Day 11-14: Webhook Handler**
- ✅ Endpoint /api/webhooks/stripe
- ✅ Handle checkout.session.completed
- ✅ Handle subscription.created/updated
- ✅ Handle invoice.paid/failed
- ✅ Testar com Stripe CLI

**Entregável:** Usuários podem assinar plans via Stripe

---

### WEEK 3: Enforcement 🔒
**Objetivo:** Limits enforcement + Server actions

**Day 15-17: Subscription Actions**
- ✅ getCurrentSubscription()
- ✅ getUserPlanDetails()
- ✅ getUsageMetrics()
- ✅ cancelSubscription()

**Day 18-21: Middleware & Enforcement**
- ✅ Atualizar middleware.ts
- ✅ enforceAppLimit() no createApp
- ✅ enforceBuildLimit() no createBuild
- ✅ enforceFeatureAccess() no analytics
- ✅ Testes de integração

**Entregável:** Limits enforcement funcionando end-to-end

---

### WEEK 4: UI & Launch 🎨
**Objetivo:** UI polida + Lançamento

**Day 22-24: Pricing Page**
- ✅ Página /pricing
- ✅ Comparação de plans
- ✅ Toggle monthly/yearly
- ✅ Botões de checkout

**Day 25-26: Paywall Components**
- ✅ Componente Paywall
- ✅ UsageIndicator
- ✅ UpgradeBanner
- ✅ Billing Settings page

**Day 27-28: Testing & Launch**
- ✅ E2E tests (Playwright)
- ✅ Security review
- ✅ Performance testing
- ✅ Deploy para produção
- ✅ Announcement + Marketing

**Entregável:** 🚀 LANÇAMENTO!

---

## 🗂️ Database Schema - Novos Modelos

### 1. Subscription
```sql
id                    String (PK)
stripeSubscriptionId  String (unique)
stripePriceId         String
planTier              Enum (FREE, PRO, TEAM)
status                Enum (ACTIVE, TRIALING, CANCELED...)
currentPeriodStart    DateTime
currentPeriodEnd      DateTime
amount                Int (cents)
trialEnd              DateTime?
userId                String (FK → User)
```

### 2. UsageMetric
```sql
id          String (PK)
userId      String (FK)
appsCount   Int
buildsCount Int
exportsCount Int
periodStart DateTime
periodEnd   DateTime
```

### 3. Invoice
```sql
id               String (PK)
stripeInvoiceId  String (unique)
amount           Int
status           Enum (PAID, OPEN, VOID...)
hostedInvoiceUrl String?
paidAt           DateTime?
userId           String (FK)
```

### 4. PlanConfig
```sql
id            String (PK)
planTier      Enum (unique)
maxApps       Int (-1 = unlimited)
maxBuilds     Int
maxExports    Int
features      JSON
priceMonthly  Int?
priceYearly   Int?
```

### 5. User (Extended)
```diff
+ planTier          PlanTier @default(FREE)
+ stripeCustomerId  String? @unique
```

---

## 🔐 Security Checklist

- ✅ Webhook signature verification (Stripe)
- ✅ Rate limiting no checkout (5 attempts/hora)
- ✅ Authorization checks em todas as actions
- ✅ Encryption de dados sensíveis
- ✅ SQL injection prevention (Prisma)
- ✅ XSS prevention
- ✅ HTTPS only em produção
- ✅ Audit logs para mudanças de subscription
- ✅ PCI compliance via Stripe

---

## 🧪 Testing Strategy

### Unit Tests (125+ testes)
```typescript
// Limits
✅ getPlanLimits()
✅ checkAppLimit()
✅ checkBuildLimit()
✅ enforceAppLimit()

// Subscriptions
✅ createCheckoutSession()
✅ handleWebhook()
✅ updateUserPlan()
```

### Integration Tests
```typescript
✅ Full checkout flow
✅ Subscription creation
✅ Plan upgrade/downgrade
✅ Cancellation flow
✅ Webhook processing
```

### E2E Tests (Playwright)
```typescript
✅ User signup → free plan
✅ Create 3 apps → hit limit
✅ Upgrade to Pro → trial start
✅ Create unlimited apps
✅ Cancel subscription
```

---

## 📊 Success Metrics

### Week 1 Post-Launch
- 🎯 500 pricing page views
- 🎯 50 checkout starts
- 🎯 25 trial signups
- 🎯 $500 MRR

### Month 1
- 🎯 2,000 total signups
- 🎯 100 paid users (5% conversion)
- 🎯 $1,900 MRR
- 🎯 <5% churn

### Month 3
- 🎯 10,000 total signups
- 🎯 600 paid users (6% conversion)
- 🎯 $11,400 MRR
- 🎯 <3% churn

### Month 6 (Target)
- 🎯 25,000 signups
- 🎯 1,500 paid users
- 🎯 $28,500 MRR
- 🎯 $342k ARR

---

## 💡 Key Features

### Pricing Page
- ✅ 3 tiers (Free, Pro, Team)
- ✅ Monthly/yearly toggle
- ✅ "Save 17%" badge
- ✅ Feature comparison
- ✅ Social proof
- ✅ FAQs

### Checkout Flow
- ✅ Stripe Checkout (hosted)
- ✅ 14-day free trial
- ✅ Promo codes support
- ✅ Multiple payment methods
- ✅ Success/cancel redirects

### Usage Enforcement
- ✅ Real-time limit checking
- ✅ Soft warnings (80% usage)
- ✅ Hard limits (100% usage)
- ✅ Upgrade prompts
- ✅ Usage dashboard

### Billing Management
- ✅ Stripe Customer Portal
- ✅ View invoices
- ✅ Update payment method
- ✅ Cancel subscription
- ✅ Reactivate subscription

---

## 🎯 User Journey

### Free User
```
1. Sign up → Free plan
2. Create 3 apps → Hit limit
3. See paywall → "Upgrade to Pro"
4. Click upgrade → Pricing page
5. Start trial → 14 days free
6. Convert → Paid user 🎉
```

### Pro User
```
1. Active subscription
2. Create unlimited apps
3. Use all features
4. Export mobile builds
5. View analytics
6. Renew monthly → Retained 💚
```

### Churned User
```
1. Cancel subscription
2. Downgrade to Free (grace period)
3. Keep apps (read-only)
4. Email campaign → Win-back
5. Reactivate → Retained 🎉
```

---

## 📈 Revenue Projections

### Conservative Scenario
```
Month 1:  $1,900 MRR  (100 Pro users)
Month 3:  $11,400 MRR (600 Pro users)
Month 6:  $28,500 MRR (1,500 Pro users)
Year 1:   $57,000 MRR (3,000 Pro users)
ARR Year 1: $684k
```

### Optimistic Scenario
```
Month 1:  $3,800 MRR  (200 Pro users)
Month 3:  $19,000 MRR (1,000 Pro users)
Month 6:  $57,000 MRR (3,000 Pro users)
Year 1:   $114,000 MRR (6,000 Pro users)
ARR Year 1: $1.368M
```

**Assumptions:**
- 2,000 signups/month (organic + paid)
- 5-10% free → paid conversion
- $19 ARPU (Pro monthly)
- 3-5% monthly churn

---

## 🚀 Launch Plan

### Pre-Launch (Day -7)
- ✅ Final testing
- ✅ Deploy to production
- ✅ Verify webhooks
- ✅ Smoke tests

### Launch Day (Day 0)
- 📧 Email all users (announce paid plans)
- 📱 Social media announcement
- 📝 Blog post: "Introducing Pro Plans"
- 🎁 Early adopter discount (50% off 6 months)

### Post-Launch (Day +7)
- 📊 Monitor metrics daily
- 🐛 Fix bugs immediately
- 💬 Collect user feedback
- 🔧 Iterate on pricing/features

---

## ⚠️ Risks & Mitigations

### Risk 1: Baixa conversão Free → Pro
**Mitigação:**
- A/B test pricing ($15 vs $19)
- Extended trial (30 days)
- Feature-gating mais agressivo
- Onboarding melhorado

### Risk 2: Alto churn rate
**Mitigação:**
- Email drip campaigns
- Exit surveys
- Win-back offers
- Product improvements

### Risk 3: Stripe webhook failures
**Mitigação:**
- Idempotent handlers
- Retry logic
- Manual reconciliation scripts
- Sentry alerting

### Risk 4: Database performance
**Mitigação:**
- Índices otimizados
- Query optimization
- Caching (Redis)
- Database scaling

---

## 📞 Support Strategy

### Free Users
- 📚 Knowledge base
- 💬 Community forum
- 📧 Email (48h response)

### Pro Users
- ✅ All Free features +
- 📧 Priority email (24h response)
- 💬 Live chat (business hours)

### Team Users
- ✅ All Pro features +
- 📞 Phone support
- 🎯 Dedicated account manager
- 🔧 Custom onboarding

---

## 🎉 Next Steps

### Immediate (Hoje)
1. ✅ Revisar este roadmap
2. ✅ Aprovar pricing strategy
3. ✅ Criar branch `freemium-implementation`
4. ✅ Kickoff meeting

### Week 1 (Esta semana)
1. Implementar database schema
2. Setup Stripe account
3. Criar produtos no Stripe
4. Build usage limits system

### Week 2-4
1. Seguir roadmap acima
2. Daily standups
3. Weekly demos
4. Continuous testing

### Launch Day
1. 🚀 Deploy para produção
2. 📣 Announcement
3. 📊 Monitor metrics
4. 🎊 Celebrate!

---

**Status:** ✅ PLANEJAMENTO COMPLETO
**Próximo:** 👉 Começar Week 1 - Database Schema

**Quer que eu comece a implementação?** 🚀
