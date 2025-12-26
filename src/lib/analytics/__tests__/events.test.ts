/**
 * Tests for Analytics Events
 */

// Mock analytics config before imports
jest.mock('../config', () => ({
  trackEvent: jest.fn(),
  identifyUser: jest.fn(),
  setUserProperties: jest.fn(),
  incrementUserProperty: jest.fn(),
  trackRevenue: jest.fn(),
}));

import {
  trackLandingPageViewed,
  trackPricingPageViewed,
  trackFAQExpanded,
  trackRegistrationStarted,
  trackRegistrationCompleted,
  trackOnboardingStarted,
  trackOnboardingStepViewed,
  trackOnboardingCompleted,
  trackOnboardingSkipped,
  trackFirstAppCreated,
  trackPaywallDisplayed,
  trackPaywallDismissed,
  trackPaywallCTAClicked,
  trackUpgradeButtonClicked,
  trackCheckoutStarted,
  trackCheckoutCompleted,
  trackCheckoutAbandoned,
  trackTrialStarted,
  trackTrialEnded,
  trackAppCreated,
  trackAppUpdated,
  trackExportCreated,
  trackBuildCreated,
} from '../events';

import {
  trackEvent,
  identifyUser,
  setUserProperties,
  incrementUserProperty,
} from '../config';

const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>;
const mockIdentifyUser = identifyUser as jest.MockedFunction<typeof identifyUser>;
const mockSetUserProperties = setUserProperties as jest.MockedFunction<typeof setUserProperties>;
const mockIncrementUserProperty = incrementUserProperty as jest.MockedFunction<typeof incrementUserProperty>;

describe('Analytics Events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Acquisition Events', () => {
    it('should track landing page viewed', () => {
      trackLandingPageViewed();

      expect(mockTrackEvent).toHaveBeenCalledWith('Landing_Page_Viewed');
    });

    it('should track pricing page viewed without source', () => {
      trackPricingPageViewed();

      expect(mockTrackEvent).toHaveBeenCalledWith('Pricing_Page_Viewed', {
        source: undefined,
      });
    });

    it('should track pricing page viewed with source', () => {
      trackPricingPageViewed('header');

      expect(mockTrackEvent).toHaveBeenCalledWith('Pricing_Page_Viewed', {
        source: 'header',
      });
    });

    it('should track FAQ expanded', () => {
      trackFAQExpanded('What is included in the free plan?');

      expect(mockTrackEvent).toHaveBeenCalledWith('FAQ_Expanded', {
        question: 'What is included in the free plan?',
      });
    });
  });

  describe('Activation Events', () => {
    it('should track registration started', () => {
      trackRegistrationStarted();

      expect(mockTrackEvent).toHaveBeenCalledWith('Registration_Started');
    });

    it('should track registration completed', () => {
      trackRegistrationCompleted('user-123', 'test@example.com');

      expect(mockTrackEvent).toHaveBeenCalledWith('Registration_Completed');
      expect(mockIdentifyUser).toHaveBeenCalledWith('user-123', {
        $email: 'test@example.com',
        $created: expect.any(String),
        planTier: 'FREE',
      });
    });

    it('should track onboarding started', () => {
      trackOnboardingStarted();

      expect(mockTrackEvent).toHaveBeenCalledWith('Onboarding_Started');
    });

    it('should track onboarding step viewed', () => {
      trackOnboardingStepViewed(1, 'Welcome');

      expect(mockTrackEvent).toHaveBeenCalledWith('Onboarding_Step_Viewed', {
        step: 1,
        stepName: 'Welcome',
      });
    });

    it('should track onboarding completed', () => {
      trackOnboardingCompleted();

      expect(mockTrackEvent).toHaveBeenCalledWith('Onboarding_Completed');
    });

    it('should track onboarding skipped', () => {
      trackOnboardingSkipped(2);

      expect(mockTrackEvent).toHaveBeenCalledWith('Onboarding_Skipped', {
        atStep: 2,
      });
    });

    it('should track first app created', () => {
      const timeSinceSignup = 300000; // 5 minutes

      trackFirstAppCreated('app-123', 'My First App', timeSinceSignup);

      expect(mockTrackEvent).toHaveBeenCalledWith('First_App_Created', {
        appId: 'app-123',
        appName: 'My First App',
        minutesSinceSignup: 5,
      });
      expect(mockSetUserProperties).toHaveBeenCalledWith({
        hasCreatedApp: true,
      });
    });
  });

  describe('Conversion Events', () => {
    it('should track paywall displayed', () => {
      trackPaywallDisplayed({
        feature: 'Advanced Export',
        requiredPlan: 'PRO',
        currentPlan: 'FREE',
        appsCreated: 3,
      });

      expect(mockTrackEvent).toHaveBeenCalledWith('Paywall_Displayed', {
        feature: 'Advanced Export',
        requiredPlan: 'PRO',
        currentPlan: 'FREE',
        appsCreated: 3,
      });
    });

    it('should track paywall dismissed', () => {
      trackPaywallDismissed('Advanced Export');

      expect(mockTrackEvent).toHaveBeenCalledWith('Paywall_Dismissed', {
        feature: 'Advanced Export',
      });
    });

    it('should track paywall CTA clicked', () => {
      trackPaywallCTAClicked('Advanced Export', 'PRO');

      expect(mockTrackEvent).toHaveBeenCalledWith('Paywall_CTA_Clicked', {
        feature: 'Advanced Export',
        requiredPlan: 'PRO',
      });
    });

    it('should track upgrade button clicked', () => {
      trackUpgradeButtonClicked({
        location: 'paywall',
        targetPlan: 'PRO',
        currentPlan: 'FREE',
      });

      expect(mockTrackEvent).toHaveBeenCalledWith('Upgrade_Button_Clicked', {
        location: 'paywall',
        targetPlan: 'PRO',
        currentPlan: 'FREE',
      });
    });

    it('should track checkout started', () => {
      trackCheckoutStarted({
        planTier: 'PRO',
        interval: 'month',
        priceId: 'price_123',
        amount: 2900,
      });

      expect(mockTrackEvent).toHaveBeenCalledWith('Checkout_Started', {
        planTier: 'PRO',
        interval: 'month',
        priceId: 'price_123',
        amount: 2900,
      });
    });

    it('should track checkout completed', () => {
      trackCheckoutCompleted({
        planTier: 'PRO',
        interval: 'month',
        amount: 2900,
        subscriptionId: 'sub_123',
      });

      expect(mockTrackEvent).toHaveBeenCalledWith('Checkout_Completed', {
        planTier: 'PRO',
        interval: 'month',
        amount: 2900,
        subscriptionId: 'sub_123',
      });
    });

    it('should track checkout abandoned', () => {
      trackCheckoutAbandoned({
        planTier: 'PRO',
        atStep: 'payment-details',
      });

      expect(mockTrackEvent).toHaveBeenCalledWith('Checkout_Abandoned', {
        planTier: 'PRO',
        atStep: 'payment-details',
      });
    });

    it('should track trial started', () => {
      trackTrialStarted('PRO');

      expect(mockTrackEvent).toHaveBeenCalledWith('Trial_Started', {
        planTier: 'PRO',
      });
      expect(mockSetUserProperties).toHaveBeenCalledWith({
        planTier: 'PRO',
        trialStartDate: expect.any(String),
        isTrialing: true,
      });
    });

    it('should track trial ended with conversion', () => {
      trackTrialEnded(true, 'PRO');

      expect(mockTrackEvent).toHaveBeenCalledWith('Trial_Ended', {
        converted: true,
        planTier: 'PRO',
      });
      expect(mockSetUserProperties).toHaveBeenCalledWith({
        isTrialing: false,
      });
    });

    it('should track trial ended without conversion', () => {
      trackTrialEnded(false, 'PRO');

      expect(mockTrackEvent).toHaveBeenCalledWith('Trial_Ended', {
        converted: false,
        planTier: 'PRO',
      });
      expect(mockSetUserProperties).toHaveBeenCalledWith({
        isTrialing: false,
      });
    });
  });

  describe('Retention Events', () => {
    it('should track app created', () => {
      trackAppCreated({
        appId: 'app-456',
        appName: 'Second App',
        totalApps: 2,
        planTier: 'FREE',
      });

      expect(mockTrackEvent).toHaveBeenCalledWith('App_Created', {
        appId: 'app-456',
        appName: 'Second App',
        totalApps: 2,
        planTier: 'FREE',
      });
      expect(mockIncrementUserProperty).toHaveBeenCalledWith('totalAppsCreated');
      expect(mockSetUserProperties).toHaveBeenCalledWith({
        lastAppCreated: expect.any(String),
      });
    });

    it('should track app updated', () => {
      trackAppUpdated('app-456');

      expect(mockTrackEvent).toHaveBeenCalledWith('App_Updated', {
        appId: 'app-456',
      });
      expect(mockIncrementUserProperty).toHaveBeenCalledWith('totalAppUpdates');
    });

    it('should track export created', () => {
      trackExportCreated({
        format: 'json',
        exportsThisMonth: 5,
        maxExports: 10,
        planTier: 'FREE',
      });

      expect(mockTrackEvent).toHaveBeenCalledWith('Export_Created', {
        format: 'json',
        exportsThisMonth: 5,
        maxExports: 10,
        planTier: 'FREE',
      });
      expect(mockIncrementUserProperty).toHaveBeenCalledWith('totalExports');
    });

    it('should track build created', () => {
      trackBuildCreated({
        platform: 'android',
        buildsThisMonth: 2,
        maxBuilds: 5,
        planTier: 'PRO',
      });

      expect(mockTrackEvent).toHaveBeenCalledWith('Build_Created', {
        platform: 'android',
        buildsThisMonth: 2,
        maxBuilds: 5,
        planTier: 'PRO',
      });
      expect(mockIncrementUserProperty).toHaveBeenCalledWith('totalBuilds');
    });
  });

  describe('Time Calculations', () => {
    it('should convert milliseconds to minutes in first app created', () => {
      const oneMinute = 60000;
      const fiveMinutes = 300000;
      const oneHour = 3600000;

      trackFirstAppCreated('app-1', 'App 1', oneMinute);
      expect(mockTrackEvent).toHaveBeenCalledWith(
        'First_App_Created',
        expect.objectContaining({ minutesSinceSignup: 1 })
      );

      trackFirstAppCreated('app-2', 'App 2', fiveMinutes);
      expect(mockTrackEvent).toHaveBeenCalledWith(
        'First_App_Created',
        expect.objectContaining({ minutesSinceSignup: 5 })
      );

      trackFirstAppCreated('app-3', 'App 3', oneHour);
      expect(mockTrackEvent).toHaveBeenCalledWith(
        'First_App_Created',
        expect.objectContaining({ minutesSinceSignup: 60 })
      );
    });

    it('should round milliseconds to nearest minute', () => {
      trackFirstAppCreated('app-1', 'App', 90000); // 1.5 minutes

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'First_App_Created',
        expect.objectContaining({ minutesSinceSignup: 2 })
      );
    });
  });

  describe('User Property Updates', () => {
    it('should set hasCreatedApp when first app created', () => {
      trackFirstAppCreated('app-123', 'My App', 60000);

      expect(mockSetUserProperties).toHaveBeenCalledWith({
        hasCreatedApp: true,
      });
    });

    it('should increment totalAppsCreated when app created', () => {
      trackAppCreated({
        appId: 'app-123',
        appName: 'App',
        totalApps: 1,
        planTier: 'FREE',
      });

      expect(mockIncrementUserProperty).toHaveBeenCalledWith('totalAppsCreated');
    });

    it('should increment totalExports when export created', () => {
      trackExportCreated({
        format: 'json',
        exportsThisMonth: 1,
        maxExports: 10,
        planTier: 'FREE',
      });

      expect(mockIncrementUserProperty).toHaveBeenCalledWith('totalExports');
    });

    it('should increment totalBuilds when build created', () => {
      trackBuildCreated({
        platform: 'android',
        buildsThisMonth: 1,
        maxBuilds: 5,
        planTier: 'FREE',
      });

      expect(mockIncrementUserProperty).toHaveBeenCalledWith('totalBuilds');
    });

    it('should set trial properties when trial started', () => {
      trackTrialStarted('PRO');

      expect(mockSetUserProperties).toHaveBeenCalledWith({
        planTier: 'PRO',
        trialStartDate: expect.any(String),
        isTrialing: true,
      });
    });

    it('should update properties when trial ended', () => {
      trackTrialEnded(true, 'PRO');

      expect(mockSetUserProperties).toHaveBeenCalledWith({
        isTrialing: false,
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings in event parameters', () => {
      trackFAQExpanded('');

      expect(mockTrackEvent).toHaveBeenCalledWith('FAQ_Expanded', {
        question: '',
      });
    });

    it('should handle undefined optional parameters', () => {
      trackPricingPageViewed(undefined);

      expect(mockTrackEvent).toHaveBeenCalledWith('Pricing_Page_Viewed', {
        source: undefined,
      });
    });

    it('should handle zero values in numeric parameters', () => {
      trackOnboardingSkipped(0);

      expect(mockTrackEvent).toHaveBeenCalledWith('Onboarding_Skipped', {
        atStep: 0,
      });
    });
  });
});
