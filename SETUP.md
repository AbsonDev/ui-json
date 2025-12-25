# 🔧 Guia Completo de Setup

## 📦 Instalação do PostgreSQL

### macOS
```bash
brew install postgresql@14
brew services start postgresql@14
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Windows
Baixe o instalador em: https://www.postgresql.org/download/windows/

## 🗄️ Configuração do Banco de Dados

### 1. Criar o banco de dados

```bash
# Conectar ao PostgreSQL
psql postgres

# Dentro do psql:
CREATE DATABASE uijson;
CREATE USER uijson_user WITH ENCRYPTED PASSWORD 'sua_senha_aqui';
GRANT ALL PRIVILEGES ON DATABASE uijson TO uijson_user;
\q
```

### 2. Configurar DATABASE_URL

No arquivo `.env`:
```env
DATABASE_URL="postgresql://uijson_user:sua_senha_aqui@localhost:5432/uijson?schema=public"
```

## 🔑 Gerar NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Copie o resultado para o `.env`:
```env
NEXTAUTH_SECRET="resultado_aqui"
```

## 🤖 Obter GEMINI_API_KEY

1. Acesse: https://aistudio.google.com/app/apikey
2. Faça login com sua conta Google
3. Crie uma nova API key
4. Copie para o `.env`:

```env
GEMINI_API_KEY="sua_api_key_aqui"
```

## 🚀 Primeira Execução

```bash
# 1. Instalar dependências
npm install

# 2. Configurar .env
cp .env.example .env
# Edite o .env com suas credenciais

# 3. Criar schema no banco
npm run db:push

# 4. Iniciar servidor
npm run dev
```

## 🧪 Testando a Aplicação

1. Acesse http://localhost:3000
2. Você será redirecionado para `/login`
3. Clique em "Sign up" para criar uma conta
4. Faça login
5. Você será redirecionado para `/dashboard`

## 🐛 Troubleshooting

### Erro: "Can't reach database server"

**Solução:**
```bash
# Verifique se o PostgreSQL está rodando
sudo systemctl status postgresql  # Linux
brew services list  # macOS

# Tente conectar manualmente
psql -U uijson_user -d uijson -h localhost
```

### Erro: "Prisma Client is not generated"

**Solução:**
```bash
npm run db:generate
```

### Erro: "Invalid `prisma.user.create()`"

**Solução:**
```bash
# Recrie o schema
npm run db:push
```

### Porta 3000 já em uso

**Solução:**
```bash
# Linux/macOS
lsof -ti:3000 | xargs kill -9

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Ou use outra porta
PORT=3001 npm run dev
```

## 📊 Visualizar dados com Prisma Studio

```bash
npm run db:studio
```

Acesse: http://localhost:5555

## 🔄 Migrations (Produção)

Para ambientes de produção, use migrations:

```bash
# Criar migration
npm run db:migrate

# Aplicar migrations
npx prisma migrate deploy
```

## 🌐 Deploy na Vercel

1. **Push para GitHub**
```bash
git add .
git commit -m "Setup Next.js with PostgreSQL"
git push origin main
```

2. **Conectar na Vercel**
   - Acesse https://vercel.com
   - Import repository
   - Configure environment variables:
     - `DATABASE_URL`
     - `NEXTAUTH_URL` (sua URL da Vercel)
     - `NEXTAUTH_SECRET`
     - `GEMINI_API_KEY`

3. **Configurar banco de dados**
   - Use **Vercel Postgres** ou
   - **Neon** (https://neon.tech) - Free tier generoso
   - **Supabase** (https://supabase.com)

## 📚 Próximos Passos

- [ ] Criar seu primeiro app JSON
- [ ] Testar o AI Assistant
- [ ] Explorar a biblioteca de componentes
- [ ] Configurar database schema personalizado
- [ ] Deploy em produção

## 💡 Dicas

1. **Desenvolvimento local**: Use `npm run db:studio` para visualizar dados
2. **Debug**: Adicione `console.log` nos Server Actions
3. **Hot Reload**: Next.js recarrega automaticamente ao salvar
4. **TypeScript**: Use `Cmd+Click` (Mac) ou `Ctrl+Click` (Win) para navegar tipos

## 🆘 Precisa de ajuda?

- 📖 Docs Next.js: https://nextjs.org/docs
- 📖 Docs Prisma: https://www.prisma.io/docs
- 📖 Docs NextAuth: https://next-auth.js.org
- 💬 Abra uma issue no GitHub
