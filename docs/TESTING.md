# Guia de Testes - Sistema de Export Mobile

Documentação completa sobre os testes unitários do sistema de export mobile.

## 📋 Visão Geral

O sistema de export mobile possui cobertura de testes para:
- **MobileBuilder Service** - Lógica de geração de builds
- **API Routes** - Endpoints de export e listagem de builds
- **Componentes React** - MobileExportDialog e BuildHistory

## 🗂️ Estrutura de Testes

```
src/
├── lib/mobile-builder/
│   ├── MobileBuilder.ts
│   └── __tests__/
│       └── MobileBuilder.test.ts
│
├── app/api/projects/[id]/export/
│   ├── route.ts
│   └── __tests__/
│       └── route.test.ts
│
├── components/mobile-export/
│   ├── MobileExportDialog.tsx
│   ├── BuildHistory.tsx
│   └── __tests__/
│       ├── MobileExportDialog.test.tsx
│       └── BuildHistory.test.tsx
│
└── __tests__/
    ├── setup.ts
    └── helpers/
        └── mobile-builder.ts
```

## 🧪 Executando os Testes

### Todos os testes

```bash
npm test
```

### Testes específicos

```bash
# MobileBuilder
npm test MobileBuilder.test

# API Routes
npm test route.test

# Componentes
npm test MobileExportDialog.test
npm test BuildHistory.test
```

### Modo watch

```bash
npm run test:watch
```

### Cobertura de código

```bash
npm run test:coverage
```

## 📊 Cobertura de Testes

### MobileBuilder Service (MobileBuilder.test.ts)

**Cobertura**: ~85%

#### Casos testados:

✅ **Inicialização**
- Criação de diretórios necessários
- Tratamento de erros de permissão

✅ **Geração de arquivos**
- HTML com configuração do projeto
- CSS responsivo
- JavaScript com inicialização
- Inclusão de meta tags e descrição

✅ **Build ID**
- Geração de IDs únicos
- Inclusão de timestamp

✅ **Projeto Capacitor**
- Criação de capacitor.config.json
- Criação de package.json
- Configuração correta de bundle ID

✅ **Builds por plataforma**
- Android debug (bundleDebug)
- Android release (bundleRelease)
- iOS (erro macOS requerido)
- Configuração de assinatura Android

✅ **Processo completo de build**
- Status inicial pending
- Criação de diretórios
- Geração de arquivos do projeto
- Sincronização Capacitor
- Tratamento de erros
- Timestamp de conclusão

✅ **Edge cases**
- Campos opcionais ausentes
- Nomes de projeto muito longos
- Caracteres especiais em bundle ID

### API Routes (route.test.ts)

**Cobertura**: ~90%

#### POST /api/projects/:id/export

✅ **Validação**
- Rejeita plataforma inválida
- Rejeita tipo de build inválido
- Rejeita config ausente/incompleto
- Valida campos obrigatórios (name, bundleId)

✅ **Builds bem-sucedidos**
- Cria registro no banco (pending)
- Inicializa MobileBuilder
- Atualiza status para building
- Chama buildProject com config correto
- Atualiza com resultado de sucesso
- Retorna buildId e downloadUrl
- Usa valores padrão quando não fornecidos

✅ **Builds com falha**
- Atualiza status para failed
- Salva mensagem de erro
- Define completedAt
- Retorna erro 500

#### GET /api/projects/:id/export

✅ **Listagem de builds**
- Retorna lista de builds do projeto
- Ordena por data descendente
- Retorna array vazio quando sem builds
- Trata erros de banco de dados

### MobileExportDialog (MobileExportDialog.test.tsx)

**Cobertura**: ~95%

#### Casos testados:

✅ **Renderização**
- Não renderiza quando fechado
- Renderiza todos os elementos quando aberto
- Botões de plataforma
- Seletor de tipo de build
- Inputs de configuração

✅ **Seleção de plataforma**
- Default Android
- Troca para iOS
- Exibe aviso iOS (macOS required)

✅ **Inputs de formulário**
- Alteração de bundle ID
- Alteração de versão
- Alteração de version code
- Alteração de descrição
- Alteração de tipo de build
- Aviso para release builds

✅ **Funcionalidade de export**
- Envia requisição POST correta
- Inclui dados corretos no body
- Desabilita botões durante build
- Mostra mensagem de sucesso
- Mostra mensagem de pending
- Mostra mensagem de erro
- Trata erros de rede
- Inicia download automaticamente

✅ **Controles do dialog**
- Fecha ao clicar em Cancelar
- Não fecha durante build
- Limpa erros em nova tentativa

### BuildHistory (BuildHistory.test.tsx)

**Cobertura**: ~92%

#### Casos testados:

✅ **Renderização**
- Não renderiza quando fechado
- Renderiza header e descrição

✅ **Estado de loading**
- Mostra indicador de carregamento
- Faz fetch ao montar
- Refaz fetch ao reabrir
- Refaz fetch quando appId muda

✅ **Estado vazio**
- Mensagem "Nenhum build realizado"
- Dica útil para criar primeiro build

✅ **Tratamento de erros**
- Exibe mensagem de erro
- Botão de retry
- Refaz fetch ao clicar em retry

✅ **Exibição de builds**
- Lista todos os builds
- Badges de plataforma (Android/iOS)
- Badges de status (success/failed/building)
- Tipo de build (debug/release)
- Bundle IDs
- Versões e version codes

✅ **Detalhes dos builds**
- Formatação de tamanho de arquivo (MB)
- Formatação de duração (minutos e segundos)
- Formatação de datas em português
- Mensagens de erro para builds falhados
- Timestamp de conclusão

✅ **Funcionalidade de download**
- Botão apenas para builds bem-sucedidos
- Link correto para download
- Atributo download presente

✅ **Indicadores de status**
- Ícone e cor para success
- Ícone e cor para failed
- Ícone animado para building

✅ **Footer**
- Contagem de builds (singular/plural)
- Botão fechar
- Callback onClose

## 🛠️ Helpers de Teste

### mobile-builder.ts

Fornece funções helper para criar mocks:

```typescript
import { mockProjectConfig, mockBuildRequest, mockBuildResult } from '@/__tests__/helpers/mobile-builder';

// Criar config mock
const config = mockProjectConfig({ name: 'My App' });

// Criar request mock
const request = mockBuildRequest({ platform: 'ios' });

// Criar result mock
const result = mockBuildResult({ status: 'failed' });

// Mocks de builds prontos
import { mockBuilds } from '@/__tests__/helpers/mobile-builder';
const successBuild = mockBuilds.success;
const failedBuild = mockBuilds.failed;

// Mocks de fetch
mockFetchSuccess({ builds: [mockBuilds.success] });
mockFetchError('Network error');
mockFetchNetworkError();
```

### setup.ts

Configuração global para todos os testes:
- Mock de window.matchMedia
- Mock de window.open
- Supressão de warnings do React
- Limpeza após cada teste

## 📝 Boas Práticas

### 1. Estrutura de Testes

```typescript
describe('ComponentName', () => {
  describe('feature group', () => {
    it('should do something specific', () => {
      // Arrange
      const mockData = createMock();

      // Act
      const result = doSomething(mockData);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### 2. Nomes Descritivos

✅ **Bom:**
```typescript
it('should show error message when API returns 500')
it('should disable submit button while building')
```

❌ **Ruim:**
```typescript
it('works')
it('test error')
```

### 3. Mock Mínimo

Mock apenas o necessário:

```typescript
// Bom
jest.mock('@/lib/prisma');

// Evite
jest.mock('fs');
jest.mock('path');
jest.mock('child_process');
// ... quando não necessário
```

### 4. Cleanup

Sempre limpe após os testes:

```typescript
afterEach(() => {
  jest.clearAllMocks();
});
```

### 5. Testes Assíncronos

Use waitFor para operações assíncronas:

```typescript
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

## 🐛 Debugging Testes

### Ver output do componente

```typescript
import { render, screen, debug } from '@testing-library/react';

render(<Component />);
screen.debug(); // Mostra HTML atual
```

### Testar um único teste

```typescript
it.only('should test this specific case', () => {
  // ...
});
```

### Skip de um teste

```typescript
it.skip('will not run this test', () => {
  // ...
});
```

### Verbose mode

```bash
npm test -- --verbose
```

## 📈 Métricas de Qualidade

### Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### Verificar coverage

```bash
npm run test:coverage
```

Relatório gerado em: `coverage/lcov-report/index.html`

## 🔄 CI/CD

Os testes rodam automaticamente em:
- Push para branch
- Pull requests
- Before merge

### Configuração GitHub Actions

```yaml
- name: Run tests
  run: npm test

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## 📚 Recursos Adicionais

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## ✅ Checklist de Testes

Antes de commitar:

- [ ] Todos os testes passando
- [ ] Coverage > 80%
- [ ] Testes para casos de sucesso
- [ ] Testes para casos de erro
- [ ] Testes para edge cases
- [ ] Mocks limpos após cada teste
- [ ] Nomes descritivos
- [ ] Documentação atualizada
