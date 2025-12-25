'use client'

import React, { useState, useMemo, useCallback, useEffect, createContext, useRef } from 'react'
import { UIApp, UIScreen, UIAction, UIComponent } from '@/types'
import { Renderer } from '@/components/Renderer'
import { ActionContext } from '@/hooks/useAction'
import { DatabaseContext } from '@/hooks/useDatabase'
import { SessionContext } from '@/hooks/useSession'
import { AIAssistant } from '@/components/AIAssistant'
import { DatabaseEditor } from '@/components/DatabaseEditor'
import { AuthScreen } from '@/components/AuthScreen'
import { FlowBuilder } from '@/components/FlowBuilder'
import { Snippets } from '@/components/Snippets'
import { Wand2, PlusCircle, FilePenLine, Trash2, Database, Workflow, Library, LogOut, Settings } from 'lucide-react'
import { useApps } from '@/hooks/useApps'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'

// --- Context for Design Tokens ---
export const DesignTokensContext = createContext<Record<string, any>>({})
const resolveToken = (value: any, tokens: Record<string, any>): any => {
    if (typeof value === 'string' && value.startsWith('$')) {
        const tokenName = value.substring(1)
        return tokens[tokenName] || value
    }
    return value
}

// --- Custom Dialog Component ---
interface DialogProps {
  config: {
    type: 'prompt' | 'confirm' | 'alert'
    title: string
    message: string
    defaultValue?: string
    onConfirm: (value?: string) => void
  }
  onClose: () => void
}

const CustomDialog: React.FC<DialogProps> = ({ config, onClose }) => {
  const [inputValue, setInputValue] = useState(config.defaultValue || '')

  const handleConfirm = () => {
    config.onConfirm(config.type === 'prompt' ? inputValue : undefined)
    onClose()
  }

  const handleCancel = useCallback(() => {
    onClose()
  }, [onClose])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleCancel])

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
        <h3 id="dialog-title" className="text-lg font-bold mb-2 text-gray-900">{config.title}</h3>
        <p className="text-gray-700 mb-4">{config.message}</p>

        {config.type === 'prompt' && (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm mb-4 text-gray-900"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm() }}
          />
        )}

        <div className="flex justify-end space-x-2">
          {config.type !== 'alert' && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300"
            >
              Cancelar
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {config.type === 'confirm' ? 'Confirmar' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  // PostgreSQL integration
  const { apps, loading, error: appsError, createNewApp, updateAppData, deleteAppById } = useApps()

  const [selectedAppIndex, setSelectedAppIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const currentApp = apps[selectedAppIndex]
  const jsonString = useMemo(() => currentApp?.json || '', [currentApp])

  const [error, setError] = useState<string | null>(null)
  const [currentScreenId, setCurrentScreenId] = useState<string | null>(null)
  const [formState, setFormState] = useState<Record<string, any>>({})
  const [popup, setPopup] = useState<{ title?: string; message: string; variant: 'alert' | 'info' | 'confirm', buttons?: any[] } | null>(null)
  const [activeTab, setActiveTab] = useState<'editor' | 'ai' | 'database' | 'flow' | 'snippets'>('editor')
  const [dialog, setDialog] = useState<DialogProps['config'] | null>(null)
  const [databaseData, setDatabaseData] = useState<Record<string, any>>({})
  const [session, setSession] = useState<{ user: any } | null>(null)

  // Load database data from current app
  useEffect(() => {
    if (currentApp?.databaseData) {
      setDatabaseData(currentApp.databaseData)
    } else {
      setDatabaseData({})
    }
  }, [currentApp?.id])

  const uiApp: UIApp | null = useMemo(() => {
    try {
      if (!jsonString) return null
      const parsed = JSON.parse(jsonString)
      setError(null)
      if (!currentScreenId || !parsed.screens[currentScreenId] && !currentScreenId.startsWith('auth:')) {
        setCurrentScreenId(parsed.initialScreen)
      }
      return parsed
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message)
      } else {
        setError('An unknown error occurred while parsing JSON.')
      }
      return null
    }
  }, [jsonString, currentScreenId])

  const authConfig = uiApp?.app.authentication
  const designTokens = uiApp?.app.designTokens || {}

  // Auto-save JSON changes (debounced)
  const handleSetJsonString = useCallback((newJson: string) => {
    if (!currentApp) return

    // Update local state immediately for responsive UI
    const updatedApp = { ...currentApp, json: newJson }
    apps[selectedAppIndex] = updatedApp

    // Debounce save to database
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    setSaving(true)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateAppData(currentApp.id, { json: newJson })
      } catch (err) {
        console.error('Error saving app:', err)
      } finally {
        setSaving(false)
      }
    }, 1000) // Save 1 second after user stops typing
  }, [currentApp, apps, selectedAppIndex, updateAppData])

  // Auto-save database data changes
  useEffect(() => {
    if (!currentApp || !databaseData) return

    const timeoutId = setTimeout(async () => {
      try {
        await updateAppData(currentApp.id, { databaseData })
      } catch (err) {
        console.error('Error saving database data:', err)
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [databaseData, currentApp, updateAppData])

  // Sync database data structure with schema
  useEffect(() => {
    const appSchema = uiApp?.app.databaseSchema
    if (appSchema) {
      setDatabaseData(prevDbData => {
        const newAppData = { ...prevDbData }
        let needsUpdate = false

        for (const tableName in appSchema) {
          if (!newAppData.hasOwnProperty(tableName)) {
            newAppData[tableName] = []
            needsUpdate = true
          }
        }

        const isToDoApp = currentApp?.name === 'To-Do List'
        const isTasksTableEmpty = newAppData['tasks']?.length === 0
        const isDataStoreEmpty = !Object.values(newAppData).some(table => Array.isArray(table) && table.length > 0)

        if (isToDoApp && isTasksTableEmpty && isDataStoreEmpty) {
          newAppData['tasks'] = [
            { id: '1', title: 'Buy groceries', completed: false },
            { id: '2', title: 'Finish UI-JSON project', completed: true },
            { id: '3', title: 'Call mom', completed: false },
          ]
          needsUpdate = true
        }

        return needsUpdate ? newAppData : prevDbData
      })
    }
  }, [uiApp, currentApp])

  const handleAction = useCallback((action: UIAction) => {
    if (!action) return

    switch (action.type) {
      case 'navigate':
        setCurrentScreenId(action.target)
        break
      case 'popup':
        setPopup({ title: action.title, message: action.message, variant: action.variant || 'alert', buttons: action.buttons })
        break
      case 'goBack':
        if (uiApp?.initialScreen) setCurrentScreenId(uiApp.initialScreen)
        break
      case 'submit':
         if (action.target === 'database' && action.table && action.fields) {
            const table = action.table
            const newRecord: Record<string, any> = { id: Date.now().toString() }

            for (const dbField in action.fields) {
                const formFieldId = action.fields[dbField]
                newRecord[dbField] = formState[formFieldId]
            }

            setDatabaseData({
                ...databaseData,
                [table]: [...(databaseData[table] || []), newRecord]
            })

            const newFormState = {...formState}
            for (const dbField in action.fields) {
                const formFieldId = action.fields[dbField]
                newFormState[formFieldId] = ''
            }
            setFormState(newFormState)
            if(action.onSuccess) handleAction(action.onSuccess)

        } else {
            const body: Record<string, any> = {}
            action.fields && Object.values(action.fields).forEach(fieldId => {
              body[fieldId] = formState[fieldId]
            })
            console.log('Submitting to:', action.endpoint, 'with data:', body)
            setTimeout(() => {
              const success = Math.random() > 0.2
              if (success && action.onSuccess) {
                handleAction(action.onSuccess)
              } else if (!success && action.onError) {
                handleAction(action.onError)
              }
            }, 1000)
        }
        break
      case 'deleteRecord':
        setDatabaseData({
            ...databaseData,
            [action.table]: (databaseData[action.table] || []).filter(r => r.id !== action.recordId)
        })
        break

      case 'auth:login': {
        if (!authConfig) return
        const email = formState[action.fields.email]
        const password = formState[action.fields.password]
        const userTable = databaseData[authConfig.userTable] || []
        const user = userTable.find(u => u[authConfig.emailField] === email && u[authConfig.passwordField] === password)

        if (user) {
          setSession({ user })
          setCurrentScreenId(authConfig.postLoginScreen)
          setFormState({})
        } else if (action.onError) {
          handleAction(action.onError)
        }
        break
      }
      case 'auth:signup': {
        if (!authConfig) return
        const email = formState[action.fields.email]
        const userTable = databaseData[authConfig.userTable] || []
        const userExists = userTable.some(u => u[authConfig.emailField] === email)

        if (userExists) {
            if (action.onError) handleAction(action.onError)
            return
        }

        const newUser: Record<string, any> = { id: Date.now().toString() }
        for (const field in action.fields) {
            const formFieldId = action.fields[field]
            newUser[field] = formState[formFieldId]
        }

        setDatabaseData({
            ...databaseData,
            [authConfig.userTable]: [...userTable, newUser]
        })
        setSession({ user: newUser })
        setCurrentScreenId(authConfig.postLoginScreen)
        setFormState({})
        break
      }
      case 'auth:logout': {
        setSession(null)
        if (action.onSuccess) handleAction(action.onSuccess)
        else setCurrentScreenId(uiApp?.initialScreen || null)
        break
      }

      default:
        console.warn('Unknown action type:', (action as any).type)
    }
  }, [uiApp, formState, databaseData, authConfig])

  const currentScreen: UIScreen | undefined = useMemo(() => {
    if (!uiApp || !currentScreenId || currentScreenId.startsWith('auth:')) return undefined

    const screen = uiApp.screens[currentScreenId]
    if (screen?.requiresAuth && !session && authConfig) {
        setTimeout(() => setCurrentScreenId(authConfig.authRedirectScreen), 0)
        return undefined
    }

    return screen
  }, [uiApp, currentScreenId, session, authConfig])

  const theme = uiApp?.app?.theme

  const handleAppChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newIndex = Number(e.target.value)
    setSelectedAppIndex(newIndex)
    setCurrentScreenId(null)
    setFormState({})
    setSession(null)
  }

  const handleCreateApp = () => {
    setDialog({
      type: 'prompt',
      title: 'Novo Aplicativo',
      message: 'Digite o nome do novo aplicativo:',
      onConfirm: async (newAppName) => {
        if (newAppName && newAppName.trim()) {
          const newApp = await createNewApp(newAppName.trim())
          if (newApp) {
            setSelectedAppIndex(apps.length) // Select the newly created app
          }
        }
      }
    })
  }

  const handleEditAppName = () => {
    if (!currentApp) return
    setDialog({
        type: 'prompt',
        title: 'Editar Nome do Aplicativo',
        message: 'Digite o novo nome para o aplicativo:',
        defaultValue: currentApp.name,
        onConfirm: async (newAppName) => {
            if (newAppName && newAppName.trim() && newAppName.trim() !== currentApp.name) {
                await updateAppData(currentApp.id, { name: newAppName.trim() })
            }
        }
    })
  }

  const handleDeleteApp = () => {
    if (apps.length <= 1) {
      setDialog({
          type: 'alert',
          title: 'Ação Inválida',
          message: 'Não é possível deletar o último aplicativo.',
          onConfirm: () => {},
      })
      return
    }
    if (!currentApp) return
    setDialog({
        type: 'confirm',
        title: 'Confirmar Deleção',
        message: `Tem certeza que deseja deletar o aplicativo "${currentApp.name}"?`,
        onConfirm: async () => {
            await deleteAppById(currentApp.id)
            if (selectedAppIndex >= apps.length - 1) {
                setSelectedAppIndex(Math.max(0, apps.length - 2))
            }
        }
    })
  }

  const handleSchemaChange = (newSchema: any) => {
    if (uiApp) {
        const newApp = {...uiApp, app: {...uiApp.app, databaseSchema: newSchema}}
        handleSetJsonString(JSON.stringify(newApp, null, 2))
    }
  }

  const handleAddSnippet = useCallback((snippetJson: string) => {
    try {
        if (!uiApp) {
            throw new Error("O JSON do aplicativo atual é inválido.")
        }

        let snippetComponents
        try {
            snippetComponents = JSON.parse(snippetJson)
        } catch (e) {
            throw new Error("O JSON do componente selecionado é inválido.")
        }

        if (!Array.isArray(snippetComponents)) {
            snippetComponents = [snippetComponents]
        }

        const targetScreenId = currentScreenId || uiApp.initialScreen
        if (!targetScreenId || !uiApp.screens[targetScreenId]) {
            throw new Error("Não foi possível encontrar uma tela para adicionar o componente.")
        }

        const timestamp = Date.now()
        const makeIdsUnique = (components: UIComponent[]): UIComponent[] => {
            return components.map((comp, index) => {
                const newId = `${comp.id}_${timestamp}_${index}`

                if ('components' in comp && Array.isArray(comp.components)) {
                    return {
                        ...comp,
                        id: newId,
                        components: makeIdsUnique(comp.components),
                    }
                }

                return { ...comp, id: newId }
            })
        }
        const uniqueSnippetComponents: UIComponent[] = makeIdsUnique(snippetComponents)

        const newApp = JSON.parse(JSON.stringify(uiApp))
        newApp.screens[targetScreenId].components.push(...uniqueSnippetComponents)

        handleSetJsonString(JSON.stringify(newApp, null, 2))
        setActiveTab('editor')

    } catch (e) {
        console.error("Error adding snippet:", e)
        setDialog({
            type: 'alert',
            title: 'Erro ao Adicionar Componente',
            message: e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.',
            onConfirm: () => {},
        })
    }
}, [uiApp, currentScreenId, handleSetJsonString])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando aplicativos...</p>
        </div>
      </div>
    )
  }

  if (appsError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar aplicativos: {appsError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <ActionContext.Provider value={{ handleAction, formState, setFormState }}>
      <DatabaseContext.Provider value={{ data: databaseData }}>
        <SessionContext.Provider value={{ session }}>
          <div className="flex flex-col h-screen font-sans">
            <header className="bg-white shadow-md p-4 z-10 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">UI-JSON Visualizer</h1>
                <p className="text-gray-600">
                  A live editor for the UI-JSON declarative language.
                  {saving && <span className="ml-2 text-sm text-blue-600">💾 Salvando...</span>}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <label htmlFor="app-select" className="text-sm font-medium text-gray-700">Aplicativo:</label>
                    <select
                    id="app-select"
                    value={selectedAppIndex}
                    onChange={handleAppChange}
                    className="block w-48 px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                    >
                    {apps.map((app, index) => (
                        <option key={app.id} value={index} className="text-gray-900">
                        {app.name}
                        </option>
                    ))}
                    </select>
                </div>
                <div className="flex items-center gap-1 border-l pl-3 ml-1">
                    <button onClick={handleCreateApp} title="Novo Aplicativo" className="p-2 text-gray-600 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <PlusCircle size={20} />
                    </button>
                    <button onClick={handleEditAppName} title="Editar Nome" className="p-2 text-gray-600 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <FilePenLine size={20} />
                    </button>
                    <button
                        onClick={handleDeleteApp}
                        title="Deletar Aplicativo"
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={apps.length <= 1}
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
                <div className="flex items-center gap-1 border-l pl-3 ml-1">
                    <Link href="/dashboard/databases" title="Database Connections">
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <Database size={20} />
                        </button>
                    </Link>
                    <ThemeSwitcher />
                    <Link href="/admin" title="Admin Panel">
                        <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <Settings size={20} />
                        </button>
                    </Link>
                    <button
                        onClick={() => signOut()}
                        title="Logout"
                        className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
              </div>
            </header>

            <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-hidden">
              <div className="flex flex-col h-full">
                <h2 className="text-lg font-semibold mb-2 text-gray-700">
                  {activeTab === 'editor' && 'JSON Definition'}
                  {activeTab === 'ai' && 'AI Assistant'}
                  {activeTab === 'database' && 'Database Manager'}
                  {activeTab === 'flow' && 'Screen Flow'}
                  {activeTab === 'snippets' && 'Component Library'}
                </h2>
                <div className={`flex-1 flex flex-col border rounded-lg shadow-inner ${error && activeTab === 'editor' ? 'border-red-500' : 'border-gray-300'}`}>
                  <div className="flex border-b border-gray-200 bg-white rounded-t-lg">
                    <button onClick={() => setActiveTab('editor')} className={`px-4 py-2 text-sm font-medium rounded-tl-lg ${activeTab === 'editor' ? 'bg-gray-100 font-semibold text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                      Editor
                    </button>
                     <button onClick={() => setActiveTab('flow')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${activeTab === 'flow' ? 'bg-gray-100 font-semibold text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                      <Workflow size={16} />
                      Fluxo
                    </button>
                    <button onClick={() => setActiveTab('snippets')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${activeTab === 'snippets' ? 'bg-gray-100 font-semibold text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                      <Library size={16} />
                      Componentes
                    </button>
                    <button onClick={() => setActiveTab('ai')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${activeTab === 'ai' ? 'bg-gray-100 font-semibold text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                      <Wand2 size={16} />
                      AI Assistant
                    </button>
                    <button onClick={() => setActiveTab('database')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${activeTab === 'database' ? 'bg-gray-100 font-semibold text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                      <Database size={16} />
                      Database
                    </button>
                  </div>

                  <div className="flex-1 flex flex-col overflow-hidden">
                    {activeTab === 'editor' && (
                      <>
                        <textarea
                          value={jsonString}
                          onChange={(e) => handleSetJsonString(e.target.value)}
                          className="w-full flex-1 p-4 font-mono text-sm bg-gray-50 text-gray-800 resize-none focus:outline-none"
                          spellCheck="false"
                        />
                        {error && <div className="p-2 bg-red-100 text-red-700 text-xs font-mono rounded-b-lg">{error}</div>}
                      </>
                    )}
                     {activeTab === 'snippets' && (
                      <Snippets onAddSnippet={handleAddSnippet} />
                    )}
                    {activeTab === 'ai' && (
                      <AIAssistant jsonString={jsonString} setJsonString={handleSetJsonString} setActiveTab={setActiveTab} />
                    )}
                    {activeTab === 'database' && (
                      <DatabaseEditor
                        uiApp={uiApp}
                        data={databaseData}
                        onSchemaChange={handleSchemaChange}
                        onDataChange={setDatabaseData}
                      />
                    )}
                    {activeTab === 'flow' && (
                      <FlowBuilder
                        uiApp={uiApp}
                        setCurrentScreenId={setCurrentScreenId}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col h-full">
                <h2 className="text-lg font-semibold mb-2 text-gray-700">Live Preview</h2>
                <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden relative">
                  <DesignTokensContext.Provider value={designTokens}>
                    <div className="w-[375px] h-[750px] mx-auto my-6 border-[12px] border-black rounded-[40px] shadow-2xl overflow-hidden">
                      <div
                        className="h-full overflow-y-auto"
                        style={{
                          backgroundColor: resolveToken(currentScreen?.backgroundColor, designTokens) || resolveToken(theme?.backgroundColor, designTokens) || '#FFFFFF',
                          color: resolveToken(theme?.textColor, designTokens) || '#1F2937'
                        }}
                      >
                        {currentScreenId?.startsWith('auth:') ? (
                            <AuthScreen type={currentScreenId.split(':')[1] as 'login' | 'signup'} />
                        ) : currentScreen ? (
                          <Renderer components={currentScreen.components} screen={currentScreen} theme={theme} />
                        ) : (
                          <div className="p-8 text-center text-gray-500">
                            <p>Waiting for valid JSON to render a screen...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </DesignTokensContext.Provider>
                  {popup && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
                              {popup.title && <h3 className="text-lg font-bold mb-2 text-gray-900">{popup.title}</h3>}
                              <p className="text-gray-700 mb-4">{popup.message}</p>
                              <div className="flex justify-end space-x-2">
                                  {popup.buttons ? popup.buttons.map((btn: any, index: number) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                          if(btn.action) handleAction(btn.action)
                                          setPopup(null)
                                        }}
                                        className={`px-4 py-2 rounded-md text-sm font-semibold ${btn.variant === 'primary' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                        {btn.text}
                                    </button>
                                  )) :
                                    <button onClick={() => setPopup(null)} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold">
                                      OK
                                    </button>
                                  }
                              </div>
                          </div>
                      </div>
                  )}
                </div>
              </div>
            </main>
            {dialog && <CustomDialog config={dialog} onClose={() => setDialog(null)} />}
          </div>
        </SessionContext.Provider>
      </DatabaseContext.Provider>
    </ActionContext.Provider>
  )
}
