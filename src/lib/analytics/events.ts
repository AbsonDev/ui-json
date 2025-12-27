/**
 * Analytics Events - Centralized event definitions
 *
 * All tracking events organized by funnel stage:
 * - Acquisition (landing, pricing)
 * - Activation (registration, onboarding)
 * - Conversion (paywall, checkout, trial)
 * - Retention (usage, engagement)
 * - Revenue (upgrades, payments)
 */

import { trackEvent, identifyUser, setUserProperties, incrementUserProperty, trackRevenue } from './config';

// ============================================
// ACQUISITION EVENTS
// ============================================

export const trackLandingPageViewed = () => {
  trackEvent('Landing_Page_Viewed');
};

export const trackPricingPageViewed = (source?: string) => {
  trackEvent('Pricing_Page_Viewed', { source });
};

export const trackFAQExpanded = (question: string) => {
  trackEvent('FAQ_Expanded', { question });
};

// ============================================
// ACTIVATION EVENTS
// ============================================

export const trackRegistrationStarted = () => {
  trackEvent('Registration_Started');
};

export const trackRegistrationCompleted = (userId: string, userEmail: string) => {
  trackEvent('Registration_Completed');
  identifyUser(userId, {
    $email: userEmail,
    $created: new Date().toISOString(),
    planTier: 'FREE',
  });
};

export const trackOnboardingStarted = () => {
  trackEvent('Onboarding_Started');
};

export const trackOnboardingStepViewed = (step: number, stepName: string) => {
  trackEvent('Onboarding_Step_Viewed', { step, stepName });
};

export const trackOnboardingCompleted = () => {
  trackEvent('Onboarding_Completed');
};

export const trackOnboardingSkipped = (atStep: number) => {
  trackEvent('Onboarding_Skipped', { atStep });
};

export const trackFirstAppCreated = (appId: string, appName: string, timeSinceSignup: number) => {
  trackEvent('First_App_Created', {
    appId,
    appName,
    minutesSinceSignup: Math.round(timeSinceSignup / 60000),
  });
  setUserProperties({ hasCreatedApp: true });
};

// ============================================
// CONVERSION EVENTS (Critical!)
// ============================================

export const trackPaywallDisplayed = (params: {
  feature: string;
  requiredPlan: string;
  currentPlan: string;
  appsCreated?: number;
  daysSinceSignup?: number;
}) => {
  trackEvent('Paywall_Displayed', params);
};

export const trackPaywallDismissed = (feature: string) => {
  trackEvent('Paywall_Dismissed', { feature });
};

export const trackPaywallCTAClicked = (feature: string, requiredPlan: string) => {
  trackEvent('Paywall_CTA_Clicked', { feature, requiredPlan });
};

export const trackUsageWarningShown = (params: {
  limitType: string;
  percentage: number;
  current: number;
  max: number;
}) => {
  trackEvent('Usage_Warning_Shown', params);
};

export const trackUpgradeButtonClicked = (params: {
  location: string; // 'paywall', 'usage_indicator', 'pricing_page', 'proactive_prompt'
  targetPlan: string;
  currentPlan: string;
}) => {
  trackEvent('Upgrade_Button_Clicked', params);
};

export const trackCheckoutStarted = (params: {
  planTier: string;
  interval: 'monthly' | 'yearly';
  price: number;
  source: string; // where they clicked from
}) => {
  trackEvent('Checkout_Started', params);
};

export const trackCheckoutCompleted = (params: {
  planTier: string;
  interval: 'monthly' | 'yearly';
  amount: number;
  customerId: string;
}) => {
  trackEvent('Checkout_Completed', params);
  trackRevenue(params.amount, {
    planTier: params.planTier,
    interval: params.interval,
  });
};

export const trackCheckoutAbandoned = (params: {
  planTier: string;
  interval: 'monthly' | 'yearly';
}) => {
  trackEvent('Checkout_Abandoned', params);
};

export const trackTrialStarted = (planTier: string) => {
  trackEvent('Trial_Started', { planTier });
  setUserProperties({
    planTier,
    trialStartDate: new Date().toISOString(),
    isTrialing: true,
  });
};

export const trackTrialEnded = (converted: boolean, planTier: string) => {
  trackEvent('Trial_Ended', { converted, planTier });
  setUserProperties({ isTrialing: false });
};

// ============================================
// PROACTIVE PROMPTS (New!)
// ============================================

export const trackProactivePromptShown = (params: {
  promptType: 'second_app' | 'after_export' | 'third_day' | 'ai_limit' | 'build_opportunity';
  currentPlan: string;
}) => {
  trackEvent('Proactive_Prompt_Shown', params);
};

export const trackProactivePromptClicked = (promptType: string) => {
  trackEvent('Proactive_Prompt_Clicked', { promptType });
};

export const trackProactivePromptDismissed = (promptType: string) => {
  trackEvent('Proactive_Prompt_Dismissed', { promptType });
};

// ============================================
// RETENTION & ENGAGEMENT EVENTS
// ============================================

export const trackAppCreated = (params: {
  appId: string;
  appName: string;
  totalApps: number;
  planTier: string;
}) => {
  trackEvent('App_Created', params);
  incrementUserProperty('totalAppsCreated');
  setUserProperties({ lastAppCreated: new Date().toISOString() });
};

export const trackAppUpdated = (appId: string) => {
  trackEvent('App_Updated', { appId });
  incrementUserProperty('totalAppUpdates');
};

export const trackTemplateUsed = (templateId: string, templateName: string) => {
  trackEvent('Template_Used', { templateId, templateName });
  incrementUserProperty('totalTemplatesUsed');
};

export const trackAIAssistantUsed = (params: {
  prompt: string;
  requestsToday: number;
  maxRequests: number;
  planTier: string;
}) => {
  trackEvent('AI_Assistant_Used', params);
  incrementUserProperty('totalAIRequests');
};

export const trackExportCreated = (params: {
  format: string;
  exportsThisMonth: number;
  maxExports: number;
  planTier: string;
}) => {
  trackEvent('Export_Created', params);
  incrementUserProperty('totalExports');
};

export const trackBuildCreated = (params: {
  platform: 'ios' | 'android' | 'both';
  buildsThisMonth: number;
  maxBuilds: number;
  planTier: string;
}) => {
  trackEvent('Build_Created', params);
  incrementUserProperty('totalBuilds');
};

export const trackDatabaseConnected = (provider: string) => {
  trackEvent('Database_Connected', { provider });
};

// ============================================
// REVENUE EVENTS
// ============================================

export const trackSubscriptionUpgraded = (params: {
  fromPlan: string;
  toPlan: string;
  newAmount: number;
}) => {
  trackEvent('Subscription_Upgraded', params);
  setUserProperties({
    planTier: params.toPlan,
    lastUpgradeDate: new Date().toISOString(),
  });
};

export const trackSubscriptionDowngraded = (params: {
  fromPlan: string;
  toPlan: string;
  newAmount: number;
}) => {
  trackEvent('Subscription_Downgraded', params);
  setUserProperties({ planTier: params.toPlan });
};

export const trackSubscriptionCanceled = (params: {
  planTier: string;
  reason?: string;
  monthsSubscribed: number;
}) => {
  trackEvent('Subscription_Canceled', params);
  setUserProperties({
    planTier: 'FREE',
    canceledDate: new Date().toISOString(),
    cancelReason: params.reason,
  });
};

export const trackPaymentFailed = (params: {
  planTier: string;
  amount: number;
  reason?: string;
}) => {
  trackEvent('Payment_Failed', params);
};

export const trackPaymentRecovered = (params: {
  planTier: string;
  amount: number;
}) => {
  trackEvent('Payment_Recovered', params);
};

// ============================================
// BILLING DASHBOARD EVENTS
// ============================================

export const trackBillingPageViewed = (planTier: string) => {
  trackEvent('Billing_Page_Viewed', { planTier });
};

export const trackInvoiceDownloaded = (invoiceId: string, amount: number) => {
  trackEvent('Invoice_Downloaded', { invoiceId, amount });
};

export const trackPaymentMethodUpdated = () => {
  trackEvent('Payment_Method_Updated');
};

export const trackCancelSubscriptionClicked = (planTier: string) => {
  trackEvent('Cancel_Subscription_Clicked', { planTier });
};

// ============================================
// EMAIL EVENTS
// ============================================

export const trackEmailSent = (emailType: string, trialDay?: number) => {
  trackEvent('Email_Sent', { emailType, trialDay });
};

export const trackEmailOpened = (emailType: string) => {
  trackEvent('Email_Opened', { emailType });
};

export const trackEmailClicked = (emailType: string, linkName: string) => {
  trackEvent('Email_Clicked', { emailType, linkName });
};

// ============================================
// HELPER: Track Page View
// ============================================

export const trackPageView = (pageName: string, properties?: Record<string, any>) => {
  trackEvent('Page_Viewed', {
    page: pageName,
    ...properties,
  });
};
