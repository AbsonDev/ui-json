#!/bin/bash

# ============================================
# Script para Aplicar Migrações do Prisma
# ============================================
#
# Este script aplica as migrações do Prisma
# no banco de dados Railway
#
# USO: ./apply-migrations.sh
#
# ============================================

set -e

echo "🚀 Aplicando migrações do Prisma no Railway..."
echo ""

# ============================================
# Configurar DATABASE_URL
# ============================================
export DATABASE_URL="postgresql://postgres:kKfhSSRlDNDqXKOiyREVJfCZYyDcGthc@metro.proxy.rlwy.net:44511/railway"

# ============================================
# Ignorar erro de checksum (ambiente offline)
# ============================================
export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

# ============================================
# Verificar status atual das migrações
# ============================================
echo "📊 Verificando status das migrações..."
echo ""
npx prisma migrate status || true

echo ""
echo "============================================"
echo ""

# ============================================
# Aplicar migrações
# ============================================
echo "📦 Aplicando migrações pendentes..."
echo ""
npx prisma migrate deploy

echo ""
echo "============================================"
echo ""

# ============================================
# Verificar novamente o status
# ============================================
echo "✅ Verificando status final..."
echo ""
npx prisma migrate status

echo ""
echo "============================================"
echo ""
echo "🎉 Migrações aplicadas com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Verificar dados no Prisma Studio:"
echo "   npx prisma studio"
echo ""
echo "2. Ou via Railway Dashboard:"
echo "   https://railway.app → Seu Projeto → PostgreSQL → Data"
echo ""
echo "3. Adicionar variáveis no Vercel e fazer deploy:"
echo "   Ver: VERCEL_ENV_VARIABLES.txt"
echo ""
