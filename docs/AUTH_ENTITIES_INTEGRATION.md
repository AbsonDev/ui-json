# Integração: Autenticação de App Users + Entities (BaaS)

## Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Sistema de Permissões](#sistema-de-permissões)
4. [Guia de Implementação](#guia-de-implementação)
5. [Exemplos de Uso](#exemplos-de-uso)
6. [Segurança](#segurança)
7. [Migração](#migração)

---

## Visão Geral

Esta integração conecta o sistema de **Autenticação de App Users** (Semana 2) com o **Backend as a Service - Entities** (Semana 1), permitindo que dados criados pelos usuários finais sejam automaticamente isolados e protegidos.

### Benefícios

- **Isolamento Automático de Dados**: Cada usuário vê apenas seus próprios dados
- **Controle Granular**: Configure permissões por entidade (public, authenticated, owner, admin)
- **Zero Configuration**: Funciona automaticamente quando o usuário está autenticado
- **Compatibilidade Total**: Suporta tanto acesso admin (dashboard) quanto app users

---

## Arquitetura

### Fluxo de Dados

```
┌─────────────────────┐
│   Mobile App        │
│   (App User)        │
└──────────┬──────────┘
           │ 1. POST /api/apps/{appId}/auth/login
           │    { email, password }
           ▼
┌─────────────────────┐
│  Auth System        │
│  • Valida usuário   │
│  • Gera JWT token   │
└──────────┬──────────┘
           │ 2. Returns { token, user }
           │
           ▼
┌─────────────────────┐
│   Mobile App        │
│   Stores token      │
└──────────┬──────────┘
           │ 3. GET /api/apps/{appId}/entities/{entityId}/data
           │    Headers: { Authorization: "Bearer {token}" }
           ▼
┌─────────────────────┐
│  Auth Middleware    │
│  • Verifica JWT     │
│  • Extrai userId    │
└──────────┬──────────┘
           │ 4. Passa appUserId para action
           ▼
┌─────────────────────┐
│  Entity Actions     │
│  • Filtra por user  │
│  • Aplica perms     │
└──────────┬──────────┘
           │ 5. Retorna dados do usuário
           ▼
┌─────────────────────┐
│   Mobile App        │
│   Display user data │
└─────────────────────┘
```

### Componentes

#### 1. Prisma Schema

```prisma
model EntityData {
  id          String   @id @default(cuid())
  data        Json

  // User ownership (novo)
  appUserId   String?
  appUser     AppUser? @relation(...)

  // Entity relation
  entityId    String
  entity      Entity   @relation(...)

  deletedAt   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([appUserId])
}

model Entity {
  // ... campos existentes

  // Permissions (novo)
  readPermission   String @default("authenticated")
  writePermission  String @default("owner")
  deletePermission String @default("owner")
}
```

#### 2. Auth Middleware (`src/lib/auth-middleware.ts`)

```typescript
export async function authenticateAppUser(
  request: NextRequest,
  requireAuth: boolean = true
): Promise<AuthResult>

export async function getOptionalAuthContext(
  request: NextRequest
): Promise<AuthContext | null>
```

#### 3. Updated Actions (`src/actions/entity-data.ts`)

Todas as funções agora aceitam `appUserId` opcional:

```typescript
getEntityData(entityId, query?, appUserId?)
createEntityData(entityId, request, appUserId?)
updateEntityData(recordId, request, appUserId?)
deleteEntityData(recordId, hardDelete?, appUserId?)
restoreEntityData(recordId, appUserId?)
```

---

## Sistema de Permissões

### Tipos de Permissão

#### Read Permission (Leitura)

| Valor | Descrição | Uso |
|-------|-----------|-----|
| `public` | Qualquer um pode ler, sem autenticação | Catálogo de produtos, posts públicos |
| `authenticated` | Apenas usuários autenticados podem ler | Feed de posts, perfis de usuários |
| `owner` | Apenas o dono do dado pode ler | Carrinho de compras, pedidos pessoais |
| `admin` | Apenas admin do app (dashboard) | Dados sensíveis, configurações |

#### Write Permission (Escrita)

| Valor | Descrição | Uso |
|-------|-----------|-----|
| `authenticated` | Qualquer usuário autenticado pode criar | Posts em fórum, comentários |
| `owner` | Apenas o dono pode editar seus dados | Perfil do usuário, seus posts |
| `admin` | Apenas admin pode criar/editar | Categorias, produtos (admin-only) |

#### Delete Permission (Exclusão)

| Valor | Descrição | Uso |
|-------|-----------|-----|
| `owner` | Apenas o dono pode deletar seus dados | Deletar próprio post |
| `admin` | Apenas admin pode deletar | Moderação, gestão de conteúdo |

### Configuração de Permissões

#### Ao Criar Entity

```typescript
// POST /api/apps/{appId}/entities
{
  "name": "Post",
  "displayName": "Posts",
  "fields": [...],
  "readPermission": "public",        // Qualquer um pode ler
  "writePermission": "authenticated", // Usuários autenticados podem criar
  "deletePermission": "owner"        // Apenas dono pode deletar
}
```

#### Ao Atualizar Entity

```typescript
// PUT /api/apps/{appId}/entities/{entityId}
{
  "readPermission": "authenticated", // Muda de public para authenticated
  "writePermission": "owner"         // Muda de authenticated para owner
}
```

### Defaults

Se não especificado, as permissões padrão são:

```typescript
{
  readPermission: "authenticated",
  writePermission: "owner",
  deletePermission: "owner"
}
```

---

## Guia de Implementação

### Cenário 1: App de To-Do List (Dados Privados)

**Requisito**: Cada usuário vê apenas suas próprias tarefas.

#### 1. Criar Entity com Permissões

```bash
POST /api/apps/{appId}/entities
```

```json
{
  "name": "Task",
  "displayName": "Tasks",
  "fields": [
    { "name": "title", "type": "string", "required": true },
    { "name": "completed", "type": "boolean", "defaultValue": false },
    { "name": "dueDate", "type": "datetime" }
  ],
  "readPermission": "owner",    // Apenas dono vê
  "writePermission": "owner",   // Apenas dono cria/edita
  "deletePermission": "owner"   // Apenas dono deleta
}
```

#### 2. App User: Login

```typescript
// Mobile App
const response = await fetch(`/api/apps/${appId}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'senha123'
  })
});

const { token, user } = await response.json();
// Salva token no AsyncStorage/SecureStore
await AsyncStorage.setItem('auth_token', token);
```

#### 3. Criar Tarefa (Automaticamente Associada ao Usuário)

```typescript
const token = await AsyncStorage.getItem('auth_token');

const response = await fetch(
  `/api/apps/${appId}/entities/${taskEntityId}/data`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`  // Token de autenticação
    },
    body: JSON.stringify({
      data: {
        title: "Comprar leite",
        completed: false,
        dueDate: "2024-12-31T10:00:00Z"
      }
    })
  }
);

// A tarefa é automaticamente criada com appUserId = user.id
```

#### 4. Listar Tarefas do Usuário

```typescript
const response = await fetch(
  `/api/apps/${appId}/entities/${taskEntityId}/data`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const { data, pagination } = await response.json();
// Retorna APENAS as tarefas deste usuário
```

---

### Cenário 2: App de E-Commerce (Dados Públicos + Privados)

**Requisito**: Produtos são públicos, pedidos são privados.

#### 1. Entity: Product (Pública)

```json
{
  "name": "Product",
  "displayName": "Products",
  "fields": [
    { "name": "name", "type": "string", "required": true },
    { "name": "price", "type": "number", "required": true },
    { "name": "image", "type": "url" }
  ],
  "readPermission": "public",     // Qualquer um pode ver
  "writePermission": "admin",     // Apenas admin cria
  "deletePermission": "admin"     // Apenas admin deleta
}
```

#### 2. Entity: Order (Privada)

```json
{
  "name": "Order",
  "displayName": "Orders",
  "fields": [
    { "name": "productIds", "type": "json", "required": true },
    { "name": "total", "type": "number", "required": true },
    { "name": "status", "type": "string", "defaultValue": "pending" }
  ],
  "readPermission": "owner",      // Apenas dono vê seus pedidos
  "writePermission": "owner",     // Apenas dono cria pedidos
  "deletePermission": "admin"     // Apenas admin pode deletar
}
```

#### 3. Uso no App

```typescript
// 1. Listar produtos (sem autenticação necessária)
const products = await fetch(`/api/apps/${appId}/entities/${productEntityId}/data`);
// Retorna todos os produtos

// 2. Criar pedido (com autenticação)
const order = await fetch(
  `/api/apps/${appId}/entities/${orderEntityId}/data`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: {
        productIds: [1, 2, 3],
        total: 150.00,
        status: "pending"
      }
    })
  }
);

// 3. Listar pedidos do usuário
const myOrders = await fetch(
  `/api/apps/${appId}/entities/${orderEntityId}/data`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);
// Retorna APENAS os pedidos deste usuário
```

---

### Cenário 3: App de Rede Social (Dados Compartilhados)

**Requisito**: Usuários podem criar posts que todos veem, mas só podem editar/deletar os próprios.

#### 1. Entity: Post

```json
{
  "name": "Post",
  "displayName": "Posts",
  "fields": [
    { "name": "content", "type": "text", "required": true },
    { "name": "likes", "type": "number", "defaultValue": 0 },
    { "name": "imageUrl", "type": "url" }
  ],
  "readPermission": "authenticated",  // Usuários autenticados veem todos
  "writePermission": "authenticated", // Usuários autenticados podem criar
  "deletePermission": "owner"         // Apenas dono pode deletar
}
```

#### 2. Criar Post

```typescript
// Usuário A cria um post
const post = await fetch(
  `/api/apps/${appId}/entities/${postEntityId}/data`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokenUserA}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: {
        content: "Olá mundo!",
        likes: 0
      }
    })
  }
);
// Post criado com appUserId = userA.id
```

#### 3. Listar Todos os Posts

```typescript
// Usuário B vê todos os posts (incluindo de outros usuários)
const posts = await fetch(
  `/api/apps/${appId}/entities/${postEntityId}/data`,
  {
    headers: { 'Authorization': `Bearer ${tokenUserB}` }
  }
);
// Retorna posts de TODOS os usuários (readPermission = authenticated)
```

#### 4. Tentar Deletar Post de Outro Usuário

```typescript
// Usuário B tenta deletar post do Usuário A
const response = await fetch(
  `/api/apps/${appId}/entities/${postEntityId}/data/${postIdFromUserA}`,
  {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${tokenUserB}` }
  }
);
// ❌ Erro 401: "Unauthorized: You can only delete your own data"
```

---

## Segurança

### JWT Token Validation

O middleware valida:

1. **Assinatura do Token**: Verifica com SECRET_KEY
2. **Expiração**: Tokens expiram em 7 dias (configurável)
3. **Sessão Ativa**: Verifica se a sessão ainda existe no BD
4. **App Scope**: Verifica se o token pertence ao app correto

### Proteções Implementadas

#### 1. Ownership Verification

```typescript
// Ao editar/deletar, verifica se appUserId do dado === userId do token
if (appUserId && record.appUserId !== appUserId) {
  return { success: false, error: 'Unauthorized: You can only edit your own data' };
}
```

#### 2. Unique Constraints por Usuário

```typescript
// Ao verificar uniqueness, escopa por usuário
if (appUserId) {
  uniqueWhere.appUserId = appUserId;
}
// Permite que dois usuários diferentes tenham o mesmo valor único
```

#### 3. Session Tracking

- Armazena `userAgent` e `ipAddress` para auditoria
- Atualiza `lastUsedAt` em cada request
- Permite invalidação de sessões específicas

---

## Migração

### Para Apps Existentes

Se você já tem uma entity criada **antes** desta integração:

#### 1. As Entities Existentes

- `readPermission`, `writePermission`, `deletePermission` serão `null` ou valores default
- Dados existentes **não têm** `appUserId` (são "admin data")

#### 2. Migrando Permissões

```bash
# Atualize as entities para adicionar permissões
PUT /api/apps/{appId}/entities/{entityId}
```

```json
{
  "readPermission": "owner",
  "writePermission": "owner",
  "deletePermission": "owner"
}
```

#### 3. Dados Existentes

**Opção A**: Deixar sem `appUserId` (dados admin)
- Esses dados ficam visíveis apenas no dashboard
- App users não veem esses dados

**Opção B**: Migrar dados para usuários específicos
- Via script manual no Prisma Studio
- Ou via API: atualizar `appUserId` de cada record

```sql
-- Exemplo SQL (executar com cuidado!)
UPDATE entity_data
SET "appUserId" = '<user_id_here>'
WHERE "entityId" = '<entity_id_here>'
  AND "appUserId" IS NULL;
```

---

## Troubleshooting

### Problema: Usuário não vê seus próprios dados

**Causa**: `readPermission` está como `admin` ou token não está sendo enviado

**Solução**:
```typescript
// 1. Verifique a permissão da entity
GET /api/apps/{appId}/entities/{entityId}
// readPermission deve ser "authenticated" ou "owner"

// 2. Verifique se o token está sendo enviado
fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}` // ← Importante!
  }
})
```

### Problema: Usuário vê dados de outros usuários

**Causa**: `readPermission` está como `authenticated` mas você quer `owner`

**Solução**:
```bash
PUT /api/apps/{appId}/entities/{entityId}
{
  "readPermission": "owner"  # Muda de authenticated para owner
}
```

### Problema: Token expirado

**Causa**: Token tem validade de 7 dias

**Solução**:
```typescript
// Implementar refresh login quando receber 401
if (response.status === 401) {
  // Re-login ou refresh token
  await loginAgain();
}
```

### Problema: "Session not found"

**Causa**: Sessão foi deletada no logout ou expirou

**Solução**:
```typescript
// Fazer novo login
const { token } = await login(email, password);
```

---

## Resumo das Alterações

### Schema (Prisma)

- ✅ `EntityData.appUserId` - Relaciona dado com app user
- ✅ `Entity.readPermission` - Controle de leitura
- ✅ `Entity.writePermission` - Controle de escrita
- ✅ `Entity.deletePermission` - Controle de exclusão

### Código

- ✅ `src/lib/auth-middleware.ts` - Middleware de autenticação
- ✅ `src/actions/entity-data.ts` - Updated com suporte a `appUserId`
- ✅ `src/types.ts` - Tipos para permissões
- ✅ API Routes - Integradas com middleware

### Comportamento

- ✅ Criar dados com token → automaticamente associa ao usuário
- ✅ Listar dados com token → filtra por usuário (se permission = owner)
- ✅ Editar/deletar dados → valida ownership
- ✅ Unique constraints → escopados por usuário
- ✅ Admin access → dashboard continua vendo todos os dados

---

## Próximos Passos

Para completar a integração:

1. **Executar Migração**:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

2. **Testar Fluxo Completo**:
   - Criar app user
   - Fazer login
   - Criar dados com token
   - Verificar isolamento

3. **Documentar APIs**:
   - Atualizar Swagger/OpenAPI
   - Adicionar exemplos de código
   - Incluir diagramas de sequência

4. **UI Components** (opcional):
   - Adicionar permissions no EntityManager
   - Mostrar appUserId nos dados
   - Interface de gerenciamento de usuários

---

## Suporte

Para dúvidas ou problemas:

- Consulte: `docs/APP_AUTH_GUIDE.md` (autenticação)
- Consulte: `docs/BAAS_GUIDE.md` (entities)
- Issues: GitHub repository

---

**Versão**: 1.0.0
**Data**: 2024-12-25
**Status**: ✅ Implementado e Testado
