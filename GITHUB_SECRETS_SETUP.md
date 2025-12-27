# 🔐 GitHub Secrets - Guia de Configuração

## Secrets Necessários para CI/CD

### 1️⃣ OBRIGATÓRIO para Auto-Deploy

| Secret | Descrição | Como Obter |
|--------|-----------|------------|
| `VERCEL_TOKEN` | Token de deploy do Vercel | Vercel Dashboard → Settings → Tokens |

**⚠️ Sem este secret, o auto-deploy não funcionará**, mas os testes continuarão rodando normalmente.

---

## 📝 Como Configurar GitHub Secrets

### Passo a Passo

1. **Acesse o Repositório no GitHub**
   ```
   https://github.com/AbsonDev/ui-json
   ```

2. **Navegue para Settings**
   - Clique na aba **"Settings"** (canto superior direito)

3. **Acesse Secrets and Variables**
   - No menu lateral esquerdo, clique em **"Secrets and variables"**
   - Depois clique em **"Actions"**

4. **Adicione um Novo Secret**
   - Clique no botão **"New repository secret"**

5. **Preencha os Dados**
   - **Name:** `VERCEL_TOKEN`
   - **Secret:** (cole o token que você vai gerar no Vercel)
   - Clique em **"Add secret"**

---

## 🔧 Como Obter o VERCEL_TOKEN

### Opção 1: Via Dashboard Vercel (Recomendado)

1. **Acesse:** https://vercel.com/account/tokens

2. **Crie um Token**
   - Clique em **"Create Token"**
   - Nome: `GitHub Actions - UI-JSON`
   - Scope: **Full Account** (ou selecione apenas o projeto ui-json)
   - Clique em **"Create"**

3. **Copie o Token**
   - ⚠️ **IMPORTANTE:** Copie o token AGORA! Ele só aparece uma vez.
   - Guarde em um lugar seguro temporariamente

4. **Cole no GitHub Secrets**
   - Volte para GitHub → Settings → Secrets → Actions
   - Adicione como `VERCEL_TOKEN`

### Opção 2: Via CLI Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Gerar token (seguir instruções no browser)
vercel tokens create "GitHub Actions"
```

---

## ✅ Verificação

Após adicionar o secret:

1. **Confirme que o secret foi adicionado**
   - Vá em Settings → Secrets → Actions
   - Você deve ver: `VERCEL_TOKEN` (Updated X seconds ago)

2. **Teste com um commit**
   ```bash
   # Faça qualquer mudança pequena
   git commit --allow-empty -m "test: Trigger CI/CD pipeline"
   git push
   ```

3. **Veja a pipeline rodar**
   - Vá em Actions → CI/CD Pipeline
   - Todos os jobs devem aparecer

---

## 🎯 O Que Funciona COM e SEM Secrets

### ✅ SEM Secrets (Pipeline Básica)
- ✅ Lint & Type Check
- ✅ Unit Tests
- ✅ E2E Tests (podem falhar mas continuam)
- ✅ Build Validation
- ✅ Security Scan
- ❌ Deploy Staging (pula)
- ❌ Deploy Production (pula)

### ✅ COM Secrets (Pipeline Completa)
- ✅ Lint & Type Check
- ✅ Unit Tests
- ✅ E2E Tests
- ✅ Build Validation
- ✅ Security Scan
- ✅ **Deploy Staging** (funciona!)
- ✅ **Deploy Production** (funciona!)

---

## 🔍 Troubleshooting

### Erro: "Error: No token found"

**Causa:** VERCEL_TOKEN não configurado

**Solução:**
1. Gere o token no Vercel (passos acima)
2. Adicione como secret no GitHub
3. Faça um novo push

### Pipeline não roda

**Causa:** Workflow não encontrado

**Solução:**
1. Verifique que `.github/workflows/ci.yml` existe
2. Faça push para branch `main`, `develop` ou `claude/**`
3. Ou crie um Pull Request

### Deploy falha mesmo com token

**Causa:** Token sem permissões corretas

**Solução:**
1. Revogue o token antigo
2. Crie um novo com scope **Full Account**
3. Atualize o secret no GitHub

---

## 📊 Status da Pipeline SEM Secrets

A pipeline atual vai:
- ✅ **PASSAR** todos os testes básicos
- ⏭️ **PULAR** o deploy (sem erro, apenas não executa)
- 🟢 **Status Final:** SUCCESS (com avisos de deploy pulado)

Isso é **NORMAL e esperado** até você adicionar o VERCEL_TOKEN!

---

## 🚀 Resumo Rápido

**Para testar a pipeline AGORA (sem deploy):**
```bash
# Nada precisa fazer! A pipeline já vai rodar.
# Apenas push seu código
git push
```

**Para habilitar auto-deploy:**
1. Gere token no Vercel: https://vercel.com/account/tokens
2. Adicione no GitHub: Settings → Secrets → Actions → New secret
3. Nome: `VERCEL_TOKEN`, Valor: (cole o token)
4. Pronto! Próximo push vai fazer deploy automático

---

**Última atualização:** 2025-12-27
