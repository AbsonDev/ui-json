'use client'

/**
 * Billing & Subscription Dashboard
 *
 * Shows user's current plan, usage, invoices, and payment management
 * Critical for retention and upsells
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  CreditCard,
  TrendingUp,
  FileText,
  AlertCircle,
  CheckCircle,
  Calendar,
  Download,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'

interface SubscriptionData {
  planTier: string
  status: string
  interval: 'MONTH' | 'YEAR'
  amount: number
  currency: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  trialEnd: string | null
}

interface UsageData {
  apps: { current: number; limit: number }
  exports: { current: number; limit: number }
  builds: { current: number; limit: number }
}

interface Invoice {
  id: string
  amount: number
  currency: string
  status: string
  paidAt: string
  hostedInvoiceUrl: string
  invoicePdf: string
}

export default function BillingPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const { track } = useAnalytics()

  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Track page view
    if (session?.user) {
      track.trackBillingPageViewed(subscription?.planTier || 'FREE')
    }
  }, [session, subscription, track])

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (sessionStatus === 'authenticated') {
      loadBillingData()
    }
  }, [sessionStatus, router])

  async function loadBillingData() {
    try {
      const [subRes, usageRes, invoicesRes] = await Promise.all([
        fetch('/api/subscription'),
        fetch('/api/usage'),
        fetch('/api/invoices'),
      ])

      if (subRes.ok) {
        const subData = await subRes.json()
        setSubscription(subData)
      }

      if (usageRes.ok) {
        const usageData = await usageRes.json()
        setUsage(usageData)
      }

      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json()
        setInvoices(invoicesData)
      }
    } catch (error) {
      console.error('Failed to load billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCancelSubscription() {
    if (!confirm('Are you sure you want to cancel your subscription? You\'ll keep access until the end of your billing period.')) {
      return
    }

    track.trackCancelSubscriptionClicked(subscription?.planTier || 'FREE')

    try {
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST',
      })

      if (res.ok) {
        alert('Subscription will be canceled at the end of your billing period.')
        loadBillingData()
      } else {
        alert('Failed to cancel subscription. Please try again.')
      }
    } catch (error) {
      alert('An error occurred. Please try again.')
    }
  }

  function handleDownloadInvoice(invoice: Invoice) {
    track.trackInvoiceDownloaded(invoice.id, invoice.amount / 100)
    window.open(invoice.invoicePdf || invoice.hostedInvoiceUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  const planTier = subscription?.planTier || 'FREE'
  const isTrialing = subscription?.status === 'TRIALING'
  const isCanceled = subscription?.cancelAtPeriodEnd

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Billing & Subscription
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your subscription, usage, and payment methods
          </p>
        </div>

        {/* Current Plan Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {planTier} Plan
                </h2>
                {isTrialing && (
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                    Trial
                  </span>
                )}
                {isCanceled && (
                  <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full text-sm font-medium">
                    Canceling
                  </span>
                )}
              </div>

              {subscription && (
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>
                      ${(subscription.amount / 100).toFixed(2)} / {subscription.interval === 'YEAR' ? 'year' : 'month'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {isCanceled ? 'Ends' : 'Renews'} on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  </div>
                  {isTrialing && subscription.trialEnd && (
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <Sparkles className="w-4 h-4" />
                      <span>
                        Trial ends {new Date(subscription.trialEnd).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {planTier === 'FREE' && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  You're on the free plan. Upgrade to unlock unlimited features!
                </p>
              )}
            </div>

            {/* Plan Actions */}
            <div className="flex items-center gap-3">
              {planTier === 'FREE' && (
                <Link
                  href="/pricing"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition"
                >
                  Upgrade to Pro
                </Link>
              )}

              {planTier === 'PRO' && (
                <Link
                  href="/pricing"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Upgrade to Team
                </Link>
              )}

              {planTier !== 'FREE' && subscription && (
                <Link
                  href="/pricing"
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Change Plan
                </Link>
              )}
            </div>
          </div>

          {/* Cancel Warning */}
          {isCanceled && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  Your subscription will be canceled at the end of the billing period.
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  You'll lose access to Pro features on {subscription && new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Usage Section */}
        {usage && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Usage This Month
              </h3>
            </div>

            <div className="space-y-4">
              {/* Apps */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Apps</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {usage.apps.current} / {usage.apps.limit === -1 ? '∞' : usage.apps.limit}
                  </span>
                </div>
                {usage.apps.limit !== -1 && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((usage.apps.current / usage.apps.limit) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Exports */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Exports</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {usage.exports.current} / {usage.exports.limit === -1 ? '∞' : usage.exports.limit}
                  </span>
                </div>
                {usage.exports.limit !== -1 && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((usage.exports.current / usage.exports.limit) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Builds */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Builds</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {usage.builds.current} / {usage.builds.limit === -1 ? '∞' : usage.builds.limit}
                  </span>
                </div>
                {usage.builds.limit > 0 && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((usage.builds.current / usage.builds.limit) * 100, 100)}%` }}
                    />
                  </div>
                )}
                {usage.builds.limit === 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Available on Pro plan
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Invoices History */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Billing History
            </h3>
          </div>

          {invoices.length > 0 ? (
            <div className="space-y-2">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      invoice.status === 'PAID'
                        ? 'bg-green-100 dark:bg-green-900/20'
                        : 'bg-red-100 dark:bg-red-900/20'
                    }`}>
                      {invoice.status === 'PAID' ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        ${(invoice.amount / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(invoice.paidAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadInvoice(invoice)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No invoices yet
            </p>
          )}
        </div>

        {/* Danger Zone */}
        {planTier !== 'FREE' && subscription && !isCanceled && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              Cancel Subscription
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              You'll keep access until the end of your billing period. Your data will be preserved.
            </p>
            <button
              onClick={handleCancelSubscription}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
            >
              Cancel My Subscription
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
