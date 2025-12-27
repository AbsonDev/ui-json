# 🚀 Backend as a Service (BaaS) - Guia Completo

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Conceitos Principais](#conceitos-principais)
3. [Como Usar na UI](#como-usar-na-ui)
4. [API REST](#api-rest)
5. [Tipos de Dados](#tipos-de-dados)
6. [Validações](#validações)
7. [Exemplos Práticos](#exemplos-práticos)
8. [Best Practices](#best-practices)

---

## 🎯 Visão Geral

O **Backend as a Service (BaaS)** do UI-JSON permite que você crie backends completos para seus aplicativos mobile **sem escrever código backend**. Você define suas entidades (modelos de dados) visualmente e o sistema gera automaticamente:

- ✅ **Banco de dados PostgreSQL** com schemas dinâmicos
- ✅ **API REST completa** (CRUD)
- ✅ **Validações** automáticas
- ✅ **Soft delete** opcional
- ✅ **Timestamps** automáticos
- ✅ **Paginação** e filtros

### Principais Benefícios

- **Zero código backend**: Tudo configurado visualmente
- **Type-safe**: Validação de tipos automática
- **Escalável**: Baseado em PostgreSQL
- **Seguro**: Autenticação e autorização integradas
- **API automática**: Endpoints REST gerados automaticamente

---

## 🧩 Conceitos Principais

### Entity (Entidade)

Uma **Entity** é como uma tabela no banco de dados ou um modelo no backend. Exemplos:
- `Product` (produtos de um e-commerce)
- `User` (usuários do app)
- `Order` (pedidos)
- `Post` (postagens de blog)

### Fields (Campos)

Cada Entity tem **fields** (campos) que definem quais dados ela armazena:

```typescript
Entity: Product
├── name: string (required)
├── price: number (required)
├── description: text
├── inStock: boolean (default: true)
└── image: url
```

### Entity Data (Dados)

São os **registros** da entity. Exemplo de dados para `Product`:

```json
{
  "id": "clx123abc",
  "name": "iPhone 15 Pro",
  "price": 999.99,
  "description": "Latest iPhone with A17 Pro chip",
  "inStock": true,
  "image": "https://example.com/iphone.jpg",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

---

## 🖥️ Como Usar na UI

### 1. Acessar a Aba Backend

1. Abra o **Dashboard**
2. Selecione seu app
3. Clique na aba **"Backend"**

### 2. Criar uma Entity

1. Clique em **"New Entity"**
2. Preencha as informações:
   - **Entity Name**: Nome da entity (PascalCase, ex: `Product`)
   - **Display Name**: Nome amigável (ex: "Products")
   - **Description**: Descrição opcional

3. **Adicione Fields** (campos):

   Clique em "Add Field" e configure:
   - **Field name**: Nome do campo (camelCase, ex: `firstName`)
   - **Type**: Tipo de dado (veja [Tipos de Dados](#tipos-de-dados))
   - **Display name**: Nome amigável
   - **Required**: Campo obrigatório?
   - **Unique**: Valor deve ser único?

4. **Opções adicionais**:
   - ☑️ **Auto-add timestamps**: Adiciona `createdAt` e `updatedAt` automaticamente
   - ☑️ **Enable soft delete**: Ao deletar, marca como deletado ao invés de remover

5. Clique em **"Create Entity"**

### 3. Gerenciar Dados

Após criar uma Entity:

1. **Clique na Entity** para abrir o gerenciador de dados
2. Clique em **"New Record"** para criar um registro
3. Preencha os campos e clique em **"Create Record"**

Você pode:
- ✏️ **Editar** registros existentes
- 🗑️ **Deletar** registros
- ♻️ **Restaurar** registros deletados (se soft delete estiver ativo)

---

## 🌐 API REST

### Endpoints Gerados Automaticamente

Para cada Entity criada, o sistema gera automaticamente os seguintes endpoints:

#### Entities (Gerenciamento de Schemas)

```http
# Listar todas as entities de um app
GET /api/apps/{appId}/entities

# Obter uma entity específica
GET /api/apps/{appId}/entities/{entityId}

# Criar nova entity
POST /api/apps/{appId}/entities

# Atualizar entity
PUT /api/apps/{appId}/entities/{entityId}

# Deletar entity
DELETE /api/apps/{appId}/entities/{entityId}
```

#### Entity Data (CRUD de Dados)

```http
# Listar registros (com paginação)
GET /api/apps/{appId}/entities/{entityId}/data
  Query params:
    - limit: number (default 50)
    - offset: number (default 0)
    - includeDeleted: boolean (default false)

# Obter um registro específico
GET /api/apps/{appId}/entities/{entityId}/data/{recordId}

# Criar novo registro
POST /api/apps/{appId}/entities/{entityId}/data

# Atualizar registro
PUT /api/apps/{appId}/entities/{entityId}/data/{recordId}

# Deletar registro
DELETE /api/apps/{appId}/entities/{entityId}/data/{recordId}
  Query params:
    - hard: boolean (força hard delete)

# Restaurar registro deletado (soft delete)
PATCH /api/apps/{appId}/entities/{entityId}/data/{recordId}
  Body: { "action": "restore" }
```

### Exemplos de Uso

#### Criar uma Entity

```bash
POST /api/apps/clx123/entities
Content-Type: application/json

{
  "name": "Product",
  "displayName": "Products",
  "description": "E-commerce products",
  "fields": [
    {
      "name": "title",
      "type": "string",
      "displayName": "Product Title",
      "required": true
    },
    {
      "name": "price",
      "type": "number",
      "displayName": "Price",
      "required": true
    },
    {
      "name": "inStock",
      "type": "boolean",
      "defaultValue": true
    }
  ],
  "timestamps": true,
  "softDelete": false
}
```

#### Criar um Registro

```bash
POST /api/apps/clx123/entities/clx456/data
Content-Type: application/json

{
  "data": {
    "title": "iPhone 15 Pro",
    "price": 999.99,
    "inStock": true
  }
}
```

#### Listar Registros (com paginação)

```bash
GET /api/apps/clx123/entities/clx456/data?limit=20&offset=0
```

Resposta:

```json
{
  "data": [
    {
      "id": "record1",
      "data": {
        "title": "iPhone 15 Pro",
        "price": 999.99,
        "inStock": true
      },
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-15T10:30:00Z",
      "deletedAt": null
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### Atualizar um Registro

```bash
PUT /api/apps/clx123/entities/clx456/data/record1
Content-Type: application/json

{
  "data": {
    "price": 899.99,
    "inStock": false
  }
}
```

#### Deletar um Registro

```bash
# Soft delete (se habilitado)
DELETE /api/apps/clx123/entities/clx456/data/record1

# Hard delete (forçar remoção permanente)
DELETE /api/apps/clx123/entities/clx456/data/record1?hard=true
```

---

## 📊 Tipos de Dados

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `string` | Texto curto | "iPhone 15" |
| `number` | Número (int ou float) | 999.99 |
| `boolean` | Verdadeiro/Falso | true |
| `date` | Data (YYYY-MM-DD) | "2025-01-15" |
| `datetime` | Data e hora | "2025-01-15T10:30:00Z" |
| `email` | Email (validado) | "user@example.com" |
| `url` | URL (validada) | "https://example.com" |
| `text` | Texto longo | "Long description..." |
| `json` | Objeto JSON | `{ "key": "value" }` |
| `relation` | Relação com outra entity | (futuro) |

---

## ✅ Validações

### Validações Automáticas

O sistema valida automaticamente:

- **Required**: Campos obrigatórios não podem ser vazios
- **Type**: Valores devem ser do tipo correto
- **Email**: Formato de email válido
- **URL**: Formato de URL válido
- **Unique**: Valores únicos (não duplicados)

### Validações Customizadas

Você pode adicionar regras de validação customizadas:

```typescript
{
  "name": "age",
  "type": "number",
  "validation": [
    {
      "type": "min",
      "value": 18,
      "message": "Must be 18 or older"
    },
    {
      "type": "max",
      "value": 120,
      "message": "Invalid age"
    }
  ]
}
```

Tipos de validação:
- `required`: Campo obrigatório
- `min`: Valor mínimo (número) ou comprimento mínimo (string)
- `max`: Valor máximo (número) ou comprimento máximo (string)
- `pattern`: Regex pattern
- `email`: Validação de email
- `url`: Validação de URL
- `unique`: Valor único

---

## 🎓 Exemplos Práticos

### Exemplo 1: E-commerce Simples

#### Entity: Product

```json
{
  "name": "Product",
  "displayName": "Products",
  "fields": [
    { "name": "title", "type": "string", "required": true },
    { "name": "description", "type": "text" },
    { "name": "price", "type": "number", "required": true },
    { "name": "image", "type": "url" },
    { "name": "inStock", "type": "boolean", "defaultValue": true },
    { "name": "category", "type": "string" }
  ],
  "timestamps": true
}
```

#### Entity: Order

```json
{
  "name": "Order",
  "displayName": "Orders",
  "fields": [
    { "name": "customerName", "type": "string", "required": true },
    { "name": "customerEmail", "type": "email", "required": true },
    { "name": "total", "type": "number", "required": true },
    { "name": "status", "type": "string", "defaultValue": "pending" },
    { "name": "items", "type": "json" }
  ],
  "timestamps": true
}
```

### Exemplo 2: Blog

#### Entity: Post

```json
{
  "name": "Post",
  "displayName": "Blog Posts",
  "fields": [
    { "name": "title", "type": "string", "required": true },
    { "name": "content", "type": "text", "required": true },
    { "name": "author", "type": "string", "required": true },
    { "name": "published", "type": "boolean", "defaultValue": false },
    { "name": "slug", "type": "string", "unique": true },
    { "name": "tags", "type": "json" }
  ],
  "timestamps": true,
  "softDelete": true
}
```

#### Entity: Comment

```json
{
  "name": "Comment",
  "displayName": "Comments",
  "fields": [
    { "name": "postId", "type": "string", "required": true },
    { "name": "author", "type": "string", "required": true },
    { "name": "email", "type": "email", "required": true },
    { "name": "content", "type": "text", "required": true },
    { "name": "approved", "type": "boolean", "defaultValue": false }
  ],
  "timestamps": true,
  "softDelete": true
}
```

### Exemplo 3: Task Manager

#### Entity: Task

```json
{
  "name": "Task",
  "displayName": "Tasks",
  "fields": [
    { "name": "title", "type": "string", "required": true },
    { "name": "description", "type": "text" },
    { "name": "completed", "type": "boolean", "defaultValue": false },
    { "name": "priority", "type": "string", "defaultValue": "medium" },
    { "name": "dueDate", "type": "date" },
    { "name": "assignee", "type": "string" }
  ],
  "timestamps": true
}
```

---

## 📚 Best Practices

### 1. Nomenclatura

- **Entity names**: Use PascalCase (`Product`, `User`, `BlogPost`)
- **Field names**: Use camelCase (`firstName`, `createdAt`, `isActive`)
- **Display names**: Use nomes amigáveis ("First Name", "Created At")

### 2. Estrutura de Dados

- **Mantenha entities simples**: Uma entity deve representar um conceito único
- **Use validações**: Sempre valide dados importantes
- **Campos obrigatórios**: Marque como required apenas o essencial
- **Valores padrão**: Use `defaultValue` para campos com valores comuns

### 3. Soft Delete

- Use soft delete para:
  - Dados que podem ser recuperados
  - Histórico de atividades
  - Compliance (GDPR, LGPD)

- NÃO use para:
  - Dados sensíveis que devem ser removidos
  - Tabelas muito grandes (pode afetar performance)

### 4. Performance

- **Paginação**: Sempre use limit/offset para listas grandes
- **Índices**: Campos marcados como `unique` são automaticamente indexados
- **Soft delete**: Sempre use `includeDeleted: false` nas queries (padrão)

### 5. Segurança

- **Autenticação**: Todos os endpoints requerem autenticação
- **Autorização**: Usuários só acessam dados de seus próprios apps
- **Validação**: Nunca confie em dados do cliente, sempre valide

---

## 🔒 Segurança e Autorização

### Autenticação

Todos os endpoints requerem autenticação via NextAuth (JWT).

### Autorização

- **Ownership**: Usuários só podem acessar entities de apps que possuem
- **Isolamento**: Dados de diferentes usuários são completamente isolados
- **Validação**: Todas as entradas são validadas antes de salvar

### Rate Limiting

(A ser implementado)
- Limite de requisições por minuto
- Proteção contra abuso

---

## 🚀 Roadmap (Próximas Features)

- [ ] **Relacionamentos**: 1:1, 1:N, N:N entre entities
- [ ] **Webhooks**: Eventos automáticos ao criar/atualizar/deletar
- [ ] **File upload**: Campos do tipo `file` para imagens/documentos
- [ ] **Full-text search**: Busca por conteúdo
- [ ] **Aggregations**: COUNT, SUM, AVG, etc.
- [ ] **Autenticação de usuários finais**: Sistema de auth para apps
- [ ] **Real-time**: WebSockets para updates em tempo real
- [ ] **GraphQL API**: Alternativa ao REST

---

## 📞 Suporte

Precisa de ajuda?

- 📖 Veja a [documentação completa](../README.md)
- 🐛 Reporte bugs via GitHub Issues
- 💬 Perguntas? Discord ou GitHub Discussions

---

**Desenvolvido com ❤️ para facilitar a criação de apps mobile!**
