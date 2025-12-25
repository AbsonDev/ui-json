'use client'

/**
 * Proactive Upgrade Prompt Component
 *
 * Generic component for showing upgrade prompts at strategic moments
 * Tracks user interactions for conversion optimization
 */

import { useEffect, useState } from 'react'
import { X, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useAnalytics } from '@/hooks/useAnalytics'

interface ProactivePromptProps {
  promptType: 'second_app' | 'after_export' | 'third_day' | 'ai_limit' | 'build_opportunity'
  title: string
  description: string
  benefits: string[]
  ctaText?: string
  ctaLink?: string
  onDismiss?: () => void
  autoShow?: boolean
  planTier?: string
}

export function ProactivePrompt({
  promptType,
  title,
  description,
  benefits,
  ctaText = 'Upgrade to Pro',
  ctaLink = '/pricing',
  onDismiss,
  autoShow = true,
  planTier = 'FREE',
}: ProactivePromptProps) {
  const [isVisible, setIsVisible] = useState(autoShow)
  const [hasTracked, setHasTracked] = useState(false)
  const { track } = useAnalytics()

  // Track prompt display (only once)
  useEffect(() => {
    if (isVisible && !hasTracked) {
      track.trackProactivePromptShown({
        promptType,
        currentPlan: planTier,
      })
      setHasTracked(true)
    }
  }, [isVisible, hasTracked, promptType, planTier, track])

  const handleDismiss = () => {
    track.trackProactivePromptDismissed(promptType)
    setIsVisible(false)
    if (onDismiss) {
      onDismiss()
    }
    // Store in localStorage to not show again for this session
    localStorage.setItem(`prompt_dismissed_${promptType}`, Date.now().toString())
  }

  const handleCTAClick = () => {
    track.trackProactivePromptClicked(promptType)
  }

  if (!isVisible) return null

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 relative shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 pr-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
            {title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            {description}
          </p>

          {/* Benefits list */}
          {benefits.length > 0 && (
            <ul className="space-y-1 mb-3">
              {benefits.map((benefit, i) => (
                <li
                  key={i}
                  className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                >
                  <span className="text-blue-600 dark:text-blue-400">✓</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          )}

          {/* CTA Button */}
          <div className="flex items-center gap-2">
            <Link
              href={ctaLink}
              onClick={handleCTAClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition text-sm"
            >
              {ctaText}
            </Link>
            <button
              onClick={handleDismiss}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
