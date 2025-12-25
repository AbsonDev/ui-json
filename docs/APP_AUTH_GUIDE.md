# 🔐 App User Authentication - Guia Completo

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Conceitos Principais](#conceitos-principais)
3. [API REST](#api-rest)
4. [Fluxos de Autenticação](#fluxos-de-autenticação)
5. [Segurança](#segurança)
6. [Exemplos de Uso](#exemplos-de-uso)
7. [Integração com Entities](#integração-com-entities)

---

## 🎯 Visão Geral

O sistema de autenticação permite que **apps criados no UI-JSON tenham usuários próprios** que podem se registrar, fazer login e ter dados isolados.

### Principais Benefícios

- ✅ **Multi-tenant**: Cada app tem seus próprios usuários
- ✅ **Seguro**: Passwords com bcrypt + JWT
- ✅ **Isolamento**: Usuários de um app não veem dados de outros
- ✅ **Customizável**: Metadata JSON para campos extras
- ✅ **Sessões rastreáveis**: Controle de dispositivos e IPs

---

## 🧩 Conceitos Principais

### AppUser (Usuário do App)

Representa um usuário que se registrou em um app específico.

```typescript
interface AppUser {
  id: string
  email: string
  name?: string
  avatar?: string
  emailVerified: boolean
  appId: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}
```

**Características:**
- Email é único **por app** (mesmo email pode existir em apps diferentes)
- Password é hasheado com bcrypt (nunca armazenado em texto)
- Metadata permite campos customizados (ex: telefone, endereço, preferências)

### AppSession (Sessão)

Representa uma sessão ativa de um usuário.

```typescript
interface AppSession {
  id: string
  token: string          // JWT
  expiresAt: Date        // Geralmente 7 dias
  appUserId: string
  userAgent?: string     // Navegador/device
  ipAddress?: string     // IP do usuário
  createdAt: Date
  lastUsedAt: Date       // Atualizado a cada request
}
```

**Características:**
- Um usuário pode ter múltiplas sessões (diferentes dispositivos)
- JWT válido por 7 dias por padrão
- Sessões são invalidadas ao fazer logout ou trocar senha

---

## 🌐 API REST

### Base URL

```
/api/apps/{appId}/auth
```

Onde `{appId}` é o ID do app criado no dashboard.

---

### 1. Registro (POST /register)

Criar novo usuário no app.

**Endpoint:**
```
POST /api/apps/{appId}/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "João Silva",           // opcional
  "metadata": {                     // opcional
    "phone": "+55 11 99999-9999",
    "city": "São Paulo"
  }
}
```

**Validações:**
- Email: formato válido
- Password:
  - Mínimo 8 caracteres
  - Pelo menos 1 maiúscula
  - Pelo menos 1 minúscula
  - Pelo menos 1 número

**Response (201 Created):**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "João Silva",
    "emailVerified": false,
    "metadata": { "phone": "+55 11 99999-9999", "city": "São Paulo" },
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z",
    "lastLoginAt": null
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-01-22T10:30:00Z"
}
```

**Erros:**
- `400`: Email já existe, validação falhou
- `404`: App não encontrado

---

### 2. Login (POST /login)

Autenticar usuário existente.

**Endpoint:**
```
POST /api/apps/{appId}/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "João Silva",
    "emailVerified": false,
    "metadata": { ... },
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z",
    "lastLoginAt": "2025-01-15T14:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-01-22T14:30:00Z"
}
```

**Erros:**
- `401`: Email ou senha incorretos
- `404`: App não encontrado

---

### 3. Obter Usuário Atual (GET /me)

Buscar informações do usuário logado.

**Endpoint:**
```
GET /api/apps/{appId}/auth/me
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "João Silva",
    "emailVerified": false,
    "metadata": { ... },
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z",
    "lastLoginAt": "2025-01-15T14:30:00Z"
  }
}
```

**Erros:**
- `401`: Token inválido ou expirado
- `401`: Sessão não encontrada

---

### 4. Logout (POST /logout)

Invalidar sessão atual.

**Endpoint:**
```
POST /api/apps/{appId}/auth/logout
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Erros:**
- `401`: Token inválido

---

### 5. Atualizar Perfil (PUT /profile)

Atualizar informações do usuário.

**Endpoint:**
```
PUT /api/apps/{appId}/auth/profile
```

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "João Pedro Silva",
  "avatar": "https://example.com/avatar.jpg",
  "metadata": {
    "phone": "+55 11 88888-8888",
    "city": "Rio de Janeiro"
  }
}
```

Todos os campos são opcionais.

**Response (200 OK):**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "João Pedro Silva",
    "avatar": "https://example.com/avatar.jpg",
    "emailVerified": false,
    "metadata": {
      "phone": "+55 11 88888-8888",
      "city": "Rio de Janeiro"
    },
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T15:30:00Z",
    "lastLoginAt": "2025-01-15T14:30:00Z"
  }
}
```

**Erros:**
- `400`: Validação falhou (ex: avatar não é URL válida)
- `401`: Token inválido

---

### 6. Trocar Senha (PUT /password)

Alterar senha do usuário.

**Endpoint:**
```
PUT /api/apps/{appId}/auth/password
```

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "currentPassword": "SecurePass123",
  "newPassword": "NewSecurePass456"
}
```

**Validações da nova senha:**
- Mínimo 8 caracteres
- Pelo menos 1 maiúscula
- Pelo menos 1 minúscula
- Pelo menos 1 número

**Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

**Importante:** Ao trocar a senha, todas as outras sessões do usuário são invalidadas (exceto a atual).

**Erros:**
- `400`: Senha atual incorreta
- `400`: Nova senha não atende requisitos

---

## 🔄 Fluxos de Autenticação

### Fluxo de Registro

```
1. Usuário preenche formulário
2. App envia POST /auth/register
3. Sistema valida dados
4. Sistema cria usuário (password hasheado)
5. Sistema cria sessão
6. Sistema gera JWT
7. Sistema retorna user + token
8. App armazena token (localStorage/AsyncStorage)
9. App redireciona para tela inicial
```

### Fluxo de Login

```
1. Usuário preenche email e senha
2. App envia POST /auth/login
3. Sistema verifica credenciais
4. Sistema atualiza lastLoginAt
5. Sistema cria nova sessão
6. Sistema gera JWT
7. Sistema retorna user + token
8. App armazena token
9. App redireciona para tela inicial
```

### Fluxo de Request Autenticado

```
1. App tem token armazenado
2. App faz request com header: Authorization: Bearer {token}
3. Sistema verifica token
4. Sistema verifica sessão válida
5. Sistema atualiza lastUsedAt da sessão
6. Sistema processa request
7. Sistema retorna resposta
```

### Fluxo de Logout

```
1. Usuário clica em "Sair"
2. App envia POST /auth/logout com token
3. Sistema deleta sessão
4. App remove token do storage
5. App redireciona para tela de login
```

---

## 🔒 Segurança

### Password Storage

```typescript
// ❌ NUNCA armazenado em texto
password: "SecurePass123"

// ✅ Armazenado como hash bcrypt
passwordHash: "$2a$10$XYZ..."
```

- Bcrypt com salt rounds = 10
- Impossível reverter hash para password original
- Cada password tem salt único

### JWT (JSON Web Token)

```
Estrutura:
{
  userId: "user_123",
  appId: "app_456",
  email: "user@example.com",
  sessionId: "session_789",
  iat: 1705315800,
  exp: 1705920600
}

Assinado com HS256 usando NEXTAUTH_SECRET
```

**Características:**
- Stateless (não precisa consultar DB a cada request)
- Expiração automática (7 dias)
- Verificação de assinatura previne adulteração

### Validações

**Email:**
```typescript
✅ "user@example.com"
❌ "not-an-email"
❌ "user@"
```

**Password (registro/troca):**
```typescript
✅ "SecurePass123"  // 8+ chars, upper, lower, number
❌ "short"          // muito curto
❌ "alllowercase1"  // sem maiúscula
❌ "ALLUPPERCASE1"  // sem minúscula
❌ "NoNumbers"      // sem número
```

**Metadata:**
```typescript
// Sanitização automática previne injection
metadata: {
  phone: "+55 11 99999-9999",  // ✅ string
  age: 25,                      // ✅ number
  active: true,                 // ✅ boolean
  nested: { city: "SP" },       // ✅ object (sanitizado)
  // Scripts são removidos automaticamente
}
```

### Rate Limiting (recomendado)

Embora não implementado ainda, é recomendado adicionar:

```typescript
// Login: 5 tentativas por 15 minutos
// Register: 3 registros por hora por IP
// Password change: 3 tentativas por hora
```

---

## 💻 Exemplos de Uso

### JavaScript/TypeScript (Web)

```typescript
// Registro
async function register() {
  const response = await fetch('/api/apps/app_123/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'SecurePass123',
      name: 'João Silva',
    }),
  })

  const data = await response.json()

  if (response.ok) {
    // Salvar token
    localStorage.setItem('auth_token', data.token)
    // Redirecionar
    window.location.href = '/dashboard'
  } else {
    alert(data.error)
  }
}

// Login
async function login() {
  const response = await fetch('/api/apps/app_123/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'SecurePass123',
    }),
  })

  const data = await response.json()

  if (response.ok) {
    localStorage.setItem('auth_token', data.token)
    window.location.href = '/dashboard'
  } else {
    alert(data.error)
  }
}

// Request autenticado
async function getProfile() {
  const token = localStorage.getItem('auth_token')

  const response = await fetch('/api/apps/app_123/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  const data = await response.json()

  if (response.ok) {
    console.log('User:', data.user)
  } else {
    // Token inválido, fazer logout
    localStorage.removeItem('auth_token')
    window.location.href = '/login'
  }
}

// Logout
async function logout() {
  const token = localStorage.getItem('auth_token')

  await fetch('/api/apps/app_123/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  localStorage.removeItem('auth_token')
  window.location.href = '/login'
}
```

### React Native (Mobile)

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'

// Registro
async function register() {
  const response = await fetch('https://your-api.com/api/apps/app_123/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'SecurePass123',
      name: 'João Silva',
    }),
  })

  const data = await response.json()

  if (response.ok) {
    // Salvar token no AsyncStorage
    await AsyncStorage.setItem('auth_token', data.token)
    // Navegar para Home
    navigation.navigate('Home')
  } else {
    Alert.alert('Erro', data.error)
  }
}

// Request autenticado
async function fetchData() {
  const token = await AsyncStorage.getItem('auth_token')

  const response = await fetch('https://your-api.com/api/apps/app_123/entities/products/data', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  const data = await response.json()
  return data
}
```

---

## 🔗 Integração com Entities

### Dados por Usuário (Próxima Implementação)

Futuramente, os dados das entities serão automaticamente filtrados por usuário:

```typescript
// Ao criar um registro com usuário logado
POST /api/apps/app_123/entities/orders/data
Headers: Authorization: Bearer {token}
Body: {
  "data": {
    "product": "iPhone 15",
    "quantity": 1,
    "total": 999.99
  }
}

// Sistema adiciona automaticamente:
{
  "data": {
    "userId": "user_123",  // ✅ Adicionado automaticamente
    "product": "iPhone 15",
    "quantity": 1,
    "total": 999.99
  }
}

// Ao listar registros com usuário logado
GET /api/apps/app_123/entities/orders/data
Headers: Authorization: Bearer {token}

// Sistema filtra automaticamente:
WHERE userId = "user_123"

// Resultado: Usuário vê apenas SEUS pedidos
```

### Permissions (Futuro)

```typescript
// Configurar permissions na entity
Entity: Order
├── read: "owner"      // Apenas dono pode ler
├── write: "owner"     // Apenas dono pode escrever
├── delete: "owner"    // Apenas dono pode deletar
└── admin: "all"       // Admin vê tudo
```

---

## 📚 Próximos Passos

### Implementado ✅
- [x] Registro de usuários
- [x] Login com JWT
- [x] Logout
- [x] Atualizar perfil
- [x] Trocar senha
- [x] Metadata customizável
- [x] Sessões rastreáveis

### Próximas Features 🔜
- [ ] Email verification
- [ ] Password reset (esqueci minha senha)
- [ ] OAuth (Google, Facebook, Apple)
- [ ] Two-Factor Authentication (2FA)
- [ ] Rate limiting
- [ ] Integração automática com entities (userId)
- [ ] Permissions por entity
- [ ] Admin panel para gerenciar usuários

---

## 🎉 Conclusão

Agora seus apps podem ter **usuários reais** com:
- ✅ Registro seguro
- ✅ Login com JWT
- ✅ Perfis customizáveis
- ✅ Sessões gerenciáveis
- ✅ Dados isolados por usuário

**Apps deixam de ser "demos" e viram aplicações funcionais!** 🚀

---

**Desenvolvido em 15/01/2025 - Semana 2 do Roadmap BaaS**
