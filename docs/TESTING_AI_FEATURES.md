# 🧪 Testes de IA - Guia Completo

Este documento descreve todos os testes implementados para as funcionalidades de IA nos apps dos clientes.

---

## 📋 Cobertura de Testes

### ✅ Testes Implementados

| Categoria | Arquivo | Testes | Descrição |
|---|---|---|---|
| **Componentes** | `src/components/__tests__/AIComponents.test.tsx` | 25 | Testes unitários dos componentes React |
| **API** | `src/app/api/ai/execute/__tests__/route.test.ts` | 15 | Testes do endpoint de API |
| **Handler** | `src/lib/actions/handlers/__tests__/ai-handler.test.ts` | 13 | Testes do action handler |
| **E2E** | `e2e/ai-components.spec.ts` | 12 | Testes de integração completa |
| **TOTAL** | - | **65** | - |

---

## 🚀 Como Executar os Testes

### Pré-requisitos

```bash
npm install
```

### Testes Unitários (Jest)

**Executar todos os testes:**
```bash
npm test
```

**Executar apenas testes de IA:**
```bash
npm test -- AIComponents
npm test -- ai-handler
npm test -- execute/route
```

**Com coverage:**
```bash
npm test -- --coverage
```

**Watch mode:**
```bash
npm test -- --watch
```

### Testes E2E (Playwright)

**Executar todos os testes E2E:**
```bash
npm run test:e2e
```

**Executar apenas testes de IA:**
```bash
npx playwright test ai-components
```

**Com UI interativa:**
```bash
npm run test:e2e:ui
```

**Com navegador visível:**
```bash
npm run test:e2e:headed
```

**Debug mode:**
```bash
npm run test:e2e:debug
```

---

## 📊 Detalhamento dos Testes

### 1. Testes de Componentes (`AIComponents.test.tsx`)

#### RenderAIChat (9 testes)
- ✅ Renderiza com mensagem de boas-vindas
- ✅ Renderiza input e botão de enviar
- ✅ Envia mensagem quando botão clicado
- ✅ Exibe mensagens do usuário e da IA
- ✅ Mostra erro quando API falha
- ✅ Limpa input após enviar
- ✅ Envia mensagem ao pressionar Enter
- ✅ Mantém histórico de conversas
- ✅ Limita número de mensagens

#### RenderAIAssistant (8 testes)
- ✅ Renderiza botão com texto padrão
- ✅ Renderiza botão com texto customizado
- ✅ Chama API com placeholders substituídos
- ✅ Exibe resultado após análise
- ✅ Chama onFieldChange com resultado
- ✅ Mostra estado de loading
- ✅ Mostra erro em falha
- ✅ Desabilita botão durante processamento

#### RenderAIAnalyzer (8 testes)
- ✅ Renderiza botão de análise
- ✅ Chama API com prompt de sentimento
- ✅ Exibe resultado da análise
- ✅ Chama onFieldChange com resultado
- ✅ Usa prompt correto para categoria
- ✅ Usa prompt correto para resumo
- ✅ Auto-analisa quando configurado
- ✅ Respeita debounce em auto-análise

### 2. Testes de API (`route.test.ts`)

#### POST /api/ai/execute (12 testes)
- ✅ Retorna 400 se appId ausente
- ✅ Retorna 400 se prompt ausente
- ✅ Retorna 404 se app não encontrado
- ✅ Retorna 403 se app privado e usuário não é dono
- ✅ Retorna 429 se limite atingido
- ✅ Executa IA com sucesso para chat
- ✅ Suporta diferentes aiActions
- ✅ Loga execução com sucesso
- ✅ Loga execução com falha
- ✅ Cria novo registro de limite se não existir
- ✅ Incrementa contador de uso
- ✅ Usa persona fornecida

#### GET /api/ai/execute (3 testes)
- ✅ Retorna 401 se não autenticado
- ✅ Retorna 404 se usuário não encontrado
- ✅ Retorna limites atuais para usuário

### 3. Testes de Handler (`ai-handler.test.ts`)

- ✅ Substitui placeholders no prompt
- ✅ Envia aiAction correto
- ✅ Inclui persona se fornecida
- ✅ Inclui dados de contexto
- ✅ Salva resultado no campo especificado
- ✅ Executa onSuccess se fornecido
- ✅ Executa onError em falha
- ✅ Mostra popup de erro padrão
- ✅ Trata erros de rede
- ✅ Não executa sem contexto de app
- ✅ Substitui múltiplos placeholders
- ✅ Passa nome do app como appId
- ✅ Preserva dados existentes do formState

### 4. Testes E2E (`ai-components.spec.ts`)

- ✅ AIChat funciona end-to-end
- ✅ AIAssistant funciona end-to-end
- ✅ AIAnalyzer funciona end-to-end
- ✅ Ação AI em botão funciona
- ✅ Trata erros de API graciosamente
- ✅ Trata erros de rede
- ✅ Mantém histórico de conversa
- ✅ Substitui múltiplos placeholders
- ✅ Auto-analisa em input
- ✅ Respeita limites de execução
- ✅ Mostra mensagens de upgrade
- ✅ Funciona com diferentes aiActions

---

## 🎯 Cenários de Teste Principais

### Cenário 1: Chat Completo

```typescript
// Setup
- Usuário abre app com AIChat
- Sistema mostra mensagem de boas-vindas

// Ação
- Usuário digita "Preciso de ajuda"
- Usuário pressiona Enter

// Verificação
- Mensagem aparece no histórico
- API é chamada com prompt correto
- Resposta da IA aparece
- Input é limpo
```

### Cenário 2: Triagem Médica

```typescript
// Setup
- Usuário abre tela de triagem
- Campos: sintomas, idade

// Ação
- Usuário preenche "Dor no peito" e "45"
- Usuário clica "Analisar Sintomas"

// Verificação
- Loading state é mostrado
- API recebe prompt com valores substituídos
- Sugestão aparece: "Cardiologia"
- Campo de saída é preenchido
```

### Cenário 3: Análise de Sentimento

```typescript
// Setup
- Usuário abre formulário de feedback
- Campo com auto-análise ativada

// Ação
- Usuário digita "Produto excelente!"
- Aguarda 1 segundo (debounce)

// Verificação
- Análise é disparada automaticamente
- Resultado "POSITIVO" aparece
- Campo resultField é atualizado
```

### Cenário 4: Limite Atingido

```typescript
// Setup
- Usuário com plano FREE (100 calls/mês)
- Já usou 100 calls

// Ação
- Usuário tenta usar IA novamente

// Verificação
- API retorna 429
- Mensagem de erro é exibida
- Sugestão de upgrade aparece
```

---

## 🔍 Mocks e Fixtures

### Mock de API Bem-Sucedida

```typescript
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({
    result: 'AI response',
    tokensUsed: 50,
    responseTime: 1000,
  }),
});
```

### Mock de API com Erro

```typescript
global.fetch = jest.fn().mockResolvedValue({
  ok: false,
  json: async () => ({
    error: 'Limite atingido',
    upgradeMessage: 'Faça upgrade para PRO',
  }),
});
```

### Mock do Gemini

```typescript
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => 'Gemini response',
          usageMetadata: { totalTokenCount: 50 },
        },
      }),
    }),
  })),
}));
```

---

## 📈 Cobertura Esperada

### Alvo de Cobertura

```
Statements   : 80%
Branches     : 75%
Functions    : 80%
Lines        : 80%
```

### Verificar Cobertura

```bash
npm test -- --coverage --watchAll=false
```

### Relatório de Cobertura

Após executar com `--coverage`, abra:
```
open coverage/lcov-report/index.html
```

---

## 🐛 Debug de Testes

### Jest

**Executar um teste específico:**
```bash
npm test -- -t "should send message when button clicked"
```

**Com logs detalhados:**
```bash
npm test -- --verbose
```

**Debug no VS Code:**
Adicione ao `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Playwright

**Com traces:**
```bash
npx playwright test --trace on
```

**Ver trace:**
```bash
npx playwright show-trace trace.zip
```

**Screenshots em falhas:**
```bash
npx playwright test --screenshot on
```

---

## ✅ Checklist de Testes

Antes de fazer deploy, certifique-se:

- [ ] Todos os testes unitários passam
- [ ] Todos os testes E2E passam
- [ ] Cobertura > 80%
- [ ] Sem warnings no console
- [ ] Testes de erro cobertos
- [ ] Testes de limites cobertos
- [ ] Testes de loading states cobertos
- [ ] Mocks corretos
- [ ] Fixtures realistas

---

## 🚨 Problemas Comuns

### Testes Falhando por Timeout

**Solução:**
```typescript
jest.setTimeout(10000); // 10 segundos
```

### Fetch não definido

**Solução:**
```typescript
global.fetch = jest.fn();
```

### Prisma não mockado

**Solução:**
```typescript
jest.mock('@/lib/prisma', () => ({
  prisma: {
    // mocks...
  },
}));
```

### Testes E2E lentos

**Solução:**
```bash
# Executar em paralelo
npx playwright test --workers=4
```

---

## 📚 Recursos

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Testes completos = Confiança no deploy!** ✅
