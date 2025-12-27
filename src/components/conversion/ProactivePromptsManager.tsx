'use client'

/**
 * Proactive Prompts Manager
 *
 * Intelligently shows upgrade prompts at strategic moments
 * Only one prompt shown at a time (priority-based)
 */

import { useState, useEffect } from 'react'
import { ProactivePrompt } from './ProactivePrompt'
import {
  useSecondAppPrompt,
  useAfterExportPrompt,
  useThirdDayPrompt,
  useAILimitPrompt,
  useBuildOpportunityPrompt,
} from '@/hooks/useProactivePrompts'

interface PromptsManagerProps {
  planTier: string
  stats: {
    appsCount: number
    exportsCount: number
    aiRequestsToday: number
    maxAIRequests: number
  }
  userCreatedAt: string | Date
  attemptedBuild?: boolean
}

export function ProactivePromptsManager({
  planTier,
  stats,
  userCreatedAt,
  attemptedBuild = false,
}: PromptsManagerProps) {
  // Only show prompts for FREE users
  if (planTier !== 'FREE') return null

  // Check all trigger conditions
  const showSecondApp = useSecondAppPrompt(stats.appsCount)
  const showAfterExport = useAfterExportPrompt(stats.exportsCount)
  const showThirdDay = useThirdDayPrompt(userCreatedAt)
  const showAILimit = useAILimitPrompt(stats.aiRequestsToday, stats.maxAIRequests)
  const showBuildOpp = useBuildOpportunityPrompt(attemptedBuild)

  // Priority order (highest priority first)
  // 1. Build Opportunity (direct need)
  // 2. AI Limit (hitting limit right now)
  // 3. After Export (satisfaction moment)
  // 4. Second App (growth signal)
  // 5. Third Day (engagement)

  if (showBuildOpp) {
    return (
      <ProactivePrompt
        promptType="build_opportunity"
        title="Ready to publish your app? 📱"
        description="Mobile builds are available on Pro! Create iOS and Android builds ready for app stores."
        benefits={[
          '10 mobile builds per month',
          'iOS & Android support',
          'Ready for App Store and Play Store',
          'Professional app bundles',
        ]}
        ctaText="Unlock Mobile Builds"
        planTier={planTier}
      />
    )
  }

  if (showAILimit) {
    const requestsLeft = stats.maxAIRequests - stats.aiRequestsToday

    return (
      <ProactivePrompt
        promptType="ai_limit"
        title={`Only ${requestsLeft} AI requests left today 🤖`}
        description="You're using AI like a pro! Upgrade to get 10x more requests per day."
        benefits={[
          `${stats.maxAIRequests} → 100 AI requests/day (10x more!)`,
          'Build faster with unlimited creativity',
          'Never hit the limit again',
          'Priority AI processing',
        ]}
        ctaText="Get 10x More AI"
        planTier={planTier}
      />
    )
  }

  if (showAfterExport) {
    return (
      <ProactivePrompt
        promptType="after_export"
        title="Great export! 🎉 Want to do more?"
        description="You're getting the hang of it! Pro users export unlimited times and in all formats."
        benefits={[
          'Unlimited exports (no monthly limit)',
          'All export formats included',
          'Mobile builds (iOS & Android)',
          'Priority support',
        ]}
        ctaText="Upgrade for Unlimited"
        planTier={planTier}
      />
    )
  }

  if (showSecondApp) {
    return (
      <ProactivePrompt
        promptType="second_app"
        title="You're on a roll! 🚀"
        description="You've created 2 apps already! Pro users create unlimited apps with advanced features."
        benefits={[
          'Unlimited apps (vs 3 on Free)',
          'Unlimited exports',
          '100 AI requests/day (vs 10)',
          'Mobile builds & analytics',
        ]}
        ctaText="Create Unlimited Apps"
        planTier={planTier}
      />
    )
  }

  if (showThirdDay) {
    return (
      <ProactivePrompt
        promptType="third_day"
        title="Loving UI-JSON so far? 💙"
        description="You've been with us for 3 days! Most users like you upgrade to Pro to unlock the full power."
        benefits={[
          '14-day free trial (no credit card)',
          'Everything unlimited',
          'Mobile builds for production apps',
          'Cancel anytime, keep your data',
        ]}
        ctaText="Start Free Trial"
        planTier={planTier}
      />
    )
  }

  // No prompt to show
  return null
}
