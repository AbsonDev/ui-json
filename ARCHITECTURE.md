# 🏗️ Arquitetura do Projeto UI-JSON

## 📁 Estrutura de Diretórios

```
ui-json/
├── src/
│   ├── actions/              # Server Actions (Next.js)
│   │   ├── admin.ts          # Ações administrativas
│   │   ├── app-auth.ts       # Autenticação de usuários de apps publicados
│   │   ├── apps.ts           # CRUD de aplicativos
│   │   ├── database-connections.ts  # Gerenciamento de conexões DB
│   │   ├── entities.ts       # Gerenciamento de entidades
│   │   ├── entity-data.ts    # CRUD de dados de entidades
│   │   ├── files.ts          # Upload e gerenciamento de arquivos
│   │   └── subscriptions.ts  # Gerenciamento de assinaturas/planos
│   │
│   ├── app/                  # Next.js App Router
│   │   ├── (auth)/          # Grupo de rotas de autenticação
│   │   │   ├── login/       # Página de login
│   │   │   └── register/    # Página de registro
│   │   ├── admin/           # Dashboard administrativo
│   │   ├── dashboard/       # Dashboard principal do usuário
│   │   │   └── databases/   # Gerenciamento de bancos de dados
│   │   ├── pricing/         # Página de preços/planos
│   │   ├── settings/        # Configurações do usuário
│   │   │   └── billing/     # Configurações de cobrança
│   │   ├── p/               # Apps publicados (rota pública)
│   │   │   └── [slug]/      # Visualização de app publicado
│   │   └── api/             # API Routes
│   │       ├── ai/          # Endpoints de IA
│   │       ├── apps/        # API de aplicativos
│   │       ├── auth/        # Autenticação NextAuth
│   │       ├── stripe/      # Webhooks e endpoints Stripe
│   │       └── cron/        # Jobs agendados
│   │
│   ├── components/           # Componentes React
│   │   ├── subscription/    # Componentes de assinatura
│   │   ├── AIAssistant.tsx  # Assistente de IA para editor
│   │   ├── AIComponents.tsx # Componentes de IA renderizados
│   │   ├── DatabaseEditor.tsx  # Editor de banco de dados
│   │   ├── EntityManager.tsx   # Gerenciador de entidades
│   │   ├── DataManager.tsx     # Gerenciador de dados
│   │   ├── FlowBuilder.tsx     # Construtor de fluxos
│   │   ├── Renderer.tsx        # Renderizador de UI JSON
│   │   ├── PublishedAppRenderer.tsx  # Renderizador para apps publicados
│   │   └── __tests__/       # Testes de componentes
│   │
│   ├── contexts/            # React Contexts
│   │   └── DatabaseContext.tsx  # Contexto global de banco de dados
│   │
│   ├── hooks/               # Custom React Hooks
│   │   ├── useAction.ts     # Hook para gerenciar ações da UI
│   │   ├── useApps.ts       # Hook para gerenciar aplicativos
│   │   ├── useDatabaseContext.ts  # Hook para acessar DatabaseContext
│   │   ├── useDatabaseState.ts    # Hook para estado de banco de dados
│   │   ├── useSession.ts    # Hook para sessão do usuário
│   │   └── __tests__/       # Testes de hooks
│   │
│   ├── lib/                 # Utilitários e configurações
│   │   ├── actions/         # Action Handlers (diferente de src/actions/)
│   │   │   ├── handlers/    # Handlers específicos de ações UI
│   │   │   │   ├── ai-handler.ts         # Handler de ações de IA
│   │   │   │   ├── auth-handler.ts       # Handler de auth UI
│   │   │   │   ├── database-handler.ts   # Handler de DB UI
│   │   │   │   ├── navigation-handler.ts # Handler de navegação
│   │   │   │   ├── popup-handler.ts      # Handler de popups
│   │   │   │   └── submit-handler.ts     # Handler de submissões
│   │   │   └── action-context.ts  # Contexto de ações
│   │   │
│   │   ├── ai/              # Funcionalidades de IA
│   │   │   ├── gemini.ts    # Cliente Google Gemini
│   │   │   └── promptSuggestions.ts  # Sugestões de prompts
│   │   │
│   │   ├── analytics/       # Analytics e tracking
│   │   │   ├── config.ts    # Configuração Mixpanel
│   │   │   └── events.ts    # Eventos de analytics
│   │   │
│   │   ├── email/           # Sistema de emails
│   │   │   ├── resend.ts    # Cliente Resend
│   │   │   └── templates.ts # Templates de email
│   │   │
│   │   ├── mobile-builder/  # Construtor de apps mobile
│   │   │   └── MobileBuilder.ts
│   │   │
│   │   ├── auth.ts          # Configuração NextAuth
│   │   ├── auth-middleware.ts  # Middleware de autenticação
│   │   ├── encryption.ts    # Criptografia AES-256
│   │   ├── env.ts           # Validação de variáveis de ambiente
│   │   ├── file-utils.ts    # Utilitários de arquivos
│   │   ├── jwt.ts           # JWT para apps publicados
│   │   ├── logger.ts        # Logger Winston
│   │   ├── prisma.ts        # Cliente Prisma
│   │   ├── stripe.ts        # Cliente Stripe
│   │   └── universal-logger.ts  # Logger universal
│   │
│   ├── styles/              # Estilos globais
│   │   └── globals.css      # CSS global com Tailwind
│   │
│   └── types/               # TypeScript Types
│       └── index.ts         # Definições de tipos centralizadas
│
├── prisma/                  # Prisma ORM
│   ├── schema.prisma        # Schema do banco de dados
│   └── seed.ts              # Seed inicial do banco
│
├── e2e/                     # Testes E2E (Playwright)
│   ├── ai-components.spec.ts
│   ├── api-integration.spec.ts
│   └── auth.spec.ts
│
├── scripts/                 # Scripts utilitários
│   └── verify-env.ts        # Verificação de ambiente
│
├── public/                  # Arquivos estáticos
│   └── uploads/             # Uploads de usuários
│
├── docs/                    # Documentação
│   └── *.md                 # Vários documentos
│
└── Arquivos de configuração:
    ├── .env.example         # Exemplo de variáveis de ambiente
    ├── .env.local           # Variáveis de ambiente local (git-ignored)
    ├── .gitignore
    ├── capacitor.config.ts  # Configuração Capacitor (mobile)
    ├── eslint.config.mjs
    ├── jest.config.mjs
    ├── next.config.js
    ├── package.json
    ├── playwright.config.ts
    ├── postcss.config.js
    ├── prisma/schema.prisma
    ├── tailwind.config.js
    ├── tsconfig.json
    └── vercel.json
```

---

## 🔍 Diferença entre `src/actions/` e `src/lib/actions/`

### `src/actions/` - Server Actions do Next.js
Contém **Server Actions** que são executadas no servidor Next.js:
- Marcadas com `'use server'`
- Interagem diretamente com o banco de dados via Prisma
- Lidam com autenticação, autorização e lógica de negócio
- Exemplos: `createApp()`, `updateUser()`, `uploadFile()`

### `src/lib/actions/handlers/` - Handlers de Ações da UI
Contém **handlers** para processar ações definidas no JSON da UI:
- Executados no client-side durante renderização
- Processam ações como `navigate`, `submit`, `popup`, `auth:login`
- Lidam com interações do usuário nos apps renderizados
- Exemplos: `handleNavigate()`, `handleSubmit()`, `handleAuthLogin()`

**Analogia**:
- `src/actions/` = Backend API
- `src/lib/actions/handlers/` = Event Handlers do Frontend

---

## 🎯 Fluxo de Dados Principal

```
1. Usuário → Dashboard (src/app/dashboard/)
2. Cria/Edita App → Server Actions (src/actions/apps.ts)
3. Salva no DB → Prisma (prisma/schema.prisma)
4. Renderiza UI → Renderer (src/components/Renderer.tsx)
5. Ação do Usuário → Action Handlers (src/lib/actions/handlers/)
6. Chama API → API Routes (src/app/api/)
7. Processa no Backend → Server Actions
8. Atualiza Estado → React Hooks (src/hooks/)
```

---

## 🔐 Autenticação

### Duas camadas de autenticação:

1. **Autenticação de Desenvolvedores** (NextAuth)
   - Login/Registro em `/login`, `/register`
   - Sessão gerenciada por NextAuth
   - Arquivo: `src/lib/auth.ts`

2. **Autenticação de Apps Publicados** (JWT)
   - Usuários finais de apps publicados
   - JWT customizado para cada app
   - Arquivo: `src/lib/jwt.ts`
   - Server Actions: `src/actions/app-auth.ts`

---

## 📊 Banco de Dados (Prisma)

### Modelos Principais:

- **User**: Desenvolvedores da plataforma
- **App**: Aplicativos criados
- **DatabaseConnection**: Conexões de banco de dados
- **Entity**: Entidades (tabelas) dos apps
- **EntityData**: Dados das entidades
- **AppUser**: Usuários dos apps publicados
- **Subscription**: Assinaturas de planos
- **UsageMetric**: Métricas de uso

Ver schema completo em: `prisma/schema.prisma`

---

## 🎨 Componentes Principais

### Componentes de Editor:
- **AIAssistant**: Assistente de IA para gerar UI
- **DatabaseEditor**: Editor visual de banco de dados
- **EntityManager**: Gerenciar entidades/tabelas
- **DataManager**: CRUD de dados
- **FlowBuilder**: Construtor visual de fluxos
- **JsonEditor**: Editor JSON com Monaco

### Componentes de Renderização:
- **Renderer**: Renderiza componentes a partir do JSON
- **PublishedAppRenderer**: Renderiza apps publicados
- **AIComponents**: Componentes com IA integrada

---

## 🔄 Sistema de Renderização

O sistema renderiza UIs a partir de JSON:

```typescript
interface UIApp {
  name: string;
  initialScreen: string;
  screens: UIScreen[];
  database?: Record<string, any[]>;
}

interface UIScreen {
  id: string;
  name: string;
  components: UIComponent[];
}

interface UIComponent {
  id: string;
  type: 'container' | 'text' | 'button' | 'input' | ...;
  props: Record<string, any>;
  children?: UIComponent[];
  action?: UIAction;
}
```

Ver tipos completos em: `src/types/index.ts`

---

## 🚀 Deploy e Produção

### Variáveis de Ambiente Necessárias:

**Essenciais:**
- `DATABASE_URL`: PostgreSQL
- `NEXTAUTH_URL`: URL do app
- `NEXTAUTH_SECRET`: Secret para NextAuth
- `ENCRYPTION_KEY`: Chave para criptografia
- `GEMINI_API_KEY`: Google Gemini

**Stripe (Pagamentos):**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_*`: IDs dos preços

**Opcionais mas Recomendados:**
- `SENTRY_DSN`: Monitoramento de erros
- `NEXT_PUBLIC_MIXPANEL_TOKEN`: Analytics
- `RESEND_API_KEY`: Envio de emails
- `UPSTASH_REDIS_*`: Rate limiting

Ver exemplo completo em: `.env.example`

---

## 🧪 Testes

### Jest (Unit Tests):
```bash
npm test
npm run test:watch
npm run test:coverage
```

### Playwright (E2E Tests):
```bash
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:headed
```

Testes localizados em:
- Unit: `src/**/__tests__/`
- E2E: `e2e/`

---

## 📱 Mobile (Capacitor)

O projeto suporta build para mobile via Capacitor:

```bash
npm run mobile:sync              # Sincroniza web → mobile
npm run mobile:android:open      # Abre projeto Android
npm run mobile:ios:open          # Abre projeto iOS
npm run mobile:android:build     # Build Android
npm run mobile:ios:build         # Build iOS
```

Configuração em: `capacitor.config.ts`

---

## 🎯 Convenções de Código

### Imports:
- **Usar alias `@/`**: Sempre que possível
- ✅ `import { User } from '@/types'`
- ❌ `import { User } from '../../../types'`

### Logging:
- **Usar logger estruturado**: Nunca `console.*`
- ✅ `logger.error('Failed to save', { error })`
- ❌ `console.error('Failed to save:', error)`

### Server Actions:
- Sempre começar com `'use server'`
- Validar inputs com Zod
- Tratar erros adequadamente
- Retornar objetos tipados

### Client Components:
- Usar `'use client'` apenas quando necessário
- Preferir Server Components quando possível
- Hooks só em Client Components

---

## 📚 Recursos Adicionais

### Documentação Complementar:
- `README.md`: Setup e introdução
- `SETUP.md`: Guia de instalação detalhado
- `DEPLOYMENT.md`: Guia de deploy
- `TESTING.md`: Guia de testes
- `FREEMIUM_TECHNICAL_PLAN.md`: Plano técnico freemium
- `PRODUCTION_READINESS.md`: Checklist de produção

### Links Úteis:
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- Tailwind: https://tailwindcss.com/docs
- NextAuth: https://next-auth.js.org
- Stripe: https://stripe.com/docs
- Google Gemini: https://ai.google.dev/docs

---

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev                 # Servidor de desenvolvimento

# Build e Deploy
npm run build              # Build de produção
npm start                  # Servidor de produção
npm run vercel-build       # Build para Vercel

# Database
npm run db:push            # Push schema para DB
npm run db:migrate         # Criar migração
npm run db:studio          # Prisma Studio
npm run db:seed            # Popular DB com dados

# Code Quality
npm run lint               # Executar linter
npm test                   # Executar testes

# Mobile
npm run mobile:sync        # Sincronizar com mobile
```

---

**Última atualização**: 2025-12-28
