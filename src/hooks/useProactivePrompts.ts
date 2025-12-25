'use client'

/**
 * Hooks for Proactive Upgrade Prompts
 *
 * Detects strategic moments to show upgrade prompts:
 * - After creating 2nd app (growth signal)
 * - After successful export (satisfaction moment)
 * - On 3rd day of usage (engagement confirmation)
 * - Near AI limit (feature value demonstrated)
 */

import { useEffect, useState } from 'react'

/**
 * Hook: Show prompt after user creates their 2nd app
 * Reasoning: User sees value, likely to create more
 */
export function useSecondAppPrompt(currentAppCount: number) {
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    // Show only if user has exactly 2 apps and hasn't dismissed this before
    const dismissed = localStorage.getItem('prompt_dismissed_second_app')
    const lastDismissed = dismissed ? parseInt(dismissed) : 0
    const daysSinceDismiss = (Date.now() - lastDismissed) / (1000 * 60 * 60 * 24)

    // Show if:
    // 1. User has 2 apps
    // 2. Never dismissed OR dismissed >7 days ago
    if (currentAppCount === 2 && (!dismissed || daysSinceDismiss > 7)) {
      // Delay showing by 2 seconds for better UX
      const timer = setTimeout(() => setShouldShow(true), 2000)
      return () => clearTimeout(timer)
    } else {
      setShouldShow(false)
    }
  }, [currentAppCount])

  return shouldShow
}

/**
 * Hook: Show prompt after successful export
 * Reasoning: High satisfaction moment = best time to upsell
 */
export function useAfterExportPrompt(exportCount: number) {
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('prompt_dismissed_after_export')
    const lastExportCount = parseInt(localStorage.getItem('last_export_count') || '0')

    // Show only if:
    // 1. New export just created (count increased)
    // 2. User has made at least 2 exports (shows engagement)
    // 3. Never dismissed this prompt before
    if (exportCount > lastExportCount && exportCount >= 2 && !dismissed) {
      // Show immediately after export
      setShouldShow(true)

      // Store the new count
      localStorage.setItem('last_export_count', exportCount.toString())

      // Auto-hide after 30 seconds
      const timer = setTimeout(() => setShouldShow(false), 30000)
      return () => clearTimeout(timer)
    }
  }, [exportCount])

  return shouldShow
}

/**
 * Hook: Show prompt on 3rd day of usage
 * Reasoning: User is engaged but not yet committed
 */
export function useThirdDayPrompt(userCreatedAt: string | Date) {
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    const createdDate = new Date(userCreatedAt)
    const daysSinceSignup = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)

    const dismissed = localStorage.getItem('prompt_dismissed_third_day')
    const hasSeenThisPrompt = localStorage.getItem('third_day_prompt_shown')

    // Show only if:
    // 1. It's between day 3 and day 4
    // 2. Never shown before
    // 3. Not dismissed
    if (
      daysSinceSignup >= 3 &&
      daysSinceSignup < 4 &&
      !hasSeenThisPrompt &&
      !dismissed
    ) {
      setShouldShow(true)
      localStorage.setItem('third_day_prompt_shown', 'true')
    }
  }, [userCreatedAt])

  return shouldShow
}

/**
 * Hook: Show prompt when nearing AI request limit
 * Reasoning: User experiencing value, hitting limit = perfect upgrade moment
 */
export function useAILimitPrompt(currentRequests: number, maxRequests: number) {
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('prompt_dismissed_ai_limit')
    const today = new Date().toDateString()
    const lastShown = localStorage.getItem('ai_limit_prompt_last_shown')

    // Show only if:
    // 1. User is at 80% or more of their limit
    // 2. Not dismissed today
    // 3. Not shown today
    const percentage = (currentRequests / maxRequests) * 100

    if (
      percentage >= 80 &&
      (!dismissed || dismissed !== today) &&
      (!lastShown || lastShown !== today)
    ) {
      setShouldShow(true)
      localStorage.setItem('ai_limit_prompt_last_shown', today)
    } else if (percentage < 80) {
      setShouldShow(false)
    }
  }, [currentRequests, maxRequests])

  return shouldShow
}

/**
 * Hook: Show prompt when user tries to create mobile build (FREE users)
 * Reasoning: Direct feature need = immediate conversion opportunity
 */
export function useBuildOpportunityPrompt(attemptedBuild: boolean) {
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('prompt_dismissed_build_opportunity')
    const lastDismissed = dismissed ? parseInt(dismissed) : 0
    const hoursSinceDismiss = (Date.now() - lastDismissed) / (1000 * 60 * 60)

    // Show if:
    // 1. User attempted to build
    // 2. Never dismissed OR dismissed >24 hours ago
    if (attemptedBuild && (!dismissed || hoursSinceDismiss > 24)) {
      setShouldShow(true)
    }
  }, [attemptedBuild])

  return shouldShow
}

/**
 * Helper: Clear all prompt dismissals (for testing)
 */
export function clearAllPromptDismissals() {
  const keys = [
    'prompt_dismissed_second_app',
    'prompt_dismissed_after_export',
    'prompt_dismissed_third_day',
    'prompt_dismissed_ai_limit',
    'prompt_dismissed_build_opportunity',
    'last_export_count',
    'third_day_prompt_shown',
    'ai_limit_prompt_last_shown',
  ]

  keys.forEach((key) => localStorage.removeItem(key))
}
