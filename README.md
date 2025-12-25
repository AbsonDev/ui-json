<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🚀 UI-JSON Visualizer

Uma plataforma **low-code moderna** para criar aplicativos móveis usando JSON declarativo. Inspirada na **Mobilex da MTM Tecnologia**, com backend completo, autenticação segura e persistência em PostgreSQL.

## ✨ Funcionalidades

- ✅ **Editor Visual de UI** - Defina interfaces em JSON e veja em tempo real
- ✅ **Autenticação Segura** - NextAuth v5 com bcrypt
- ✅ **Banco de Dados PostgreSQL** - Prisma ORM type-safe
- ✅ **AI Assistant** - Integração com Google Gemini
- ✅ **Database Manager** - Gerenciamento dinâmico de schemas
- ✅ **Screen Flow Builder** - Visualizador de fluxo de telas
- ✅ **Component Library** - Biblioteca de componentes reutilizáveis
- ✅ **Undo/Redo** - Histórico completo de alterações
- ✅ **Multi-usuário** - Cada usuário tem seus próprios apps

## 🛠️ Tech Stack (2025)

```
Next.js 15 (App Router)     # Framework full-stack
Auth.js (NextAuth v5)        # Autenticação moderna
Prisma ORM                   # Database type-safe
PostgreSQL                   # Banco de dados
Server Actions               # API type-safe
Zod                         # Validação de schemas
Tailwind CSS                # Estilização
TypeScript                  # Type safety
```

## 📋 Pré-requisitos

- **Node.js** 18+
- **PostgreSQL** 14+
- **npm** ou **yarn**

## 🚀 Setup e Instalação

### 1️⃣ Clone o repositório

```bash
git clone <repo-url>
cd ui-json
```

### 2️⃣ Instale as dependências

```bash
npm install
```

### 3️⃣ Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/uijson?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-secret-aqui"  # Gere com: openssl rand -base64 32

# AI Assistant (Google Gemini)
GEMINI_API_KEY="sua-api-key-aqui"
```

### 4️⃣ Configure o banco de dados

```bash
# Cria/atualiza o schema no banco
npm run db:push

# (Opcional) Abrir Prisma Studio para visualizar dados
npm run db:studio
```

### 5️⃣ Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: **http://localhost:3000**

## 📁 Estrutura do Projeto

```
ui-json/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/           # Página de login
│   │   │   └── register/        # Página de registro
│   │   ├── dashboard/           # Editor principal
│   │   ├── api/
│   │   │   └── auth/            # Endpoints NextAuth
│   │   └── layout.tsx           # Layout raiz
│   ├── components/              # Componentes React
│   │   ├── Renderer.tsx         # Renderizador de UI-JSON
│   │   ├── VisualComponents.tsx # Componentes visuais
│   │   ├── AIAssistant.tsx      # Assistente IA
│   │   ├── DatabaseEditor.tsx   # Editor de DB
│   │   ├── FlowBuilder.tsx      # Visualizador de fluxo
│   │   └── ...
│   ├── lib/
│   │   ├── prisma.ts            # Cliente Prisma
│   │   └── auth.ts              # Configuração Auth.js
│   ├── actions/
│   │   └── apps.ts              # Server Actions (CRUD)
│   ├── hooks/                   # Custom React hooks
│   ├── types.ts                 # Tipos TypeScript
│   └── constants.ts             # Apps de exemplo
├── prisma/
│   └── schema.prisma            # Schema do banco
├── public/                      # Arquivos estáticos
├── .env.example                 # Template de variáveis
├── next.config.js               # Config Next.js
├── tailwind.config.js           # Config Tailwind
└── package.json
```

## 🎯 Como Usar

### 1. **Criar Conta**
- Acesse `/register` e crie sua conta
- Faça login em `/login`

### 2. **Criar Aplicativo**
- Clique em **"Novo Aplicativo"** no dashboard
- Edite o JSON na aba **"Editor"**
- Veja o preview em tempo real no smartphone simulado

### 3. **Gerenciar Banco de Dados**
- Aba **"Database"**: crie schemas e gerencie dados
- Dados são persistidos no PostgreSQL

### 4. **Usar AI Assistant**
- Aba **"AI Assistant"**: gere JSON automaticamente
- Descreva o que quer e a IA cria o código

### 5. **Adicionar Componentes**
- Aba **"Componentes"**: biblioteca de componentes prontos
- Clique para adicionar à tela atual

## 🔐 Segurança

- ✅ Senhas hasheadas com **bcrypt**
- ✅ Autenticação via **JWT** (NextAuth)
- ✅ Validação de schemas com **Zod**
- ✅ Proteção de rotas no **middleware**
- ✅ Isolamento de dados por usuário

## 🗄️ Comandos Úteis

```bash
npm run dev          # Inicia desenvolvimento
npm run build        # Build para produção
npm run start        # Inicia servidor produção
npm run lint         # Executa linter

npm run db:push      # Atualiza schema do banco
npm run db:studio    # Abre Prisma Studio
npm run db:generate  # Gera cliente Prisma
npm run db:migrate   # Cria nova migration
```

## 🌐 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório no [Vercel](https://vercel.com)
2. Configure as variáveis de ambiente
3. Deploy automático!

### Outras plataformas

- **Railway**: Suporte nativo para PostgreSQL
- **Render**: Free tier disponível
- **Fly.io**: Deploy global

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes

## 🙏 Créditos

Inspirado na **Mobilex** da **MTM Tecnologia** - plataforma low-code líder no Brasil.

---

**Desenvolvido com ❤️ usando as tecnologias mais modernas de 2025**
