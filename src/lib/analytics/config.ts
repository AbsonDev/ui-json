/**
 * Analytics Configuration - Mixpanel Setup
 *
 * IMPORTANT: Adicione sua chave do Mixpanel em .env.local:
 * NEXT_PUBLIC_MIXPANEL_TOKEN=seu_token_aqui
 */

import mixpanel from 'mixpanel-browser';
import logger from '../logger';

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '';
const isDevelopment = process.env.NODE_ENV === 'development';

// Initialize Mixpanel
export const initAnalytics = () => {
  if (!MIXPANEL_TOKEN) {
    logger.warn('⚠️ Mixpanel token not found. Analytics disabled.');
    return;
  }

  mixpanel.init(MIXPANEL_TOKEN, {
    debug: isDevelopment,
    track_pageview: true,
    persistence: 'localStorage',
    ignore_dnt: true, // Track even if Do Not Track is enabled
  });

  if (isDevelopment) {
    logger.info('🔍 Mixpanel initialized in development mode');
  }
};

// Track event
export const trackEvent = (
  eventName: string,
  properties?: Record<string, any>
) => {
  if (!MIXPANEL_TOKEN) return;

  mixpanel.track(eventName, {
    ...properties,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
};

// Identify user
export const identifyUser = (
  userId: string,
  userProperties?: Record<string, any>
) => {
  if (!MIXPANEL_TOKEN) return;

  mixpanel.identify(userId);

  if (userProperties) {
    mixpanel.people.set(userProperties);
  }
};

// Set user properties
export const setUserProperties = (properties: Record<string, any>) => {
  if (!MIXPANEL_TOKEN) return;

  mixpanel.people.set(properties);
};

// Increment user property
export const incrementUserProperty = (property: string, value: number = 1) => {
  if (!MIXPANEL_TOKEN) return;

  mixpanel.people.increment(property, value);
};

// Reset user (on logout)
export const resetAnalytics = () => {
  if (!MIXPANEL_TOKEN) return;

  mixpanel.reset();
};

// Track revenue
export const trackRevenue = (amount: number, properties?: Record<string, any>) => {
  if (!MIXPANEL_TOKEN) return;

  mixpanel.people.track_charge(amount, properties);
};

export default mixpanel;
