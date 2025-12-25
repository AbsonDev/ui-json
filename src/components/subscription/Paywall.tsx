'use client'

import { X, Sparkles, Zap } from 'lucide-react'
import Link from 'next/link'

interface PaywallProps {
  feature: string
  description: string
  requiredPlan?: 'PRO' | 'TEAM'
  onClose?: () => void
}

export function Paywall({
  feature,
  description,
  requiredPlan = 'PRO',
  onClose
}: PaywallProps) {
  const planDetails = {
    PRO: {
      name: 'Pro',
      price: '$19/month',
      icon: Zap,
      color: 'blue',
      features: [
        'Unlimited apps',
        'Unlimited exports',
        'All templates',
        'Remove watermark',
        'Analytics dashboard',
        '14-day free trial'
      ]
    },
    TEAM: {
      name: 'Team',
      price: '$49/user/month',
      icon: Sparkles,
      color: 'purple',
      features: [
        'Everything in Pro',
        'Team collaboration',
        'Real-time co-editing',
        'Advanced analytics',
        'Priority support',
        '14-day free trial'
      ]
    }
  }

  const plan = planDetails[requiredPlan]
  const Icon = plan.icon

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-8 relative shadow-2xl animate-in zoom-in duration-200">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center mb-6">
          <div className={`w-16 h-16 bg-${plan.color}-100 dark:bg-${plan.color}-900/20 rounded-full flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`w-8 h-8 text-${plan.color}-600 dark:text-${plan.color}-400`} />
          </div>

          <h3 className="text-2xl font-bold mb-2">
            Upgrade to {plan.name}
          </h3>

          <p className="text-gray-600 dark:text-gray-400 mb-1">
            {description}
          </p>

          <p className="text-sm text-gray-500 dark:text-gray-500">
            This feature requires {plan.name} plan
          </p>
        </div>

        <div className={`bg-${plan.color}-50 dark:bg-${plan.color}-900/10 rounded-lg p-4 mb-6`}>
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-2xl font-bold">{plan.price}</span>
            <span className={`text-sm px-2 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300`}>
              14-day free trial
            </span>
          </div>

          <ul className="space-y-2">
            {plan.features.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <Zap className={`w-4 h-4 text-${plan.color}-600 dark:text-${plan.color}-400 flex-shrink-0`} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            href="/pricing"
            className={`block w-full bg-${plan.color}-600 text-white text-center py-3 rounded-lg font-medium hover:bg-${plan.color}-700 transition shadow-md hover:shadow-lg`}
          >
            View All Plans
          </Link>

          {onClose && (
            <button
              onClick={onClose}
              className="block w-full text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 py-2 transition"
            >
              Maybe Later
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
