'use client'

import { useEffect, useState } from 'react'
import {
  getUserDatabaseConnections,
  createDatabaseConnection,
  updateDatabaseConnection,
  deleteDatabaseConnection,
  testDatabaseConnection,
  testConnectionBeforeCreate,
} from '@/actions/database-connections'
import Link from 'next/link'
import { ArrowLeft, Database, Plus, Trash2, Edit2, Check, X, Loader2, AlertCircle } from 'lucide-react'

interface DatabaseConnection {
  id: string
  name: string
  type: string
  host: string
  port: number
  database: string
  username: string
  password: string // masked
  ssl: boolean
  isActive: boolean
  lastTestedAt: Date | null
  lastTestStatus: string | null
  lastTestError: string | null
  createdAt: Date
  updatedAt: Date
  _count: {
    apps: number
  }
}

interface ConnectionFormData {
  name: string
  host: string
  port: string
  database: string
  username: string
  password: string
  ssl: boolean
}

const initialFormData: ConnectionFormData = {
  name: '',
  host: 'localhost',
  port: '5432',
  database: '',
  username: '',
  password: '',
  ssl: false,
}

export default function DatabasesPage() {
  const [connections, setConnections] = useState<DatabaseConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<ConnectionFormData>(initialFormData)
  const [formError, setFormError] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testingNew, setTestingNew] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadConnections()
  }, [])

  async function loadConnections() {
    try {
      setLoading(true)
      setError(null)
      const data = await getUserDatabaseConnections()
      setConnections(data as unknown as DatabaseConnection[])
    } catch (err: any) {
      setError(err.message || 'Failed to load database connections')
    } finally {
      setLoading(false)
    }
  }

  async function handleTestConnection(id: string) {
    try {
      setTestingId(id)
      setFormError(null)
      const result = await testDatabaseConnection(id)

      if (result.success) {
        alert('Connection successful!')
        await loadConnections()
      } else {
        alert(`Connection failed: ${result.error}`)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to test connection')
    } finally {
      setTestingId(null)
    }
  }

  async function handleTestNewConnection() {
    try {
      setTestingNew(true)
      setFormError(null)

      const result = await testConnectionBeforeCreate({
        name: formData.name,
        host: formData.host,
        port: parseInt(formData.port),
        database: formData.database,
        username: formData.username,
        password: formData.password,
        ssl: formData.ssl,
      })

      if (result.success) {
        alert('Connection test successful! You can now save this connection.')
      } else {
        setFormError(result.error || 'Connection test failed')
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to test connection')
    } finally {
      setTestingNew(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      setSubmitting(true)
      setFormError(null)

      const connectionData = {
        name: formData.name,
        host: formData.host,
        port: parseInt(formData.port),
        database: formData.database,
        username: formData.username,
        password: formData.password,
        ssl: formData.ssl,
      }

      if (editingId) {
        await updateDatabaseConnection({
          id: editingId,
          ...connectionData,
        })
      } else {
        await createDatabaseConnection(connectionData)
      }

      setShowForm(false)
      setEditingId(null)
      setFormData(initialFormData)
      await loadConnections()
    } catch (err: any) {
      setFormError(err.message || 'Failed to save connection')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete connection "${name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteDatabaseConnection(id)
      await loadConnections()
    } catch (err: any) {
      alert(err.message || 'Failed to delete connection')
    }
  }

  function handleEdit(connection: DatabaseConnection) {
    setEditingId(connection.id)
    setFormData({
      name: connection.name,
      host: connection.host,
      port: connection.port.toString(),
      database: connection.database,
      username: connection.username,
      password: '', // Don't show encrypted password
      ssl: connection.ssl,
    })
    setShowForm(true)
    setFormError(null)
  }

  function handleCancelEdit() {
    setShowForm(false)
    setEditingId(null)
    setFormData(initialFormData)
    setFormError(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading database connections...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft size={24} />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Database Connections</h1>
                <p className="text-sm text-gray-600">Manage your database connections and connect them to your apps</p>
              </div>
            </div>
            {!showForm && (
              <button
                onClick={() => {
                  setShowForm(true)
                  setEditingId(null)
                  setFormData(initialFormData)
                  setFormError(null)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
                New Connection
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Form */}
        {showForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingId ? 'Edit Connection' : 'New Connection'}
            </h2>

            {formError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-red-600">{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Connection Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Production DB"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Host *
                  </label>
                  <input
                    type="text"
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    placeholder="localhost"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Port *
                  </label>
                  <input
                    type="number"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                    placeholder="5432"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Database *
                  </label>
                  <input
                    type="text"
                    value={formData.database}
                    onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                    placeholder="myapp_db"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="postgres"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingId ? "Leave blank to keep current" : "••••••••"}
                    required={!editingId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ssl"
                  checked={formData.ssl}
                  onChange={(e) => setFormData({ ...formData, ssl: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="ssl" className="text-sm font-medium text-gray-700">
                  Use SSL/TLS
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleTestNewConnection}
                  disabled={testingNew || submitting}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testingNew ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Database size={16} />
                      Test Connection
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={submitting || testingNew}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      {editingId ? 'Update' : 'Create'}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={submitting || testingNew}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Connections List */}
        {connections.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No database connections</h3>
            <p className="text-gray-600 mb-6">
              Create your first database connection to start connecting your apps to real databases.
            </p>
            {!showForm && (
              <button
                onClick={() => {
                  setShowForm(true)
                  setEditingId(null)
                  setFormData(initialFormData)
                  setFormError(null)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
                Create Connection
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Connection
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Host
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Database
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Apps Using
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {connections.map((connection) => (
                  <tr key={connection.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Database className="text-gray-400" size={20} />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{connection.name}</div>
                          <div className="text-xs text-gray-500">
                            {connection.username}@{connection.host}:{connection.port}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{connection.host}</div>
                      <div className="text-xs text-gray-500">{connection.ssl ? 'SSL' : 'No SSL'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{connection.database}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{connection._count.apps} app(s)</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {connection.lastTestStatus === 'success' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Check size={12} />
                          Connected
                        </span>
                      ) : connection.lastTestStatus === 'failed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <X size={12} />
                          Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Not tested
                        </span>
                      )}
                      {connection.lastTestedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(connection.lastTestedAt).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleTestConnection(connection.id)}
                        disabled={testingId === connection.id}
                        className="text-blue-600 hover:text-blue-900 mr-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Test Connection"
                      >
                        {testingId === connection.id ? (
                          <Loader2 className="animate-spin inline" size={16} />
                        ) : (
                          <Database size={16} className="inline" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(connection)}
                        className="text-gray-600 hover:text-gray-900 mr-3"
                        title="Edit"
                      >
                        <Edit2 size={16} className="inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(connection.id, connection.name)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 size={16} className="inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
