# 🎯 Guia: Client vs Server Components

## 📋 Resumo

Este guia explica quando usar **Client Components** vs **Server Components** no Next.js App Router.

---

## 🔍 Análise das Páginas Atuais

### ✅ Páginas que **PRECISAM** ser Client Components

#### 1. `/dashboard` - **DEVE SER CLIENT**
**Por quê?**
- Usa `useState` extensivamente (estado de UI, formulários)
- Usa `useEffect` para side effects
- Gerencia contextos complexos (Database, Session)
- Interatividade pesada (editor JSON, AI Assistant)
- Animações com framer-motion

#### 2. `/login` - **DEVE SER CLIENT**
**Por quê?**
- Usa `useState` para gerenciar formulário
- Usa `useRouter` (versão client-side)
- Usa `signIn` do NextAuth (função client)
- Animações com framer-motion

#### 3. `/register` - **DEVE SER CLIENT**
**Por quê?**
- Usa `useState` para formulário
- Usa `useEffect` para analytics tracking
- Usa `useRouter` (versão client-side)
- Validação de formulário em tempo real

#### 4. `/pricing` - **DEVE SER CLIENT**
**Por quê?**
- Usa `useState` para alternar planos (monthly/yearly)
- Usa `useEffect` para analytics tracking
- Usa `useAnalytics` hook customizado
- Botões de checkout precisam de interatividade

#### 5. `/admin` - **DEVE SER CLIENT**
**Por quê?**
- Dashboard administrativo com estado complexo
- Tabelas interativas
- Filtros e busca em tempo real
- Modais e confirmações

#### 6. `/settings/billing` - **DEVE SER CLIENT**
**Por quê?**
- Gerenciamento de assinatura
- Integração com Stripe (client-side)
- Formulários interativos
- Confirmações de ações

#### 7. `/dashboard/databases` - **DEVE SER CLIENT**
**Por quê?**
- Editor de banco de dados
- Estado complexo de conexões
- Formulários dinâmicos
- Validação em tempo real

---

## 🎯 Quando Usar Cada Tipo

### 🔵 Use **Server Components** quando:

- ✅ Buscar dados do servidor
- ✅ Acessar recursos backend (DB, APIs)
- ✅ Manter informações sensíveis no servidor (tokens, chaves)
- ✅ Reduzir bundle JavaScript do cliente
- ✅ Renderizar conteúdo estático ou semi-estático

**Exemplo ideal:**
```typescript
// ✅ BOM: Server Component
export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await fetchPost(params.slug)  // Fetch no servidor

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  )
}
```

### 🟢 Use **Client Components** quando:

- ✅ Usar hooks do React (`useState`, `useEffect`, etc.)
- ✅ Usar event listeners (`onClick`, `onChange`, etc.)
- ✅ Usar APIs do browser (`localStorage`, `window`, etc.)
- ✅ Usar bibliotecas que dependem do browser
- ✅ Interatividade e estado compartilhado

**Exemplo ideal:**
```typescript
'use client'

// ✅ BOM: Client Component
export default function InteractiveButton() {
  const [count, setCount] = useState(0)  // useState → precisa ser client

  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  )
}
```

---

## 🏗️ Padrões de Otimização

### 1. Composição Híbrida

Mantenha Server Components no topo e aninhe Client Components:

```typescript
// app/page.tsx (Server Component)
export default async function Page() {
  const data = await fetchData()  // Server-side fetch

  return (
    <div>
      <ServerHeader />
      <InteractiveWidget data={data} />  {/* Client Component */}
      <ServerFooter />
    </div>
  )
}
```

### 2. Separar Lógica de Apresentação

```typescript
// ❌ RUIM: Tudo em Client Component
'use client'

export default function Page() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(setData)
  }, [])

  return <div>{data?.title}</div>
}

// ✅ BOM: Server Component busca dados, Client apenas interatividade
export default async function Page() {
  const data = await fetchData()  // Server-side

  return <InteractiveDisplay data={data} />  {/* Client recebe props */}
}
```

### 3. Evitar "use client" Desnecessário

```typescript
// ❌ RUIM: Marca tudo como client
'use client'

import { Header } from './Header'
import { Content } from './Content'
import { Footer } from './Footer'

export default function Layout({ children }) {
  return (
    <>
      <Header />
      <Content>{children}</Content>
      <Footer />
    </>
  )
}

// ✅ BOM: Apenas componentes que precisam são client
import { InteractiveHeader } from './InteractiveHeader'  // Este tem 'use client'
import { Content } from './Content'  // Server Component
import { Footer } from './Footer'  // Server Component

export default function Layout({ children }) {
  return (
    <>
      <InteractiveHeader />  {/* Único client component */}
      <Content>{children}</Content>
      <Footer />
    </>
  )
}
```

---

## 📊 Impacto no Projeto Atual

### Métrica Atual:
- **7 páginas principais** = 100% Client Components
- **Bundle JavaScript**: Alto
- **SEO**: Limitado
- **Performance**: Poderia ser melhor

### Oportunidades de Melhoria:

1. **Páginas de Conteúdo Estático** (Futuras)
   - Landing page → Server Component
   - Documentação → Server Component
   - Blog (se houver) → Server Component

2. **Componentes Isolados**
   - Converter partes estáticas dentro de páginas client
   - Exemplo: Header, Footer, Sidebar estáticos

3. **Carregamento de Dados**
   - Mover fetching para Server Components
   - Passar dados via props para Client Components

---

## 🚨 Erros Comuns

### 1. Esquecer "use client"

```typescript
// ❌ ERRO: useState sem 'use client'
export default function Counter() {
  const [count, setCount] = useState(0)  // ERRO!
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}

// ✅ CORRETO: Adicionar 'use client'
'use client'

export default function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

### 2. Usar APIs do Browser em Server Components

```typescript
// ❌ ERRO: localStorage em Server Component
export default function Page() {
  const theme = localStorage.getItem('theme')  // ERRO! 'localStorage' não existe no servidor
  return <div>{theme}</div>
}

// ✅ CORRETO: Usar em Client Component
'use client'

export default function Page() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme'))
  return <div>{theme}</div>
}
```

### 3. Passar Funções de Server para Client

```typescript
// ❌ ERRO: Passar função como prop
export default async function Page() {
  const handleClick = () => console.log('clicked')  // Não pode serializar função

  return <ClientButton onClick={handleClick} />  // ERRO!
}

// ✅ CORRETO: Definir função no Client Component
'use client'

function ClientButton() {
  const handleClick = () => console.log('clicked')
  return <button onClick={handleClick}>Click</button>
}
```

---

## 🎯 Recomendações para Futuro

### Curto Prazo (Sprint Atual)
- ✅ Manter páginas atuais como Client Components (funcionais)
- ✅ Documentar padrões de uso (este documento)
- ✅ Treinar time sobre diferenças

### Médio Prazo (Próximas 2-3 Sprints)
- 🔄 Identificar componentes dentro de páginas que podem ser Server
- 🔄 Criar landing page como Server Component
- 🔄 Mover fetching de dados para Server Components

### Longo Prazo (Roadmap)
- 🚀 Reavaliar páginas complexas (dashboard)
- 🚀 Implementar Partial Prerendering (PPR)
- 🚀 Otimizar bundle size progressivamente

---

## 📚 Recursos

- [Next.js - Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js - Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [React - Server Components](https://react.dev/reference/react/use-client)
- [Vercel - Composition Patterns](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)

---

**Última atualização**: 2025-12-28
