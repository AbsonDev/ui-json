'use client'

import { useEffect, useState } from 'react'
import { getUsageMetrics, getUserPlanDetails } from '@/actions/subscriptions'
import { AlertTriangle, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useAnalytics } from '@/hooks/useAnalytics'

interface UsageStats {
  apps: { current: number; limit: number; percentage: number }
  builds: { current: number; limit: number; percentage: number }
  exports: { current: number; limit: number; percentage: number }
}

export function UsageIndicator() {
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [planTier, setPlanTier] = useState<string>('FREE')
  const [loading, setLoading] = useState(true)
  const { track } = useAnalytics()

  useEffect(() => {
    async function loadStats() {
      try {
        const [metrics, planDetails] = await Promise.all([
          getUsageMetrics(),
          getUserPlanDetails()
        ])

        setStats(metrics)
        setPlanTier(planDetails.planTier)
      } catch (error) {
        console.error('Failed to load usage stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  // Track usage warnings
  useEffect(() => {
    if (!stats || planTier !== 'FREE') return

    // Track warnings at 80%+ usage
    if (stats.apps.percentage >= 80 && stats.apps.limit !== -1) {
      track.trackUsageWarningShown({
        limitType: 'apps',
        percentage: stats.apps.percentage,
        current: stats.apps.current,
        max: stats.apps.limit,
      })
    }

    if (stats.exports.percentage >= 80 && stats.exports.limit !== -1) {
      track.trackUsageWarningShown({
        limitType: 'exports',
        percentage: stats.exports.percentage,
        current: stats.exports.current,
        max: stats.exports.limit,
      })
    }
  }, [stats, planTier, track])

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4"></div>
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const getColor = (percentage: number) => {
    if (percentage >= 90) return 'red'
    if (percentage >= 70) return 'yellow'
    return 'green'
  }

  const formatLimit = (limit: number) => {
    return limit === -1 ? '∞' : limit.toString()
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Usage This Month
        </h3>
        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium">
          {planTier}
        </span>
      </div>

      <div className="space-y-4">
        {/* Apps Usage */}
        <div>
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="font-medium">Apps</span>
            <span className="text-gray-600 dark:text-gray-400">
              {stats.apps.current} / {formatLimit(stats.apps.limit)}
            </span>
          </div>

          {stats.apps.limit !== -1 && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  getColor(stats.apps.percentage) === 'red' ? 'bg-red-600' :
                  getColor(stats.apps.percentage) === 'yellow' ? 'bg-yellow-600' :
                  'bg-green-600'
                }`}
                style={{ width: `${Math.min(stats.apps.percentage, 100)}%` }}
              />
            </div>
          )}

          {stats.apps.percentage >= 80 && planTier === 'FREE' && (
            <div className="mt-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded flex items-start gap-2">
              <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span>
                You're close to your limit.{' '}
                <Link
                  href="/pricing"
                  className="underline font-medium"
                  onClick={() => {
                    track.trackUpgradeButtonClicked({
                      location: 'usage_indicator',
                      targetPlan: 'PRO',
                      currentPlan: planTier,
                    })
                  }}
                >
                  Upgrade to Pro
                </Link>{' '}
                for unlimited apps.
              </span>
            </div>
          )}
        </div>

        {/* Builds Usage */}
        <div>
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="font-medium">Mobile Builds</span>
            <span className="text-gray-600 dark:text-gray-400">
              {stats.builds.current} / {formatLimit(stats.builds.limit)}
            </span>
          </div>

          {stats.builds.limit !== -1 && stats.builds.limit > 0 && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  getColor(stats.builds.percentage) === 'red' ? 'bg-red-600' :
                  getColor(stats.builds.percentage) === 'yellow' ? 'bg-yellow-600' :
                  'bg-green-600'
                }`}
                style={{ width: `${Math.min(stats.builds.percentage, 100)}%` }}
              />
            </div>
          )}

          {stats.builds.limit === 0 && planTier === 'FREE' && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
              Mobile builds not available on Free plan.{' '}
              <Link
                href="/pricing"
                className="underline font-medium text-blue-600 dark:text-blue-400"
                onClick={() => {
                  track.trackUpgradeButtonClicked({
                    location: 'usage_indicator',
                    targetPlan: 'PRO',
                    currentPlan: planTier,
                  })
                }}
              >
                Upgrade
              </Link>
            </div>
          )}
        </div>

        {/* Exports Usage */}
        <div>
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="font-medium">Exports</span>
            <span className="text-gray-600 dark:text-gray-400">
              {stats.exports.current} / {formatLimit(stats.exports.limit)}
            </span>
          </div>

          {stats.exports.limit !== -1 && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  getColor(stats.exports.percentage) === 'red' ? 'bg-red-600' :
                  getColor(stats.exports.percentage) === 'yellow' ? 'bg-yellow-600' :
                  'bg-green-600'
                }`}
                style={{ width: `${Math.min(stats.exports.percentage, 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {planTier === 'FREE' && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/pricing"
            className="block w-full text-center py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition text-sm"
            onClick={() => {
              track.trackUpgradeButtonClicked({
                location: 'usage_indicator',
                targetPlan: 'PRO',
                currentPlan: planTier,
              })
            }}
          >
            Upgrade to Pro for Unlimited
          </Link>
        </div>
      )}
    </div>
  )
}
