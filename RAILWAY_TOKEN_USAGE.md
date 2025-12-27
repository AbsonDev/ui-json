# Railway Token - Guia de Uso

## ⚠️ IMPORTANTE: Segurança do Token

Você compartilhou o token do Railway:
```
951ebe8d-266c-41f4-9950-8a906b4dc083
```

### 🔒 Atenção de Segurança:

1. ❌ **NÃO compartilhe este token publicamente**
2. ❌ **NÃO faça commit dele no Git**
3. ❌ **NÃO publique em issues ou PRs**
4. ✅ **Mantenha-o secreto e seguro**

### Se o token foi exposto:

1. Acesse: https://railway.app/account/tokens
2. Delete o token atual
3. Crie um novo token
4. Use o novo token apenas localmente

---

## 📦 Como Usar o Token

### Opção 1: Aplicar Migrações (SEM token)

**Você NÃO precisa do token para aplicar migrações!**

Basta usar a DATABASE_URL diretamente:

```bash
# Execute este script que criei:
chmod +x apply-migrations.sh
./apply-migrations.sh
```

Ou manualmente:

```bash
# Configure a DATABASE_URL
export DATABASE_URL="postgresql://postgres:kKfhSSRlDNDqXKOiyREVJfCZYyDcGthc@metro.proxy.rlwy.net:44511/railway"

# Aplique as migrações
npx prisma migrate deploy
```

---

### Opção 2: Railway CLI (COM token)

**Use o token apenas se precisar da Railway CLI:**

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login com token
export RAILWAY_TOKEN="951ebe8d-266c-41f4-9950-8a906b4dc083"
railway login

# 3. Link do projeto
railway link

# 4. Executar comandos
railway run npx prisma migrate deploy
railway run npx prisma studio
```

---

## 🎯 O que você REALMENTE precisa fazer:

### Para Aplicar Migrações:

**Opção A - Localmente (Recomendado):**

```bash
# 1. Execute o script que criei
./apply-migrations.sh
```

**Opção B - Via Vercel (Automático):**

1. Adicione todas as variáveis no Vercel (ver `VERCEL_ENV_VARIABLES.txt`)
2. Adicione `DATABASE_URL` também
3. Altere `vercel.json` para incluir migrations:
   ```json
   "buildCommand": "prisma generate && prisma migrate deploy && next build"
   ```
4. Faça redeploy

**Opção C - Via Railway CLI:**

```bash
# Instalar CLI
npm install -g @railway/cli

# Login
railway login --browserless

# Quando pedir o token, cole:
951ebe8d-266c-41f4-9950-8a906b4dc083

# Link projeto
railway link

# Aplicar migrações
railway run npx prisma migrate deploy
```

---

## 🔍 Verificar Migrações

### Ver status das migrações:

```bash
export DATABASE_URL="postgresql://postgres:kKfhSSRlDNDqXKOiyREVJfCZYyDcGthc@metro.proxy.rlwy.net:44511/railway"
npx prisma migrate status
```

### Ver dados no banco:

```bash
# Prisma Studio
export DATABASE_URL="postgresql://postgres:kKfhSSRlDNDqXKOiyREVJfCZYyDcGthc@metro.proxy.rlwy.net:44511/railway"
npx prisma studio
```

Ou via Railway Dashboard:
- https://railway.app → Seu Projeto → PostgreSQL → **Data**

---

## 📋 Checklist Completo:

- [ ] Banco de dados Railway criado ✅
- [ ] DATABASE_URL obtida ✅
- [ ] Secrets gerados ✅
- [ ] Migrações aplicadas no banco Railway ⏳ (faça isso agora!)
- [ ] Variáveis adicionadas no Vercel ⏳
- [ ] Deploy feito no Vercel ⏳
- [ ] Build passou sem erros ⏳
- [ ] Aplicação funcionando ⏳

---

## 🎯 Próximo Passo AGORA:

**Execute o script para aplicar as migrações:**

```bash
chmod +x apply-migrations.sh
./apply-migrations.sh
```

**Depois:**

1. Adicione as variáveis no Vercel (ver `VERCEL_ENV_VARIABLES.txt`)
2. Faça redeploy
3. Sua aplicação estará 100% em produção! 🚀

---

## ❓ Troubleshooting

### Erro: "Can't reach database server"

```bash
# Teste a conexão primeiro:
export DATABASE_URL="postgresql://postgres:kKfhSSRlDNDqXKOiyREVJfCZYyDcGthc@metro.proxy.rlwy.net:44511/railway"
npx prisma db pull
```

### Erro: "Failed to fetch engine"

```bash
# Use estas flags:
export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
npx prisma migrate deploy
```

### Erro: "Authentication failed"

Verifique se a senha está correta:
- Password: `kKfhSSRlDNDqXKOiyREVJfCZYyDcGthc`
- Não deve ter espaços ou caracteres extras

---

**Criado em:** 2025-12-27
**Status:** Pronto para aplicar migrações 🚀
