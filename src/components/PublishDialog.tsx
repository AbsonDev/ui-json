'use client'

import React, { useState } from 'react'
import { publishApp, unpublishApp } from '@/actions/apps'
import { X, Globe, Eye, EyeOff, Copy, Check, ExternalLink } from 'lucide-react'

interface PublishDialogProps {
  app: {
    id: string
    name: string
    isPublic: boolean
    publishedSlug?: string | null
  }
  onClose: () => void
  onPublished: () => void
}

export const PublishDialog: React.FC<PublishDialogProps> = ({ app, onClose, onPublished }) => {
  const [slug, setSlug] = useState(app.publishedSlug || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Auto-generate slug from app name
  const generateSlug = () => {
    const generated = app.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50)
    setSlug(generated)
  }

  const handlePublish = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await publishApp({
        appId: app.id,
        slug: slug || undefined,
      })

      const fullUrl = `${window.location.origin}${result.url}`
      setPublishedUrl(fullUrl)
      onPublished()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish app')
    } finally {
      setLoading(false)
    }
  }

  const handleUnpublish = async () => {
    if (!confirm('Are you sure you want to unpublish this app? It will no longer be accessible to the public.')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      await unpublishApp(app.id)
      onPublished()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unpublish app')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (!publishedUrl) return

    try {
      await navigator.clipboard.writeText(publishedUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Globe className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">
              {app.isPublic ? 'Manage Published App' : 'Publish App'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {publishedUrl ? (
            // Success state
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="text-green-600" size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                App Published Successfully! 🎉
              </h3>
              <p className="text-gray-600 mb-6">
                Your app is now live and accessible to anyone with the link.
              </p>

              {/* Published URL */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <label className="text-xs font-medium text-gray-500 block mb-2">
                  PUBLIC URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={publishedUrl}
                    readOnly
                    className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-sm font-mono"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <a
                  href={publishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  <span>View Live App</span>
                  <ExternalLink size={18} />
                </a>
                <button
                  onClick={onClose}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : app.isPublic ? (
            // Already published - manage state
            <div>
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Eye className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1">
                    <p className="font-semibold text-green-900 mb-1">App is Published</p>
                    <p className="text-sm text-green-700">
                      Your app is currently live and accessible at:
                    </p>
                    <a
                      href={`${window.location.origin}/published/${app.publishedSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline font-mono break-all"
                    >
                      {window.location.origin}/published/{app.publishedSlug}
                    </a>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleUnpublish}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <EyeOff size={18} />
                  <span>{loading ? 'Unpublishing...' : 'Unpublish App'}</span>
                </button>

                <a
                  href={`${window.location.origin}/published/${app.publishedSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink size={18} />
                  <span>View Live App</span>
                </a>
              </div>
            </div>
          ) : (
            // Publish new app
            <div>
              <p className="text-gray-600 mb-6">
                Publish your app to make it publicly accessible. Anyone with the link will be able to view and interact with it.
              </p>

              {/* Slug Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom URL (optional)
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                      <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm font-mono">
                        .../published/
                      </span>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase())}
                        placeholder="my-app"
                        className="flex-1 px-3 py-2 outline-none font-mono text-sm"
                        pattern="[a-z0-9-]+"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Only lowercase letters, numbers, and hyphens allowed
                    </p>
                  </div>
                  <button
                    onClick={generateSlug}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors self-start"
                  >
                    Auto
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handlePublish}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Publishing...' : 'Publish App'}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
