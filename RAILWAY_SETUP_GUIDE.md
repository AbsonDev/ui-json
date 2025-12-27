# Guia Completo: Configurar PostgreSQL no Railway

## Por que Railway?

✅ PostgreSQL gerenciado e otimizado
✅ $5 de crédito grátis por mês
✅ Backups automáticos
✅ SSL/TLS incluído
✅ Fácil integração com Vercel
✅ Variáveis de ambiente automáticas

---

## Passo 1: Criar Conta no Railway

1. Acesse: https://railway.app
2. Clique em **"Start a New Project"** ou **"Login with GitHub"**
3. Autorize o Railway a acessar sua conta GitHub

---

## Passo 2: Criar Banco de Dados PostgreSQL

### Opção A: Via Dashboard (Recomendado)

1. No Railway Dashboard, clique em **"+ New Project"**
2. Selecione **"Provision PostgreSQL"**
3. Railway criará automaticamente:
   - ✅ Instância PostgreSQL
   - ✅ Usuário e senha
   - ✅ Database padrão
   - ✅ Variáveis de ambiente

### Opção B: Via Railway CLI

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Criar novo projeto
railway init

# Adicionar PostgreSQL
railway add --plugin postgresql
```

---

## Passo 3: Obter Credenciais do Banco

### No Dashboard:

1. Clique no seu projeto PostgreSQL
2. Vá na aba **"Variables"**
3. Você verá as seguintes variáveis:

```env
DATABASE_URL=postgresql://postgres:SENHA@containers-us-west-XXX.railway.app:5432/railway
PGHOST=containers-us-west-XXX.railway.app
PGPORT=5432
PGUSER=postgres
PGPASSWORD=SENHA_GERADA
PGDATABASE=railway
```

### Importante: Copie a `DATABASE_URL` completa!

Exemplo:
```
postgresql://postgres:abc123xyz@containers-us-west-123.railway.app:5432/railway
```

---

## Passo 4: Configurar Variáveis no Vercel

### Via Vercel Dashboard:

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto **ui-json**
3. Vá em **Settings** → **Environment Variables**
4. Adicione as seguintes variáveis:

#### 🔐 Variáveis Obrigatórias:

```env
# Database (do Railway)
DATABASE_URL=postgresql://postgres:SENHA@containers-us-west-XXX.railway.app:5432/railway

# NextAuth
NEXTAUTH_URL=https://seu-projeto.vercel.app
NEXTAUTH_SECRET=<gerar-com-comando-abaixo>

# Encryption (para credenciais no DB)
ENCRYPTION_KEY=<exatamente-32-caracteres>

# Cron Jobs
CRON_SECRET=<gerar-com-comando-abaixo>
```

#### 🎯 Variáveis Opcionais (para funcionalidades extras):

```env
# Google Gemini AI (opcional)
GEMINI_API_KEY=<sua-chave-api>

# Stripe (para pagamentos)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_TEAM_MONTHLY=price_...
STRIPE_PRICE_TEAM_YEARLY=price_...

# Resend (para emails)
RESEND_API_KEY=re_...

# Upstash Redis (para cache)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Mixpanel (para analytics)
NEXT_PUBLIC_MIXPANEL_TOKEN=...

# Sentry (para error tracking)
SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_DSN=https://...
```

---

## Passo 5: Gerar Secrets

Use estes comandos para gerar secrets seguros:

```bash
# NEXTAUTH_SECRET (mínimo 32 chars)
openssl rand -base64 32

# ENCRYPTION_KEY (exatamente 32 chars para AES-256)
openssl rand -base64 32 | cut -c1-32

# CRON_SECRET (mínimo 32 chars)
openssl rand -base64 32

# Ou use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Passo 6: Configurar NEXTAUTH_URL

A `NEXTAUTH_URL` deve ser a URL do seu projeto no Vercel:

```env
# Produção
NEXTAUTH_URL=https://ui-json.vercel.app

# Ou seu domínio customizado
NEXTAUTH_URL=https://seudominio.com
```

**Importante:** Você encontra a URL do projeto em:
- Vercel Dashboard → Seu Projeto → **Domains**

---

## Passo 7: Aplicar Migrações do Prisma

Depois de configurar as variáveis, rode as migrações:

### Opção A: Localmente (Recomendado)

```bash
# Configure a DATABASE_URL localmente (temporário)
export DATABASE_URL="postgresql://postgres:SENHA@containers-us-west-XXX.railway.app:5432/railway"

# Rode as migrações
npx prisma migrate deploy

# Verifique o status
npx prisma migrate status
```

### Opção B: Via Railway CLI

```bash
# Conecte ao projeto
railway link

# Rode as migrações
railway run npx prisma migrate deploy
```

### Opção C: Via Prisma Studio

```bash
# Configure DATABASE_URL
export DATABASE_URL="sua-url-do-railway"

# Abra Prisma Studio
npx prisma studio

# O Prisma Studio aplicará as migrações automaticamente
```

---

## Passo 8: Verificar Conexão

Teste a conexão com o banco:

```bash
# Via Prisma CLI
export DATABASE_URL="sua-url-do-railway"
npx prisma db pull

# Via psql (se tiver instalado)
psql "postgresql://postgres:SENHA@containers-us-west-XXX.railway.app:5432/railway"
```

---

## Passo 9: Redeployar no Vercel

Após configurar todas as variáveis:

1. **Vercel Dashboard** → Seu Projeto → **Deployments**
2. Clique no último deployment → **...** (3 pontos) → **Redeploy**
3. Marque **"Use existing Build Cache"** (ou desmarque para build limpo)
4. Clique em **Redeploy**

Ou force via push:

```bash
git commit --allow-empty -m "chore: Trigger redeploy with Railway DB"
git push origin claude/review-production-readiness-lDz7h
```

---

## Passo 10: Verificar Logs

### No Vercel:

1. **Deployments** → Último deployment → **Function Logs**
2. Procure por erros de conexão

### No Railway:

1. Clique no seu PostgreSQL
2. Vá na aba **"Logs"**
3. Verifique conexões bem-sucedidas

---

## 🔒 Segurança: Configurar IP Whitelist (Opcional)

Railway permite restringir acesso por IP:

1. Railway Dashboard → Seu PostgreSQL → **Settings**
2. Em **"Networking"**, adicione os IPs do Vercel
3. Vercel IPs: https://vercel.com/docs/concepts/edge-network/regions#region-list

**Nota:** Isso pode ser complexo pois Vercel usa IPs dinâmicos. Melhor usar autenticação forte.

---

## 🎯 Checklist Final

Antes de deployar em produção:

- [ ] PostgreSQL criado no Railway
- [ ] `DATABASE_URL` copiada e adicionada no Vercel
- [ ] `NEXTAUTH_SECRET` gerado (min 32 chars)
- [ ] `NEXTAUTH_URL` configurado com domínio correto
- [ ] `ENCRYPTION_KEY` gerado (exatos 32 chars)
- [ ] Migrações do Prisma aplicadas
- [ ] Variáveis de ambiente testadas localmente
- [ ] Redeploy feito no Vercel
- [ ] Build passou sem erros
- [ ] Conexão com banco funcionando
- [ ] APIs testadas (login, signup, etc)

---

## 🚨 Troubleshooting

### Erro: "Can't reach database server"

```
Error: Can't reach database server at `containers-us-west-XXX.railway.app:5432`
```

**Solução:**
1. Verifique se a `DATABASE_URL` está correta
2. Teste a conexão localmente primeiro
3. Verifique se o Railway PostgreSQL está ativo (não suspenso)

### Erro: "Authentication failed"

```
Error: Error validating datasource `db`: Authentication failed against database server
```

**Solução:**
1. Verifique usuário e senha na `DATABASE_URL`
2. Copie novamente do Railway (pode ter mudado)
3. Certifique-se que não há espaços extras

### Erro: "SSL connection required"

```
Error: Server does not support SSL connections
```

**Solução:**
Adicione `?sslmode=require` no final da `DATABASE_URL`:

```env
DATABASE_URL=postgresql://postgres:SENHA@host:5432/railway?sslmode=require
```

### Migrações não aplicam

**Solução:**
```bash
# Force reset (CUIDADO: apaga dados!)
npx prisma migrate reset

# Ou aplique manualmente
npx prisma db push
```

---

## 💰 Custos do Railway

### Plano Hobby (Gratuito):

- ✅ $5 de crédito grátis/mês
- ✅ PostgreSQL: ~$0.02/hora = ~$15/mês
- ⚠️ Crédito grátis cobre ~8 dias de uso contínuo

### Plano Developer ($5/mês):

- ✅ $5 de crédito/mês
- ✅ Mais recursos e prioridade
- ✅ Melhor para produção

### Alternativas se exceder o limite:

1. **Neon** (https://neon.tech) - PostgreSQL serverless gratuito
2. **Supabase** (https://supabase.com) - PostgreSQL + Auth + Storage gratuito
3. **PlanetScale** (https://planetscale.com) - MySQL serverless gratuito
4. **Heroku Postgres** - $5/mês para básico

---

## 🎉 Próximos Passos

Após configurar o Railway:

1. ✅ **Testar localmente** com a DATABASE_URL do Railway
2. ✅ **Aplicar migrações** de produção
3. ✅ **Configurar Vercel** com todas as env vars
4. ✅ **Fazer redeploy** e verificar logs
5. ✅ **Testar funcionalidades** (signup, login, etc)
6. ✅ **Configurar backups** automáticos no Railway
7. ✅ **Monitorar uso** para não exceder limites

---

## 📚 Recursos Úteis

- Railway Docs: https://docs.railway.app
- Railway PostgreSQL: https://docs.railway.app/databases/postgresql
- Vercel Env Vars: https://vercel.com/docs/concepts/projects/environment-variables
- Prisma Deploy: https://www.prisma.io/docs/guides/deployment
- NextAuth.js Config: https://next-auth.js.org/configuration/options

---

**Criado em:** 2025-12-27
**Para:** Projeto ui-json
**Status:** Pronto para produção 🚀
