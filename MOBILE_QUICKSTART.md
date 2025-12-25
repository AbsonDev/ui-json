# 📱 Mobile Quick Start - AAB e IPA

Guia rápido para gerar builds mobile do UI JSON Visualizer.

## ⚡ Comandos Essenciais

```bash
# 1. Sincronizar código web → mobile
npm run mobile:sync

# 2. Android: Gerar AAB (App Bundle)
npm run mobile:android:build

# 3. iOS: Abrir Xcode e fazer build
npm run mobile:ios:open
```

## 🎯 Para Começar

### Android (Google Play Store)

1. **Criar Keystore**
```bash
./scripts/mobile/generate-android-keystore.sh
```

2. **Configurar Assinatura**
```bash
./scripts/mobile/setup-android-signing.sh
```

3. **Gerar AAB**
```bash
npm run mobile:android:build
```

4. **AAB gerado em:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

### iOS (Apple App Store)

1. **Abrir Xcode**
```bash
npm run mobile:ios:open
```

2. **Configurar Signing** (no Xcode)
   - Selecione seu Team (Apple Developer)
   - Verifique Bundle ID: `com.uijson.visualizer`

3. **Build e Archive**
   - Menu: Product → Archive
   - Organizer → Distribute App → App Store

## 📚 Documentação Completa

- **[Guia Completo de Build](docs/MOBILE_BUILD_GUIDE.md)** - Instruções detalhadas
- **[Mobile README](mobile/README.md)** - Visão geral e comandos

## 🔐 Importante

- **Keystore Android**: Faça backup! Se perder, não poderá atualizar o app.
- **Não committar**: Keystores, certificados e senhas já estão no `.gitignore`
- **iOS requer macOS**: Builds iOS só funcionam em macOS com Xcode

## 🆘 Problemas?

Consulte a seção de [Troubleshooting](docs/MOBILE_BUILD_GUIDE.md#troubleshooting) no guia completo.

## 📦 Estrutura Criada

```
ui-json/
├── capacitor.config.ts           # Configuração Capacitor
├── android/                      # Projeto Android
│   ├── app/build.gradle         # ✅ AAB configurado
│   └── keystores/               # Seus keystores (não commitado)
├── ios/                         # Projeto iOS
│   ├── App/                     # Projeto Xcode
│   └── exportOptions.plist      # Configuração de export
├── scripts/mobile/              # Scripts auxiliares
│   ├── generate-android-keystore.sh
│   └── setup-android-signing.sh
├── docs/
│   └── MOBILE_BUILD_GUIDE.md   # 📖 Guia completo
└── .github/workflows/
    └── mobile-build.yml        # 🤖 CI/CD configurado
```

## ✅ Checklist Inicial

- [ ] Executar `npm install`
- [ ] Gerar keystore Android
- [ ] Configurar assinatura Android
- [ ] Testar build: `npm run mobile:android:build`
- [ ] (iOS) Configurar Team no Xcode
- [ ] (iOS) Testar archive no Xcode
- [ ] Preparar ícones e screenshots
- [ ] Criar contas Developer (Google Play + Apple)

## 🚀 Próximos Passos

1. Teste local dos apps
2. Configure CI/CD (secrets no GitHub)
3. Prepare assets da loja (ícones, screenshots, descrições)
4. Primeira publicação!

**Pronto para publicar? Consulte o [Guia Completo](docs/MOBILE_BUILD_GUIDE.md)!**
