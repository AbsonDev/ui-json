'use client';

/**
 * Analytics Context Provider
 *
 * Wraps the app and provides analytics tracking to all components
 */

import React, { createContext, useContext, useEffect } from 'react';
import { initAnalytics } from '@/lib/analytics/config';
import * as analytics from '@/lib/analytics/events';

interface AnalyticsContextType {
  // All analytics functions are available through the context
  track: typeof analytics;
  isEnabled: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const isEnabled = !!process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

  useEffect(() => {
    // Initialize Mixpanel on mount
    if (isEnabled) {
      initAnalytics();
    }
  }, [isEnabled]);

  return (
    <AnalyticsContext.Provider value={{ track: analytics, isEnabled }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);

  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }

  return context;
}
