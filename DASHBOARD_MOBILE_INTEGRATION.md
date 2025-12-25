# Patch para integrar Mobile Export no Dashboard

## Alterações necessárias no arquivo src/app/dashboard/page.tsx

### 1. Adicionar imports (linha 14):

```typescript
import { Wand2, PlusCircle, FilePenLine, Trash2, Database, Workflow, Library, LogOut, Settings, Smartphone, History } from 'lucide-react'
import { MobileExportDialog } from '@/components/mobile-export/MobileExportDialog'
import { BuildHistory } from '@/components/mobile-export/BuildHistory'
```

### 2. Adicionar estados (após linha 121):

```typescript
  const [showMobileExport, setShowMobileExport] = useState(false)
  const [showBuildHistory, setShowBuildHistory] = useState(false)
```

### 3. Adicionar botões mobile (após linha 551, antes do div com database connections):

```typescript
                <div className="flex items-center gap-1 border-l pl-3 ml-1">
                    <button
                        onClick={() => setShowMobileExport(true)}
                        title="Exportar para Mobile"
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <Smartphone size={20} />
                    </button>
                    <button
                        onClick={() => setShowBuildHistory(true)}
                        title="Histórico de Builds"
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <History size={20} />
                    </button>
                </div>
```

### 4. Adicionar dialogs antes do fechamento (antes da linha 695):

```typescript
            {currentApp && (
              <>
                <MobileExportDialog
                  projectId={currentApp.id}
                  projectName={currentApp.name}
                  isOpen={showMobileExport}
                  onClose={() => setShowMobileExport(false)}
                />
                <BuildHistory
                  appId={currentApp.id}
                  isOpen={showBuildHistory}
                  onClose={() => setShowBuildHistory(false)}
                />
              </>
            )}
```

## Como aplicar:

1. Abra o arquivo `src/app/dashboard/page.tsx`
2. Adicione as importações no topo do arquivo
3. Adicione os dois estados após os outros estados
4. Adicione a div com os botões mobile após os botões de gerenciamento de apps
5. Adicione os componentes de dialog antes do fechamento do componente

## Após aplicar, execute:

```bash
npm run db:generate
npm run db:push
```

Para atualizar o schema do Prisma no banco de dados.
