'use client'

import { useState, useEffect, useCallback } from 'react'
import { getUserApps, createApp, updateApp, deleteApp } from '@/actions/apps'
import { sampleApps } from '@/constants'

interface App {
  id: string
  name: string
  json: string
  description?: string | null
  isPublic: boolean
  version: string
  databaseData?: any
  createdAt: Date
  updatedAt: Date
}

interface UseAppsReturn {
  apps: App[]
  loading: boolean
  error: string | null
  createNewApp: (name: string, json?: string) => Promise<App | null>
  updateAppData: (id: string, data: Partial<App>) => Promise<void>
  deleteAppById: (id: string) => Promise<void>
  refreshApps: () => Promise<void>
}

export function useApps(): UseAppsReturn {
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load apps from database
  const loadApps = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const userApps = await getUserApps()

      // If user has no apps, create sample apps
      if (userApps.length === 0) {
        console.log('No apps found, creating sample apps...')
        const createdApps: App[] = []

        for (const sampleApp of sampleApps) {
          try {
            const newApp = await createApp({
              name: sampleApp.name,
              json: sampleApp.json,
              description: `Sample app: ${sampleApp.name}`,
              isPublic: false,
            })
            createdApps.push(newApp as App)
          } catch (err) {
            console.error('Error creating sample app:', err)
          }
        }

        setApps(createdApps)
      } else {
        setApps(userApps as App[])
      }
    } catch (err) {
      console.error('Error loading apps:', err)
      setError(err instanceof Error ? err.message : 'Failed to load apps')
      // Fallback to empty array on error
      setApps([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadApps()
  }, [loadApps])

  // Create new app
  const createNewApp = useCallback(async (name: string, json?: string): Promise<App | null> => {
    try {
      setError(null)
      const newApp = await createApp({
        name,
        json: json || JSON.stringify({
          version: "1.0.0",
          app: {
            name: name,
            theme: {
              primaryColor: "#3B82F6",
              backgroundColor: "#FFFFFF"
            }
          },
          screens: {
            home: {
              id: "home",
              title: "Home",
              components: []
            }
          },
          initialScreen: "home"
        }, null, 2),
        description: '',
        isPublic: false,
      })

      setApps(prev => [...prev, newApp as App])
      return newApp as App
    } catch (err) {
      console.error('Error creating app:', err)
      setError(err instanceof Error ? err.message : 'Failed to create app')
      return null
    }
  }, [])

  // Update app
  const updateAppData = useCallback(async (id: string, data: Partial<App>) => {
    try {
      setError(null)
      await updateApp({ id, ...data })

      setApps(prev => prev.map(app =>
        app.id === id ? { ...app, ...data } : app
      ))
    } catch (err) {
      console.error('Error updating app:', err)
      setError(err instanceof Error ? err.message : 'Failed to update app')
    }
  }, [])

  // Delete app
  const deleteAppById = useCallback(async (id: string) => {
    try {
      setError(null)
      await deleteApp(id)
      setApps(prev => prev.filter(app => app.id !== id))
    } catch (err) {
      console.error('Error deleting app:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete app')
    }
  }, [])

  return {
    apps,
    loading,
    error,
    createNewApp,
    updateAppData,
    deleteAppById,
    refreshApps: loadApps,
  }
}
