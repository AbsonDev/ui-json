'use client';

/**
 * useAnalytics Hook
 *
 * Simple hook to access analytics tracking in any component
 *
 * Usage:
 * const { track } = useAnalytics();
 * track.trackPricingPageViewed('header_button');
 */

export { useAnalytics } from '@/contexts/AnalyticsContext';
