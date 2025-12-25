# Mobile Builder Service

Serviço para exportar projetos criados na plataforma como App Bundles (AAB) ou IPA.

## Visão Geral

O Mobile Builder permite que cada projeto criado no UI JSON Visualizer seja exportado como um aplicativo mobile independente para Android ou iOS.

## Arquitetura

```
MobileBuilder Service
│
├── Types (types.ts)
│   ├── BuildRequest
│   ├── BuildResult
│   ├── ProjectConfig
│   └── ExportOptions
│
├── MobileBuilder (MobileBuilder.ts)
│   ├── generateProjectFiles()  # Gera HTML/CSS/JS
│   ├── createCapacitorProject() # Cria projeto Capacitor
│   ├── syncCapacitor()         # Sincroniza plataforma
│   ├── buildAndroid()          # Gera AAB
│   ├── buildIOS()              # Gera IPA
│   └── prepareDownload()       # Prepara arquivo final
│
└── API Routes
    ├── /api/projects/[id]/export  # POST: Solicita build
    │                               # GET: Lista builds
    └── /api/builds/[id]/download  # GET: Download AAB/IPA
```

## Uso

### Via API

```typescript
// POST /api/projects/:id/export
const response = await fetch(`/api/projects/${projectId}/export`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    platform: 'android', // ou 'ios'
    buildType: 'debug',  // ou 'release'
    config: {
      name: 'Meu App',
      bundleId: 'com.myapp.myproject',
      version: '1.0.0',
      versionCode: 1,
      description: 'Descrição do app'
    }
  })
});

const result = await response.json();
// { id, status, downloadUrl, ... }
```

### Via Componente React

```tsx
import { MobileExportDialog } from '@/components/mobile-export/MobileExportDialog';

<MobileExportDialog
  projectId={project.id}
  projectName={project.name}
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
/>
```

### Programaticamente

```typescript
import { mobileBuilder } from '@/lib/mobile-builder/MobileBuilder';

await mobileBuilder.initialize();

const result = await mobileBuilder.buildProject({
  projectId: 'abc123',
  platform: 'android',
  buildType: 'release',
  config: {
    id: 'abc123',
    name: 'Meu App',
    bundleId: 'com.myapp.myproject',
    version: '1.0.0',
    versionCode: 1
  }
});

if (result.status === 'success') {
  console.log('Build pronto:', result.downloadUrl);
}
```

## Fluxo de Build

1. **Recebe requisição** com configuração do projeto
2. **Gera arquivos web** (HTML/CSS/JS) baseado no projeto
3. **Cria projeto Capacitor** temporário
4. **Adiciona plataforma** (Android ou iOS)
5. **Sincroniza** código web com plataforma nativa
6. **Faz build**:
   - Android: `./gradlew bundleRelease` → AAB
   - iOS: `xcodebuild archive` → IPA
7. **Prepara download** e retorna URL

## Configuração

### Variáveis de Ambiente

```env
BUILDS_DIR=/path/to/builds
ANDROID_HOME=/path/to/android-sdk
```

### Requisitos

#### Android
- Node.js 18+
- JDK 17+
- Android SDK
- Gradle

#### iOS
- macOS
- Xcode 14+
- CocoaPods

## Tipos

### BuildRequest

```typescript
interface BuildRequest {
  projectId: string;
  platform: 'android' | 'ios';
  buildType: 'debug' | 'release';
  config: ProjectConfig;
}
```

### ProjectConfig

```typescript
interface ProjectConfig {
  id: string;
  name: string;
  bundleId: string;      // com.myapp.myproject
  version: string;       // 1.0.0
  versionCode: number;   // 1, 2, 3...
  description?: string;
  author?: string;
  icon?: string;
  splashScreen?: string;
}
```

### BuildResult

```typescript
interface BuildResult {
  id: string;
  projectId: string;
  platform: 'android' | 'ios';
  buildType: 'debug' | 'release';
  status: 'pending' | 'building' | 'success' | 'failed';
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}
```

## Personalização

### Template HTML/CSS/JS

Customize os templates em `MobileBuilder.ts`:

```typescript
private generateHTML(config: ProjectConfig): string {
  // Seu template HTML customizado
}

private generateCSS(config: ProjectConfig): string {
  // Seu template CSS customizado
}

private generateJS(config: ProjectConfig): string {
  // Seu template JS customizado
}
```

### Build Process

Estenda `MobileBuilder` para customizar o processo:

```typescript
class CustomMobileBuilder extends MobileBuilder {
  async buildProject(request: BuildRequest) {
    // Lógica customizada antes do build
    const result = await super.buildProject(request);
    // Lógica customizada depois do build
    return result;
  }
}
```

## Produção

Em produção, recomenda-se:

1. **Fila de Jobs** (Bull/BullMQ)
   ```typescript
   import Queue from 'bull';
   const buildQueue = new Queue('mobile-builds');

   buildQueue.process(async (job) => {
     return await mobileBuilder.buildProject(job.data);
   });
   ```

2. **Workers Separados**
   - Worker Linux para Android
   - Worker macOS para iOS

3. **Storage Cloud** (S3/GCS)
   ```typescript
   await uploadToS3(buildPath, `builds/${buildId}.aab`);
   ```

4. **Notificações**
   ```typescript
   await sendEmail(user, {
     subject: 'Build concluído!',
     downloadUrl: result.downloadUrl
   });
   ```

## Exemplos

### Build Debug para Testes

```typescript
const result = await mobileBuilder.buildProject({
  projectId: 'test-project',
  platform: 'android',
  buildType: 'debug',
  config: {
    id: 'test-project',
    name: 'Test App',
    bundleId: 'com.test.app',
    version: '0.1.0',
    versionCode: 1
  }
});
```

### Build Release com Assinatura

```typescript
const result = await mobileBuilder.buildProject({
  projectId: 'prod-project',
  platform: 'android',
  buildType: 'release',
  config: { /* ... */ }
}, {
  includeAssets: true,
  minify: true,
  signing: {
    keystorePath: 'keystores/release.keystore',
    keystorePassword: process.env.KEYSTORE_PASSWORD,
    keyAlias: 'release-key',
    keyPassword: process.env.KEY_PASSWORD
  }
});
```

## Limitações Atuais

- Builds são síncronos (bloqueiam a requisição)
- Não há persistência de builds em banco de dados
- iOS builds requerem macOS
- Não há sistema de fila/retry
- Limpeza manual de builds antigos

## Melhorias Futuras

- [ ] Fila de builds assíncronos
- [ ] Persistência em banco de dados
- [ ] Sistema de cache de builds
- [ ] Suporte a plugins Capacitor personalizados
- [ ] Build incremental
- [ ] Retry automático em falhas
- [ ] Logs detalhados por build
- [ ] UI para monitorar builds em andamento

## Troubleshooting

### Erro: "Android SDK not found"

```bash
export ANDROID_HOME=/path/to/android-sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### Erro: "gradlew: Permission denied"

```bash
chmod +x android/gradlew
```

### Erro: "Xcode not found" (iOS)

macOS é obrigatório para builds iOS. Use um servidor macOS ou serviço de CI/CD como GitHub Actions com runner macOS.

## Licença

Parte do projeto UI JSON Visualizer.
