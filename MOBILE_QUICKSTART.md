# 📱 Mobile Quick Start - Export de Projetos

Guia rápido para exportar **projetos criados na plataforma** como AAB (Android) ou IPA (iOS).

## 🎯 Conceito

Cada projeto/aplicação criado na plataforma pode ser exportado como um aplicativo mobile independente:

- **Projeto A** → `app-a.aab` / `app-a.ipa`
- **Projeto B** → `app-b.aab` / `app-b.ipa`
- **Projeto C** → `app-c.aab` / `app-c.ipa`

Cada app pode ser publicado separadamente nas lojas!

## ⚡ Como Exportar um Projeto

### 1. Via Interface Web

1. Abra seu projeto na plataforma
2. Clique em "📱 Exportar para Mobile"
3. Configure:
   - Plataforma (Android ou iOS)
   - Bundle ID (ex: `com.myapp.myproject`)
   - Versão (ex: `1.0.0`)
   - Tipo de build (Debug ou Release)
4. Clique em "Exportar"
5. Faça download do AAB ou IPA

### 2. Via API

```bash
curl -X POST http://localhost:3000/api/projects/{project-id}/export \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "android",
    "buildType": "debug",
    "config": {
      "name": "Meu App",
      "bundleId": "com.myapp.myproject",
      "version": "1.0.0",
      "versionCode": 1
    }
  }'
```

## 🎯 Publicação nas Lojas

### Android (Google Play Store)

1. **Gere um keystore** (uma vez por projeto):
```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore myproject.keystore \
  -alias myproject-key \
  -keyalg RSA -keysize 2048 -validity 10000
```

2. **Exporte o projeto** (Release) com o keystore configurado

3. **Publique na Play Store**:
   - Crie app no Google Play Console
   - Upload do AAB exportado
   - Configure detalhes da loja
   - Submeta para revisão

### iOS (Apple App Store)

1. **Configure certificados** no Apple Developer Portal

2. **Exporte o projeto** para iOS

3. **Use Xcode ou Transporter** para upload

4. **Configure no App Store Connect** e submeta

## 📚 Documentação Completa

- **[Guia de Export de Projetos](docs/PROJECT_EXPORT_GUIDE.md)** - Documentação completa
- **[Guia de Build Manual](docs/MOBILE_BUILD_GUIDE.md)** - Para builds avançados
- **[Mobile README](mobile/README.md)** - Visão geral técnica

## 🔐 Importante

- **Bundle ID único**: Cada projeto deve ter um bundle ID diferente
- **Keystore Android**: Faça backup! Se perder, não poderá atualizar o app
- **Versionamento**: Incremente versão e versionCode a cada release
- **iOS requer macOS**: Builds de produção iOS necessitam macOS + Xcode

## 🆘 Problemas?

Consulte a seção de [Troubleshooting](docs/MOBILE_BUILD_GUIDE.md#troubleshooting) no guia completo.

## 🏗️ Arquitetura do Sistema

```
UI JSON Visualizer (Plataforma Web)
    │
    ├── Usuários criam Projetos
    │   ├── Projeto "Minha Loja"
    │   ├── Projeto "App Fitness"
    │   └── Projeto "Portfolio"
    │
    └── Sistema de Export Mobile
        ├── API: /api/projects/:id/export
        ├── MobileBuilder Service
        ├── Template Generator
        └── Build Workers
            ├── Android Builder → AAB
            └── iOS Builder → IPA
```

## ✅ Checklist de Export

Para cada projeto que você quer publicar:

- [ ] Definir Bundle ID único (ex: `com.empresa.nomedoprojeto`)
- [ ] Preparar ícone do app (512x512px)
- [ ] Preparar splash screen
- [ ] Exportar como Debug para testes
- [ ] Testar em dispositivo físico
- [ ] (Release) Gerar keystore Android
- [ ] Exportar como Release
- [ ] Preparar screenshots e descrições
- [ ] Criar conta Developer (se ainda não tem)
- [ ] Publicar na loja!

## 🚀 Exemplos de Uso

### Exemplo 1: E-commerce

```javascript
// Criar projeto de loja
const project = createProject({
  name: "Minha Loja Online",
  type: "ecommerce"
});

// Exportar para Android
exportProject(project.id, {
  platform: "android",
  bundleId: "com.minhaloja.app",
  version: "1.0.0"
});

// Resultado: minhaloja-app.aab
```

### Exemplo 2: Múltiplos Apps

```javascript
// Criar vários projetos
const appLoja = createProject({ name: "Loja" });
const appBlog = createProject({ name: "Blog" });
const appPortfolio = createProject({ name: "Portfólio" });

// Exportar cada um como app separado
export(appLoja, "com.empresa.loja");
export(appBlog, "com.empresa.blog");
export(appPortfolio, "com.empresa.portfolio");

// Resultado: 3 apps diferentes publicáveis
```

## 📊 Casos de Uso

- **Agências**: Crie apps diferentes para cada cliente
- **Desenvolvedores**: Publique múltiplas apps na mesma conta
- **Empresas**: Diferentes apps para diferentes produtos
- **Freelancers**: Portfolio de apps publicados

## 🆘 Suporte

**Dúvidas?** Consulte:
1. [Guia de Export de Projetos](docs/PROJECT_EXPORT_GUIDE.md) - Documentação completa
2. [FAQ e Troubleshooting](docs/PROJECT_EXPORT_GUIDE.md#faq)

**Pronto para exportar seu primeiro projeto!** 🎉
