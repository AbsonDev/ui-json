#!/bin/bash

# Script para configurar assinatura de App Bundle Android

echo "=========================================="
echo "Configuração de Assinatura Android"
echo "=========================================="
echo ""

# Verificar se keystore existe
if [ ! -d "android/keystores" ]; then
    echo "Diretório android/keystores não encontrado."
    echo "Execute primeiro: ./scripts/mobile/generate-android-keystore.sh"
    exit 1
fi

# Solicitar informações
read -p "Caminho do keystore (relativo a android/, ex: keystores/release.keystore): " KEYSTORE_PATH
read -p "Alias da chave: " KEY_ALIAS
read -p "Senha do keystore: " -s KEYSTORE_PASSWORD
echo ""
read -p "Senha do alias: " -s KEY_PASSWORD
echo ""

# Criar arquivo gradle.properties se não existir
GRADLE_PROPS="android/gradle.properties"

if [ ! -f "$GRADLE_PROPS" ]; then
    touch "$GRADLE_PROPS"
fi

# Adicionar configurações de assinatura
cat >> "$GRADLE_PROPS" << EOF

# Configurações de assinatura do App Bundle
RELEASE_STORE_FILE=${KEYSTORE_PATH}
RELEASE_STORE_PASSWORD=${KEYSTORE_PASSWORD}
RELEASE_KEY_ALIAS=${KEY_ALIAS}
RELEASE_KEY_PASSWORD=${KEY_PASSWORD}
EOF

echo ""
echo "=========================================="
echo "Configuração concluída!"
echo "=========================================="
echo ""
echo "As configurações foram adicionadas a android/gradle.properties"
echo ""
echo "IMPORTANTE:"
echo "1. Adicione gradle.properties ao .gitignore"
echo "2. Use variáveis de ambiente em CI/CD"
echo "3. Nunca commite senhas no repositório"
echo ""
