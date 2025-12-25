# Testing Guide - UI-JSON Visualizer

## 📋 Visão Geral

Este projeto possui uma suite completa de testes unitários cobrindo as funcionalidades críticas do sistema, com foco especial em segurança e integridade de dados.

## 🚀 Como Executar os Testes

### Instalação das Dependências

```bash
npm install
```

### Executar Todos os Testes

```bash
npm test
```

### Executar Testes em Modo Watch (desenvolvimento)

```bash
npm run test:watch
```

### Executar Testes com Coverage

```bash
npm run test:coverage
```

## 📊 Cobertura de Testes

### Arquivos Testados

| Arquivo | Testes | Coverage | Status |
|---------|--------|----------|--------|
| `src/lib/encryption.ts` | 35+ | ~100% | ✅ |
| `src/actions/database-connections.ts` | 50+ | ~95% | ✅ |
| `src/actions/admin.ts` | 40+ | ~95% | ✅ |

**Total:** 125+ testes unitários

### Objetivos de Coverage

```json
{
  "branches": 50,
  "functions": 50,
  "lines": 50,
  "statements": 50
}
```

**Meta:** Atingir 80% de coverage em todas as métricas.

## 🧪 Suite de Testes

### 1. encryption.ts (`src/lib/__tests__/encryption.test.ts`)

**Objetivo:** Garantir segurança e integridade da criptografia AES-256.

**Cenários Testados:**

#### Função `encrypt()`
- ✅ Criptografa strings corretamente
- ✅ Produz outputs diferentes para mesma entrada (IV randômico)
- ✅ Lida com strings vazias
- ✅ Lida com caracteres especiais: `!@#$%^&*()`
- ✅ Lida com caracteres unicode: `密码 пароль كلمة السر 🔐`
- ✅ Lida com strings muito longas (10.000+ caracteres)

#### Função `decrypt()`
- ✅ Decripta strings criptografadas corretamente
- ✅ Lida com decriptação de string vazia
- ✅ Lança erro para formato inválido
- ✅ Lança erro para dados corrompidos
- ✅ Mantém integridade de objetos JSON complexos

#### Round-trip Tests
- ✅ Mantém integridade em 100 ciclos de encrypt/decrypt
- ✅ Funciona com diferentes tipos de dados como string

#### Função `maskPassword()`
- ✅ Mascara senhas curtas (≤4 chars) → `••••`
- ✅ Mascara senhas médias mostrando primeiro/últimos 2 chars
- ✅ Mascara senhas longas corretamente
- ✅ Lida com strings vazias
- ✅ Lida com unicode

#### Testes de Segurança
- ✅ Não expõe plaintext em mensagens de erro
- ✅ Não revela tamanho do texto original
- ✅ Lida com SQL injection attempts
- ✅ Lida com XSS attempts

**Exemplo de Execução:**
```bash
npm test -- encryption.test.ts
```

### 2. database-connections.ts (`src/actions/__tests__/database-connections.test.ts`)

**Objetivo:** Garantir segurança e funcionalidade de operações de banco de dados.

**Cenários Testados:**

#### `getUserDatabaseConnections()`
- ✅ Retorna todas as conexões do usuário
- ✅ Lança erro se não autenticado
- ✅ Retorna array vazio se sem conexões
- ✅ Mascara senhas no retorno

#### `getDatabaseConnection(id)`
- ✅ Retorna conexão específica
- ✅ Lança erro se não encontrada
- ✅ Previne acesso a conexões de outros usuários

#### `createDatabaseConnection(data)`
- ✅ Cria nova conexão com sucesso
- ✅ Criptografa senha antes de salvar
- ✅ Valida campos obrigatórios
- ✅ Valida número da porta
- ✅ Lida com erros de criação

#### `updateDatabaseConnection(data)`
- ✅ Atualiza conexão existente
- ✅ Lança erro se não encontrada
- ✅ Previne atualização de conexões de outros usuários
- ✅ Não atualiza senha se não fornecida
- ✅ Criptografa nova senha se fornecida

#### `deleteDatabaseConnection(id)`
- ✅ Deleta conexão com sucesso
- ✅ Lança erro se não encontrada
- ✅ Previne deleção de conexões de outros usuários

#### `testDatabaseConnection(id)`
- ✅ Testa conexão válida com sucesso
- ✅ Lida com falhas de conexão
- ✅ Lança erro se conexão não encontrada
- ✅ Atualiza timestamp lastTestedAt

#### `testConnectionBeforeCreate(data)`
- ✅ Testa conexão antes de criar
- ✅ Retorna erro em falha de conexão
- ✅ Valida dados de conexão

#### Authorization
- ✅ Requer autenticação para todas as operações

**Mocks Utilizados:**
- Prisma Client
- PostgreSQL Pool (pg)
- Next.js auth
- Next.js cache (revalidatePath)

**Exemplo de Execução:**
```bash
npm test -- database-connections.test.ts
```

### 3. admin.ts (`src/actions/__tests__/admin.test.ts`)

**Objetivo:** Garantir segurança de operações administrativas.

**Cenários Testados:**

#### `isUserAdmin()`
- ✅ Retorna true para admin
- ✅ Retorna false para usuário regular
- ✅ Retorna false se não autenticado
- ✅ Retorna false se usuário não encontrado

#### `getAllUsers()`
- ✅ Retorna todos os usuários para admin
- ✅ Lança erro se não for admin
- ✅ Lança erro se não autenticado
- ✅ Lida com lista vazia

#### `getAllApps()`
- ✅ Retorna todos os apps para admin
- ✅ Lança erro se não for admin

#### `getPlatformStats()`
- ✅ Retorna estatísticas da plataforma
- ✅ Calcula intervalos de data corretamente
- ✅ Lança erro se não for admin
- ✅ Lida com stats zerados

#### `toggleUserAdmin(userId)`
- ✅ Alterna status de admin
- ✅ **Previne auto-demoção** (segurança crítica)
- ✅ Lança erro se usuário não encontrado
- ✅ Lança erro se não for admin
- ✅ Faz demotion de outros admins

#### `deleteUser(userId)`
- ✅ Deleta usuário com sucesso
- ✅ **Previne auto-deleção** (segurança crítica)
- ✅ Lança erro se não for admin
- ✅ Lida com cascade delete

#### Security Tests
- ✅ Requer admin para todas as operações
- ✅ **Previne privilege escalation**
- ✅ Valida existência de sessão

#### Edge Cases
- ✅ Lida com listas vazias
- ✅ Lida com stats zerados

**Exemplo de Execução:**
```bash
npm test -- admin.test.ts
```

## 🔧 Configuração

### jest.config.mjs

```javascript
{
  testEnvironment: 'jest-environment-node',
  preset: 'ts-jest',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  }
}
```

### jest.setup.js

Mock de variáveis de ambiente para testes:

```javascript
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars!'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-purposes-only'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
```

## 📈 Métricas de Qualidade

### Velocidade
- ⚡ Testes rápidos: <5 segundos para suite completa
- 🔄 Watch mode otimizado para desenvolvimento

### Confiabilidade
- ✅ Determinísticos (sem flakiness)
- ✅ Isolados (cada teste é independente)
- ✅ Mocks bem definidos

### Manutenibilidade
- 📝 Testes bem documentados
- 🏗️ Estrutura clara (describe/it)
- 🎯 Um conceito por teste

## 🐛 Debugging de Testes

### Executar um teste específico

```bash
npm test -- --testNamePattern="should encrypt a string"
```

### Executar um arquivo específico

```bash
npm test -- encryption.test.ts
```

### Modo verbose

```bash
npm test -- --verbose
```

### Ver apenas testes falhando

```bash
npm test -- --onlyFailures
```

## 🔍 Análise de Coverage

Após executar `npm run test:coverage`, visualize o relatório em:

```
coverage/lcov-report/index.html
```

**Áreas com baixo coverage:**
- Componentes React (não testados ainda)
- Hooks customizados (useApps, useAction, etc.)
- Páginas Next.js

## 📝 Próximos Passos

### Testes Pendentes

1. **Hooks** (`src/hooks/`)
   - [ ] useApps.ts
   - [ ] useAction.ts
   - [ ] useDatabase.ts
   - [ ] useSession.ts

2. **Components** (`src/components/`)
   - [ ] Renderer.tsx
   - [ ] AIAssistant.tsx
   - [ ] DatabaseEditor.tsx
   - [ ] FlowBuilder.tsx

3. **Actions** (`src/actions/`)
   - [ ] apps.ts (CRUD básico)

4. **Integration Tests**
   - [ ] Fluxo completo de autenticação
   - [ ] Fluxo de criação de app
   - [ ] Fluxo de conexão de banco de dados

5. **E2E Tests** (Playwright/Cypress)
   - [ ] Jornada do usuário completa
   - [ ] Fluxos críticos de negócio

## 🛡️ Segurança nos Testes

### Dados Sensíveis
- ✅ Senhas mockadas
- ✅ Chaves de criptografia de teste
- ✅ URLs de banco mockadas
- ✅ Nenhum dado real utilizado

### Isolamento
- ✅ Testes não afetam banco de dados real
- ✅ Mocks para todas as integrações externas
- ✅ Estado limpo entre testes (beforeEach)

## 📚 Recursos

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Next.js Testing](https://nextjs.org/docs/testing)

## 🤝 Contribuindo

Ao adicionar novos recursos:

1. ✅ Escreva testes primeiro (TDD recomendado)
2. ✅ Mantenha coverage acima de 80%
3. ✅ Documente casos de teste complexos
4. ✅ Use nomes descritivos para testes

---

**Última Atualização:** 2025-12-25
**Autor:** Claude (AI Assistant)
**Versão:** 1.0.0
