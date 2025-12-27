# Reconfiguração do Vercel - Branch Correta

## Problema Atual

O Vercel está configurado para buildar da branch `claude/system-improvements-review-zH7DC`, mas as correções do erro de build estão na branch `claude/review-production-readiness-lDz7h`.

## Solução: Reconfigurar Branch no Vercel

### Passo 1: Acessar Configurações do Projeto

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto **ui-json** (ou nome do projeto)
3. Vá em **Settings** (ícone de engrenagem)

### Passo 2: Configurar Git Branch

1. No menu lateral, clique em **Git**
2. Na seção **Production Branch**, você verá a branch atual configurada
3. Altere para: `claude/review-production-readiness-lDz7h`

### Passo 3: Redeployar

**Opção A - Redeploy Automático:**
1. Vá em **Deployments**
2. Encontre o último deployment
3. Clique nos 3 pontos (...) → **Redeploy**
4. Marque a opção **Use existing Build Cache** (desmarque se quiser build limpo)
5. Clique em **Redeploy**

**Opção B - Trigger via Push:**
```bash
# Se preferir forçar um novo deployment via push
git checkout claude/review-production-readiness-lDz7h
git commit --allow-empty -m "chore: Trigger Vercel redeploy"
git push origin claude/review-production-readiness-lDz7h
```

## Correções Incluídas na Branch

A branch `claude/review-production-readiness-lDz7h` contém:

### ✅ Commit: a5fc819
```
fix: Update @testing-library/react to v16 for React 19 compatibility
```

**Mudanças:**
1. `package.json`: `@testing-library/react` de `^14.2.1` → `^16.1.0`
2. `vercel.json`: Adicionado `"installCommand": "npm install --legacy-peer-deps"`

## Verificação do Build

Após o redeploy, o build deve passar com sucesso. Você verá:

```
✓ Installing dependencies...
  Running "npm install --legacy-peer-deps"

✓ No peer dependency conflicts

✓ Building...
  All tests passed
```

## Alternativa: Configurar Branch via Vercel CLI

Se preferir usar a CLI:

```bash
# Instalar Vercel CLI (se ainda não tiver)
npm i -g vercel

# Login
vercel login

# Link do projeto
vercel link

# Fazer deploy da branch específica
vercel --prod --git-branch claude/review-production-readiness-lDz7h
```

## Configuração de Auto-Deploy (Opcional)

Para que o Vercel faça deploy automático de novas branches `claude/*`:

1. **Settings** → **Git**
2. Em **Deployment Protection**, configure:
   - Production Branch: `main` ou `master`
   - Preview Branches: `All branches` ou adicione pattern `claude/*`

Isso permitirá que futuras branches Claude sejam automaticamente deployadas como preview.

## Troubleshooting

### Se o build ainda falhar:

1. **Limpar Build Cache:**
   - Settings → General → Build & Development Settings
   - Clique em "Clear Build Cache"
   - Redeploy

2. **Verificar Environment Variables:**
   - Settings → Environment Variables
   - Certifique-se que todas as variáveis necessárias estão configuradas

3. **Ver logs completos:**
   - Deployments → Clique no deployment → Build Logs
   - Procure por erros específicos

## Próximos Passos

Após configurar a branch correta:

1. ✅ Vercel irá buildar da branch `claude/review-production-readiness-lDz7h`
2. ✅ O erro de peer dependency do React 19 estará corrigido
3. ✅ O build deve passar com sucesso
4. 🎯 Você poderá criar um PR para merge na master quando estiver pronto

---

**Status Atual:**
- Branch com correções: `claude/review-production-readiness-lDz7h` ✅ (pushed to remote)
- Último commit: `a5fc819`
- Arquivos corrigidos: `package.json`, `vercel.json`
