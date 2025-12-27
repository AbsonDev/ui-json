#!/bin/bash

# ============================================
# Script de Configuração Automática - Vercel
# ============================================
#
# Este script adiciona todas as variáveis de ambiente
# no Vercel via CLI automaticamente
#
# USO:
# 1. Primeiro, edite a variável NEXTAUTH_URL abaixo
#    com a URL do seu projeto Vercel
# 2. Execute: chmod +x setup-vercel-env.sh
# 3. Execute: ./setup-vercel-env.sh
#
# ============================================

set -e

echo "🚀 Configurando variáveis de ambiente no Vercel..."
echo ""

# ============================================
# IMPORTANTE: EDITE ESTA LINHA!
# ============================================
# Substitua pela URL do seu projeto Vercel
# Exemplo: https://ui-json-xyz123.vercel.app
NEXTAUTH_URL="https://SEU-PROJETO.vercel.app"

# ============================================
# Verificação
# ============================================
if [[ "$NEXTAUTH_URL" == "https://SEU-PROJETO.vercel.app" ]]; then
  echo "❌ ERRO: Você precisa editar NEXTAUTH_URL no script!"
  echo ""
  echo "1. Abra o arquivo: setup-vercel-env.sh"
  echo "2. Encontre a linha: NEXTAUTH_URL=\"https://SEU-PROJETO.vercel.app\""
  echo "3. Substitua pela URL do seu projeto no Vercel"
  echo ""
  echo "Para descobrir sua URL:"
  echo "  - Vercel Dashboard → Seu Projeto → Domains"
  echo ""
  exit 1
fi

# ============================================
# Verificar se Vercel CLI está instalada
# ============================================
if ! command -v vercel &> /dev/null; then
  echo "📦 Instalando Vercel CLI..."
  npm install -g vercel
fi

# ============================================
# Login no Vercel
# ============================================
echo "🔐 Faça login no Vercel (se solicitado)..."
vercel login

# ============================================
# Link do projeto
# ============================================
echo "🔗 Linking projeto..."
vercel link

# ============================================
# Adicionar variáveis de ambiente
# ============================================
echo ""
echo "📝 Adicionando variáveis de ambiente..."
echo ""

# Database
vercel env add DATABASE_URL production preview development <<EOF
postgresql://postgres:kKfhSSRlDNDqXKOiyREVJfCZYyDcGthc@metro.proxy.rlwy.net:44511/railway
EOF

# NextAuth URL
vercel env add NEXTAUTH_URL production preview development <<EOF
$NEXTAUTH_URL
EOF

# NextAuth Secret
vercel env add NEXTAUTH_SECRET production preview development <<EOF
5XA6D/1+yic7XmFyFmqMXuBOmD7em/LlOy0FfJ6v4m0=
EOF

# Encryption Key
vercel env add ENCRYPTION_KEY production preview development <<EOF
8mj8ZvzXEdEh7slXy+tQ6PqGUWUVtOlJ
EOF

# Cron Secret
vercel env add CRON_SECRET production preview development <<EOF
5gloGZz+5FjufylkNuE5Iw0QJGOtIsvOoa8wTsoPEGw=
EOF

# Node Environment
vercel env add NODE_ENV production <<EOF
production
EOF

echo ""
echo "✅ Todas as variáveis foram adicionadas!"
echo ""
echo "📊 Próximos passos:"
echo ""
echo "1. Verificar variáveis:"
echo "   vercel env ls"
echo ""
echo "2. Fazer deploy:"
echo "   vercel --prod"
echo ""
echo "   Ou via Dashboard:"
echo "   Vercel → Deployments → Redeploy"
echo ""
echo "🎉 Configuração completa!"
