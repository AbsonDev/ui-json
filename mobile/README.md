# UI JSON Visualizer - Aplicativos Mobile

Este diretório contém informações e recursos para os aplicativos mobile (Android e iOS) do UI JSON Visualizer.

## 📱 Plataformas Suportadas

- **Android**: App Bundle (AAB) para Google Play Store
- **iOS**: IPA para Apple App Store

## 🚀 Quick Start

### 1. Build Rápido

```bash
# Sincronizar código web com apps mobile
npm run mobile:sync

# Android: Abrir no Android Studio
npm run mobile:android:open

# iOS: Abrir no Xcode
npm run mobile:ios:open
```

### 2. Executar em Desenvolvimento

```bash
# Android (emulador ou dispositivo)
npm run mobile:android:run

# iOS (simulador ou dispositivo)
npm run mobile:ios:run
```

### 3. Build de Produção

```bash
# Android: Gera AAB assinado
npm run mobile:android:build

# iOS: Prepara para build no Xcode
npm run mobile:ios:build
```

## 📚 Documentação Completa

Consulte o [Guia Completo de Build Mobile](../docs/MOBILE_BUILD_GUIDE.md) para:

- Configuração detalhada de keystores e certificados
- Processo completo de publicação nas lojas
- Configuração de CI/CD
- Troubleshooting
- Checklist de release

## 🔑 Configuração de Assinatura

### Android

1. Gerar keystore:
```bash
./scripts/mobile/generate-android-keystore.sh
```

2. Configurar assinatura:
```bash
./scripts/mobile/setup-android-signing.sh
```

### iOS

1. Abrir projeto no Xcode:
```bash
npm run mobile:ios:open
```

2. Configurar Team e Signing no Xcode (Signing & Capabilities)

## 📦 Estrutura de Diretórios

```
├── android/                 # Projeto Android nativo
│   ├── app/
│   │   ├── src/
│   │   └── build.gradle    # Configuração de build AAB
│   ├── keystores/          # Keystores (não commitado)
│   └── gradle.properties   # Configurações de assinatura (não commitado)
│
├── ios/                    # Projeto iOS nativo
│   └── App/
│       ├── App/
│       └── App.xcodeproj
│
├── scripts/mobile/         # Scripts auxiliares
│   ├── generate-android-keystore.sh
│   └── setup-android-signing.sh
│
└── docs/
    └── MOBILE_BUILD_GUIDE.md   # Documentação completa
```

## 🔐 Segurança

### Arquivos Sensíveis (NÃO commitar!)

- `android/keystores/` - Keystores Android
- `android/gradle.properties` - Senhas e configurações
- `ios/*.mobileprovision` - Provisioning profiles iOS
- `ios/*.p12` - Certificados iOS

Estes arquivos já estão no `.gitignore`.

## 🛠️ Tecnologias

- **Capacitor 8**: Framework para apps híbridos
- **Next.js**: Aplicação web base
- **Android Gradle**: Build system Android
- **Xcode**: Build system iOS

## 📋 Comandos Úteis

```bash
# Atualizar Capacitor
npx cap update

# Ver logs do dispositivo
npx cap run android -l
npx cap run ios -l

# Limpar builds
cd android && ./gradlew clean
rm -rf ios/App/build

# Adicionar plugins Capacitor
npm install @capacitor/camera
npx cap sync
```

## 🆘 Suporte

Problemas ou dúvidas? Consulte:

1. [Guia de Build Mobile](../docs/MOBILE_BUILD_GUIDE.md)
2. [Capacitor Documentation](https://capacitorjs.com/docs)
3. [Issues do projeto](https://github.com/seu-usuario/ui-json/issues)

## 📝 Notas Importantes

- **Android**: Sempre faça backup do seu keystore. Se perdê-lo, não poderá atualizar o app na Play Store.
- **iOS**: Builds para App Store só podem ser feitos em macOS com Xcode.
- **Web → Mobile**: Sempre execute `npm run build` antes de `npx cap sync` para atualizar o código mobile.
- **Versionamento**: Atualize `versionCode` (Android) e `CFBundleVersion` (iOS) a cada release.

## 🎯 Próximos Passos

1. [ ] Configurar keystores e certificados
2. [ ] Testar build local
3. [ ] Configurar CI/CD
4. [ ] Criar contas de desenvolvedor (Play Store / App Store)
5. [ ] Preparar assets (ícones, screenshots)
6. [ ] Primeira publicação
