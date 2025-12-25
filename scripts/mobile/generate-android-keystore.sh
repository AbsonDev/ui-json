#!/bin/bash

# Script para gerar keystore Android para assinatura de App Bundle
# Este keystore é necessário para publicar na Google Play Store

echo "=========================================="
echo "Gerador de Keystore Android"
echo "=========================================="
echo ""

# Criar diretório para keystores se não existir
mkdir -p android/keystores

# Solicitar informações ao usuário
read -p "Nome do arquivo keystore (ex: release.keystore): " KEYSTORE_NAME
read -p "Alias da chave (ex: my-app-key): " KEY_ALIAS
read -p "Senha do keystore: " -s KEYSTORE_PASSWORD
echo ""
read -p "Senha do alias: " -s KEY_PASSWORD
echo ""
read -p "Nome completo (CN): " CN
read -p "Nome da organização (O): " O
read -p "Nome da unidade organizacional (OU): " OU
read -p "Cidade (L): " L
read -p "Estado (S): " S
read -p "Código do país (C, ex: BR): " C

# Gerar keystore
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore "android/keystores/${KEYSTORE_NAME}" \
  -alias "${KEY_ALIAS}" \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass "${KEYSTORE_PASSWORD}" \
  -keypass "${KEY_PASSWORD}" \
  -dname "CN=${CN}, OU=${OU}, O=${O}, L=${L}, S=${S}, C=${C}"

echo ""
echo "=========================================="
echo "Keystore gerado com sucesso!"
echo "=========================================="
echo ""
echo "Localização: android/keystores/${KEYSTORE_NAME}"
echo "Alias: ${KEY_ALIAS}"
echo ""
echo "IMPORTANTE: Guarde essas informações em um local seguro!"
echo "- Keystore path: android/keystores/${KEYSTORE_NAME}"
echo "- Alias: ${KEY_ALIAS}"
echo "- Senha do keystore: ${KEYSTORE_PASSWORD}"
echo "- Senha do alias: ${KEY_PASSWORD}"
echo ""
echo "Próximos passos:"
echo "1. Configure as variáveis de ambiente ou gradle.properties"
echo "2. Adicione o keystore ao .gitignore"
echo "3. Execute: npm run mobile:android:build"
echo ""
