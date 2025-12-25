# Guia de Export Mobile por Projeto

Este guia explica como exportar **cada projeto criado na plataforma** como App Bundle (AAB) para Android ou IPA para iOS.

## 📋 Visão Geral

O UI JSON Visualizer permite que você:
1. Crie aplicações/projetos na plataforma
2. Exporte cada projeto como um aplicativo mobile independente
3. Publique cada aplicação nas lojas (Google Play Store / Apple App Store)

**Cada projeto = Um app mobile separado**

## 🎯 Como Funciona

### Fluxo de Export

```
1. Usuário cria projeto na plataforma
   ↓
2. Configura detalhes do app (nome, bundle ID, versão)
   ↓
3. Solicita export (Android AAB ou iOS IPA)
   ↓
4. Sistema gera build do projeto específico
   ↓
5. Download do AAB/IPA
   ↓
6. Upload para Google Play / App Store
```

## 🚀 Usando a Funcionalidade de Export

### 1. Criar ou Abrir Projeto

Na plataforma, crie ou abra um projeto existente.

### 2. Acessar Export Mobile

No projeto, clique em "Exportar para Mobile" ou use o botão de export.

### 3. Configurar Detalhes do App

Preencha as informações do aplicativo:

#### **Bundle ID / Package Name**
- Identificador único do app
- Formato: `com.empresa.nomedoapp`
- Exemplo: `com.mycompany.myproject`
- **Importante**: Cada projeto deve ter um bundle ID único

#### **Versão**
- Versão semântica (ex: 1.0.0, 1.2.3)
- Incrementar a cada update

#### **Version Code**
- Número inteiro incremental (1, 2, 3...)
- **Android**: Usado para determinar qual versão é mais recente
- Incrementar a cada release

#### **Descrição**
- Descrição breve do aplicativo
- Aparecerá nos metadados do app

### 4. Escolher Plataforma

#### Android (AAB)
- Gera App Bundle para Google Play Store
- Formato moderno e otimizado
- Google Play gera APKs específicos para cada dispositivo

#### iOS (IPA)
- Gera pacote IPA para Apple App Store
- **Requer**: macOS com Xcode (em produção)
- Para desenvolvimento: use simulador iOS

### 5. Tipo de Build

#### Debug
- Para testes e desenvolvimento
- Não requer assinatura
- Pode instalar diretamente em dispositivos de teste

#### Release
- Para publicação nas lojas
- **Requer assinatura** (certificados configurados)
- Otimizado e minificado

### 6. Solicitar Export

Clique em "Exportar" e aguarde o processo de build.

O sistema irá:
1. Gerar HTML/CSS/JS do projeto
2. Criar projeto Capacitor temporário
3. Configurar bundle ID e versão
4. Fazer build da plataforma escolhida
5. Disponibilizar download do AAB/IPA

## 📱 Publicação nas Lojas

### Google Play Store (Android AAB)

1. **Crie conta Google Play Developer** ($25 taxa única)
   - https://play.google.com/console

2. **Crie novo aplicativo**
   - Nome do app
   - Categoria
   - Idioma padrão

3. **Configure detalhes da loja**
   - Descrição completa
   - Screenshots (vários tamanhos)
   - Ícone (512x512px)
   - Feature graphic (1024x500px)
   - Classificação de conteúdo

4. **Faça upload do AAB**
   - Vá para "Releases" → "Production"
   - "Create new release"
   - Upload do arquivo .aab exportado
   - Preencha release notes

5. **Configure preço e disponibilidade**
   - Gratuito ou pago
   - Países disponíveis

6. **Submeta para revisão**
   - Primeira aprovação: ~3-7 dias
   - Updates posteriores: mais rápido

### Apple App Store (iOS IPA)

1. **Crie conta Apple Developer** ($99/ano)
   - https://developer.apple.com

2. **Registre o Bundle ID**
   - Developer Portal → Identifiers
   - Mesmo bundle ID configurado no export

3. **Crie App Store Connect App**
   - https://appstoreconnect.apple.com
   - "My Apps" → "+" → "New App"
   - Preencha informações básicas

4. **Prepare assets**
   - Screenshots (vários tamanhos de tela)
   - Ícone do app (1024x1024px)
   - Descrição e palavras-chave

5. **Upload do IPA**
   - Use Xcode ou Transporter app
   - Aguarde processamento (~15-30min)

6. **Configurar versão**
   - Selecione o build enviado
   - Preencha release notes
   - Informações de privacidade

7. **Submeta para revisão**
   - Primeira aprovação: 1-3 dias
   - Possível rejeição se não seguir guidelines

## 🔐 Assinatura de Apps (Release)

### Android

Para builds de release, você precisará:

1. **Gerar Keystore** (uma vez por projeto)
```bash
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore meu-projeto.keystore \
  -alias meu-projeto-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

2. **Guardar informações**
   - Keystore path
   - Keystore password
   - Key alias
   - Key password

3. **Configurar no export**
   - Fornecer credenciais ao solicitar export release
   - Ou configurar no servidor de build

**IMPORTANTE**: Faça backup do keystore! Se perder, não poderá atualizar o app na Play Store.

### iOS

Para builds de release iOS:

1. **Certificado de Distribuição**
   - Apple Developer Portal
   - Certificates → "+" → "Apple Distribution"

2. **Provisioning Profile**
   - Para o bundle ID específico
   - Tipo: "App Store"

3. **Configurar no Xcode**
   - Signing & Capabilities
   - Selecionar team
   - Selecionar provisioning profile

## 🏗️ Arquitetura do Sistema

### Componentes

```
UI JSON Visualizer (Plataforma)
    │
    ├─ Projetos dos Usuários
    │   ├─ Projeto A → Export → app-a.aab / app-a.ipa
    │   ├─ Projeto B → Export → app-b.aab / app-b.ipa
    │   └─ Projeto C → Export → app-c.aab / app-c.ipa
    │
    └─ Mobile Builder Service
        ├─ Template Generator (HTML/CSS/JS)
        ├─ Capacitor Project Builder
        ├─ Android Builder (Gradle)
        └─ iOS Builder (Xcode)
```

### API Endpoints

```typescript
// Solicitar export
POST /api/projects/:id/export
Body: {
  platform: 'android' | 'ios',
  buildType: 'debug' | 'release',
  config: {
    name: string,
    bundleId: string,
    version: string,
    versionCode: number,
    description?: string
  },
  signing?: {
    // Credenciais de assinatura (apenas release)
  }
}
Response: {
  id: string,
  status: 'pending' | 'building' | 'success' | 'failed',
  downloadUrl?: string
}

// Listar builds do projeto
GET /api/projects/:id/export
Response: {
  builds: BuildResult[]
}

// Download do build
GET /api/builds/:buildId/download
Response: Binary file (AAB ou IPA)
```

## 💻 Integração na UI

### Componente React

```tsx
import { MobileExportDialog } from '@/components/mobile-export/MobileExportDialog';

function ProjectView({ project }) {
  const [showExport, setShowExport] = useState(false);

  return (
    <div>
      {/* Botão de export */}
      <button onClick={() => setShowExport(true)}>
        📱 Exportar para Mobile
      </button>

      {/* Dialog de export */}
      <MobileExportDialog
        projectId={project.id}
        projectName={project.name}
        isOpen={showExport}
        onClose={() => setShowExport(false)}
      />
    </div>
  );
}
```

## 🔧 Configuração do Servidor

### Requisitos

#### Para Builds Android
- Node.js 18+
- JDK 17+
- Android SDK
- Gradle

#### Para Builds iOS
- macOS
- Xcode 14+
- CocoaPods

### Variáveis de Ambiente

```env
# Diretórios
BUILDS_DIR=/path/to/builds
TEMP_DIR=/path/to/temp

# Android SDK (opcional, se não estiver em PATH)
ANDROID_HOME=/path/to/android-sdk

# Configurações de build
MAX_CONCURRENT_BUILDS=2
BUILD_TIMEOUT=1800000  # 30 minutos
```

### Em Produção

Para produção, recomenda-se:

1. **Fila de Jobs** (Bull, BullMQ)
   - Processar builds em background
   - Múltiplos workers
   - Retry logic

2. **Servidores Dedicados**
   - Servidor Linux para Android builds
   - Servidor macOS para iOS builds

3. **Storage**
   - S3/GCS para armazenar builds
   - CDN para downloads

4. **Notificações**
   - Email quando build completar
   - Webhook para integração

## 📊 Exemplo Completo

### Cenário: App de E-commerce

1. **Criar projeto "Minha Loja"**
   - Configurar produtos, categorias, checkout
   - Testar na web

2. **Exportar para Android**
   - Bundle ID: `com.minhaloja.app`
   - Versão: 1.0.0
   - Plataforma: Android
   - Build: Release
   - Download: `minhaloja-1.0.0.aab`

3. **Publicar na Play Store**
   - Upload AAB
   - Screenshots da loja
   - Descrição
   - Publicar

4. **Atualizar app**
   - Fazer mudanças no projeto
   - Exportar novamente
   - Versão: 1.1.0
   - Version Code: 2
   - Upload update na Play Store

5. **Exportar para iOS**
   - Mesmo projeto
   - Bundle ID: `com.minhaloja.app` (mesmo)
   - Versão: 1.0.0
   - Plataforma: iOS
   - Upload na App Store

**Resultado**: Uma loja mobile publicada em ambas as plataformas, gerada a partir do mesmo projeto!

## 🎨 Customização de Apps

Cada projeto exportado pode ter:

- **Ícone personalizado**: Upload de ícone específico
- **Splash screen**: Tela de carregamento customizada
- **Cores**: Tema de cores do app
- **Nome**: Nome diferente por idioma
- **Funcionalidades nativas**: Câmera, GPS, notificações

## 📚 Recursos Adicionais

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Android App Signing](https://developer.android.com/studio/publish/app-signing)
- [iOS Distribution](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases)

## ❓ FAQ

**P: Posso exportar o mesmo projeto para Android e iOS?**
R: Sim! Use o mesmo bundle ID e versão em ambas as plataformas.

**P: Preciso pagar para publicar?**
R: Google Play: $25 (uma vez). Apple App Store: $99/ano.

**P: Quantos apps posso criar?**
R: Ilimitado! Cada projeto pode ser exportado como um app diferente.

**P: Posso atualizar apps já publicados?**
R: Sim! Exporte com versão e versionCode maiores.

**P: iOS builds funcionam sem macOS?**
R: Para testes no simulador, não. Para builds de produção, sim, macOS é obrigatório.

**P: Como adiciono funcionalidades nativas (câmera, GPS)?**
R: Configure plugins Capacitor no projeto antes de exportar.
