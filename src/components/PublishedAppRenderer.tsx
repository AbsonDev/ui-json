'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { UIApp, UIScreen, UIAction } from '@/types'
import { Renderer } from '@/components/Renderer'
import { ActionContext } from '@/hooks/useAction'
import { DatabaseContext } from '@/hooks/useDatabase'
import { SessionContext } from '@/hooks/useSession'
import { AuthScreen } from '@/components/AuthScreen'
import { ExternalLink } from 'lucide-react'

interface PublishedAppRendererProps {
  app: {
    id: string
    name: string
    json: string
    description: string | null
    databaseData: any
    showWatermark: boolean
    viewCount: number
    publishedAt: Date | null
    user: {
      name: string | null
      email: string
    }
  }
  showWatermark: boolean
}

export const PublishedAppRenderer: React.FC<PublishedAppRendererProps> = ({
  app,
  showWatermark,
}) => {
  const [error, setError] = useState<string | null>(null)
  const [currentScreenId, setCurrentScreenId] = useState<string | null>(null)
  const [formState, setFormState] = useState<Record<string, any>>({})
  const [popup, setPopup] = useState<{ title?: string; message: string; variant: 'alert' | 'info' | 'confirm', buttons?: any[] } | null>(null)
  const [session, setSession] = useState<{ user: any } | null>(null)
  const [databaseData, setDatabaseData] = useState<Record<string, any>>(app.databaseData || {})

  const uiApp: UIApp | null = useMemo(() => {
    try {
      if (!app.json) return null
      const parsed = JSON.parse(app.json)
      setError(null)
      if (!currentScreenId || !parsed.screens[currentScreenId] && !currentScreenId.startsWith('auth:')) {
        setCurrentScreenId(parsed.initialScreen)
      }
      return parsed
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message)
      } else {
        setError('An unknown error occurred while loading the app.')
      }
      return null
    }
  }, [app.json, currentScreenId])

  const authConfig = uiApp?.app.authentication
  const designTokens = uiApp?.app.designTokens || {}

  // Helper function to resolve design tokens
  const resolveToken = (value: any): any => {
    if (typeof value === 'string' && value.startsWith('$')) {
      const tokenName = value.substring(1)
      return designTokens[tokenName] || value
    }
    return value
  }

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

          const newFormState = { ...formState }
          for (const dbField in action.fields) {
            const formFieldId = action.fields[dbField]
            newFormState[formFieldId] = ''
          }
          setFormState(newFormState)
          if (action.onSuccess) handleAction(action.onSuccess)
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading App</h2>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <ActionContext.Provider value={{ handleAction, formState, setFormState }}>
      <DatabaseContext.Provider value={{ data: databaseData }}>
        <SessionContext.Provider value={{ session }}>
          <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            {/* Phone Frame */}
            <div className="relative">
              <div className="w-[375px] h-[750px] border-[12px] border-black rounded-[40px] shadow-2xl overflow-hidden bg-white">
                <div
                  className="h-full overflow-y-auto"
                  style={{
                    backgroundColor: resolveToken(currentScreen?.backgroundColor) || resolveToken(theme?.backgroundColor) || '#FFFFFF',
                    color: resolveToken(theme?.textColor) || '#1F2937'
                  }}
                >
                  {currentScreenId?.startsWith('auth:') ? (
                    <AuthScreen type={currentScreenId.split(':')[1] as 'login' | 'signup'} />
                  ) : currentScreen ? (
                    <Renderer
                      components={currentScreen.components}
                      screen={currentScreen}
                      theme={theme}
                      appId={app.id}
                      formData={formState}
                      onFieldChange={(fieldId, value) => {
                        setFormState(prev => ({ ...prev, [fieldId]: value }))
                      }}
                    />
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <p>Loading...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Watermark (FREE users only) */}
              {showWatermark && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-center">
                  <a
                    href="https://ui-json.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-white text-sm hover:text-blue-300 transition-colors"
                  >
                    <span>Made with UI-JSON</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>

            {/* Popup */}
            {popup && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
                  {popup.title && <h3 className="text-lg font-bold mb-2 text-gray-900">{popup.title}</h3>}
                  <p className="text-gray-700 mb-4">{popup.message}</p>
                  <div className="flex justify-end space-x-2">
                    {popup.buttons ? popup.buttons.map((btn: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (btn.action) handleAction(btn.action)
                          setPopup(null)
                        }}
                        className={`px-4 py-2 rounded-md text-sm font-semibold ${btn.variant === 'primary' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                      >
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

            {/* App Info Banner (Bottom) */}
            <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-1">{app.name}</h3>
              {app.description && (
                <p className="text-sm text-gray-600 mb-2">{app.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>By {app.user.name || app.user.email}</span>
                <span>{app.viewCount} views</span>
              </div>
            </div>
          </div>
        </SessionContext.Provider>
      </DatabaseContext.Provider>
    </ActionContext.Provider>
  )
}
