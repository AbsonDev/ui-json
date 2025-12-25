# Guia de Build Mobile - Android AAB e iOS IPA

Este guia explica como gerar App Bundles (AAB) para Android e arquivos IPA para iOS, permitindo publicação na Google Play Store e Apple App Store.

## Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração Inicial](#configuração-inicial)
3. [Build para Android (AAB)](#build-para-android-aab)
4. [Build para iOS (IPA)](#build-para-ios-ipa)
5. [Publicação nas Lojas](#publicação-nas-lojas)
6. [CI/CD](#cicd)
7. [Troubleshooting](#troubleshooting)

## Pré-requisitos

### Para Android

- **JDK 17 ou superior**
- **Android Studio** (recomendado) ou Android SDK Command-line tools
- **Gradle** (incluído no projeto)
- Conta de desenvolvedor Google Play ($25 taxa única)

### Para iOS

- **macOS** (obrigatório para builds iOS)
- **Xcode 14+**
- **CocoaPods** (`sudo gem install cocoapods`)
- Conta Apple Developer ($99/ano)

## Configuração Inicial

### 1. Instalar Dependências

```bash
npm install
```

### 2. Build da Aplicação Web

```bash
npm run build
```

### 3. Sincronizar com Plataformas Mobile

```bash
npm run mobile:sync
```

Este comando:
- Faz build do Next.js para exportação estática
- Copia os arquivos para as pastas Android e iOS
- Atualiza as configurações nativas

## Build para Android (AAB)

### Passo 1: Gerar Keystore

O keystore é necessário para assinar seu app e publicá-lo na Play Store.

```bash
./scripts/mobile/generate-android-keystore.sh
```

Siga as instruções e forneça:
- Nome do arquivo (ex: `release.keystore`)
- Alias da chave (ex: `my-app-key`)
- Senhas (guarde em local seguro!)
- Informações do certificado (nome, organização, etc.)

**IMPORTANTE:**
- Guarde o keystore e senhas em local MUITO seguro
- Se perder o keystore, não poderá atualizar o app na Play Store
- Nunca commite o keystore no Git

### Passo 2: Configurar Assinatura

```bash
./scripts/mobile/setup-android-signing.sh
```

Este script configura o `android/gradle.properties` com as informações do keystore.

**Alternativa:** Configure manualmente criando `android/gradle.properties`:

```properties
RELEASE_STORE_FILE=keystores/release.keystore
RELEASE_STORE_PASSWORD=sua-senha-keystore
RELEASE_KEY_ALIAS=my-app-key
RELEASE_KEY_PASSWORD=sua-senha-alias
```

### Passo 3: Gerar App Bundle (AAB)

```bash
npm run mobile:android:build
```

O arquivo AAB será gerado em:
```
android/app/build/outputs/bundle/release/app-release.aab
```

### Passo 4: Testar o App Bundle

Antes de enviar para a Play Store, teste localmente:

```bash
# Converter AAB para APKs e instalar
bundletool build-apks --bundle=android/app/build/outputs/bundle/release/app-release.aab \
  --output=app.apks \
  --ks=android/keystores/release.keystore \
  --ks-key-alias=my-app-key

bundletool install-apks --apks=app.apks
```

## Build para iOS (IPA)

### Passo 1: Configurar no Xcode

1. Abra o projeto no Xcode:
```bash
npm run mobile:ios:open
```

2. No Xcode:
   - Selecione o projeto "App" no navegador
   - Vá para "Signing & Capabilities"
   - Selecione seu Team (conta Apple Developer)
   - Configure o Bundle Identifier (ex: `com.uijson.visualizer`)
   - Certifique-se que "Automatically manage signing" está habilitado

### Passo 2: Configurar Provisioning Profile (Produção)

Para builds de produção (App Store):

1. Acesse [Apple Developer Portal](https://developer.apple.com)
2. Vá para "Certificates, Identifiers & Profiles"
3. Crie um "App Store Distribution" provisioning profile
4. Baixe e instale no Xcode

### Passo 3: Fazer Build do App

1. No Xcode, selecione:
   - Target: "App"
   - Device: "Any iOS Device (arm64)"

2. Menu: Product → Archive

3. Após o build, a janela "Organizer" abrirá automaticamente

### Passo 4: Exportar IPA

Na janela Organizer:

1. Selecione o arquivo mais recente
2. Clique em "Distribute App"
3. Escolha "App Store Connect"
4. Siga o assistente:
   - Upload ou Export (escolha conforme preferir)
   - Automatic signing (recomendado)
   - Revise as configurações
   - Export

O arquivo `.ipa` será exportado para a pasta escolhida.

### Passo 5: Upload para App Store Connect

Via Xcode:
- Durante a exportação, escolha "Upload" em vez de "Export"

Via Transporter:
1. Abra o app "Transporter" (incluído no macOS)
2. Arraste o arquivo `.ipa`
3. Clique em "Deliver"

## Publicação nas Lojas

### Google Play Store

1. Acesse [Google Play Console](https://play.google.com/console)
2. Crie um novo app ou selecione existente
3. Vá para "Release" → "Production"
4. Clique em "Create new release"
5. Upload do arquivo AAB
6. Preencha as informações:
   - Release notes
   - Screenshots
   - Descrição do app
   - Ícone e recursos gráficos
7. Submeta para revisão

**Primeira publicação:** Pode levar alguns dias para aprovação.

### Apple App Store

1. Acesse [App Store Connect](https://appstoreconnect.apple.com)
2. Crie um novo app ou selecione existente
3. Preencha as informações do app:
   - Nome, descrição, palavras-chave
   - Screenshots (vários tamanhos de tela)
   - Ícone
   - Categoria
4. Na aba "Build", selecione o build enviado
5. Preencha informações de revisão
6. Submeta para revisão

**Primeira publicação:** Geralmente 1-3 dias para revisão.

## CI/CD

### GitHub Actions - Android

Crie `.github/workflows/android-build.yml`:

```yaml
name: Android Build

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Setup JDK
      uses: actions/setup-java@v3
      with:
        distribution: 'temurin'
        java-version: '17'

    - name: Install dependencies
      run: npm ci --legacy-peer-deps

    - name: Build web app
      run: npm run build

    - name: Sync Capacitor
      run: npx cap sync android

    - name: Decode Keystore
      env:
        KEYSTORE_BASE64: ${{ secrets.KEYSTORE_BASE64 }}
      run: |
        echo $KEYSTORE_BASE64 | base64 -d > android/keystores/release.keystore

    - name: Build AAB
      env:
        RELEASE_STORE_FILE: keystores/release.keystore
        RELEASE_STORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
        RELEASE_KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
        RELEASE_KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
      run: cd android && ./gradlew bundleRelease

    - name: Upload AAB
      uses: actions/upload-artifact@v3
      with:
        name: app-release
        path: android/app/build/outputs/bundle/release/app-release.aab
```

### Configurar Secrets no GitHub

1. Codifique seu keystore em base64:
```bash
base64 -i android/keystores/release.keystore | pbcopy
```

2. No GitHub, vá para Settings → Secrets → Actions
3. Adicione os secrets:
   - `KEYSTORE_BASE64`: (conteúdo copiado)
   - `KEYSTORE_PASSWORD`: senha do keystore
   - `KEY_ALIAS`: alias da chave
   - `KEY_PASSWORD`: senha do alias

### GitHub Actions - iOS

Para iOS, você precisará de um macOS runner (GitHub Actions ou self-hosted):

```yaml
name: iOS Build

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: macos-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm ci --legacy-peer-deps

    - name: Build web app
      run: npm run build

    - name: Sync Capacitor
      run: npx cap sync ios

    - name: Install CocoaPods
      run: cd ios/App && pod install

    - name: Build IPA
      run: |
        xcodebuild -workspace ios/App/App.xcworkspace \
          -scheme App \
          -archivePath build/App.xcarchive \
          -configuration Release \
          archive

    - name: Export IPA
      run: |
        xcodebuild -exportArchive \
          -archivePath build/App.xcarchive \
          -exportPath build \
          -exportOptionsPlist ios/exportOptions.plist
```

## Troubleshooting

### Android

**Erro: "Keystore not found"**
- Verifique se o arquivo `android/gradle.properties` está configurado
- Certifique-se que o caminho do keystore está correto

**Erro: "SDK not found"**
- Instale Android Studio ou configure `ANDROID_HOME`
- Adicione ao `.bashrc` ou `.zshrc`:
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

**App não inicia no dispositivo**
- Verifique se fez `npm run build` antes de `cap sync`
- Limpe o build: `cd android && ./gradlew clean`

### iOS

**Erro: "No signing certificate"**
- Certifique-se que está logado com sua conta Apple Developer no Xcode
- Vá para Xcode → Preferences → Accounts → Adicione sua conta

**Erro: "Provisioning profile doesn't match"**
- Verifique se o Bundle ID está correto
- Regenre o provisioning profile no Apple Developer Portal

**App não abre no dispositivo**
- Verifique se o dispositivo está na lista de dispositivos no provisioning profile
- Em dispositivos físicos, vá para Settings → General → VPN & Device Management → Confie no desenvolvedor

## Scripts Disponíveis

```bash
# Build e sync
npm run mobile:sync               # Build web + sync com Android e iOS

# Android
npm run mobile:android:open       # Abre projeto no Android Studio
npm run mobile:android:build      # Gera AAB de release
npm run mobile:android:run        # Executa em emulador/dispositivo

# iOS
npm run mobile:ios:open           # Abre projeto no Xcode
npm run mobile:ios:build          # Prepara build iOS
npm run mobile:ios:run            # Executa em simulador/dispositivo

# Utilitários
./scripts/mobile/generate-android-keystore.sh   # Gera keystore Android
./scripts/mobile/setup-android-signing.sh       # Configura assinatura Android
```

## Recursos Adicionais

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [App Store Connect Help](https://developer.apple.com/app-store-connect/)
- [Android App Bundle](https://developer.android.com/guide/app-bundle)
- [iOS App Distribution](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases)

## Checklist de Publicação

### Antes da Primeira Publicação

- [ ] Testou o app em dispositivos reais
- [ ] Configurou ícones do app para todos os tamanhos
- [ ] Criou screenshots para ambas as plataformas
- [ ] Preparou textos de descrição e marketing
- [ ] Revisou políticas de privacidade
- [ ] Configurou contas de desenvolvedor (Google Play + Apple)
- [ ] Configurou keystores/certificados de forma segura

### Antes de Cada Release

- [ ] Incrementou versionCode (Android) e version (iOS)
- [ ] Testou novas funcionalidades
- [ ] Preparou release notes
- [ ] Build de produção testado
- [ ] Backup de keystores/certificados atualizado
