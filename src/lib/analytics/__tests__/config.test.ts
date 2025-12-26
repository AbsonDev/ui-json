/**
 * Tests for Analytics Configuration
 */

// Mock mixpanel before imports
const mockMixpanelInstance = {
  init: jest.fn(),
  track: jest.fn(),
  identify: jest.fn(),
  people: {
    set: jest.fn(),
    increment: jest.fn(),
    track_charge: jest.fn(),
  },
  reset: jest.fn(),
};

jest.mock('mixpanel-browser', () => mockMixpanelInstance);

describe('Analytics Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('initAnalytics', () => {
    it('should initialize mixpanel when token is provided', () => {
      process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = 'test-token-123';
      process.env.NODE_ENV = 'production';

      // Re-import to get new env values
      jest.resetModules();
      const { initAnalytics } = require('../config');

      initAnalytics();

      expect(mockMixpanelInstance.init).toHaveBeenCalledWith('test-token-123', {
        debug: false,
        track_pageview: true,
        persistence: 'localStorage',
        ignore_dnt: true,
      });
    });

    it('should enable debug mode in development', () => {
      process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = 'test-token';
      process.env.NODE_ENV = 'development';

      jest.resetModules();
      const { initAnalytics } = require('../config');

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      initAnalytics();

      expect(mockMixpanelInstance.init).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ debug: true })
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Mixpanel initialized')
      );

      consoleLogSpy.mockRestore();
    });

    it('should warn when token is not provided', () => {
      process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = '';

      jest.resetModules();
      const { initAnalytics } = require('../config');

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      initAnalytics();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Mixpanel token not found')
      );
      expect(mockMixpanelInstance.init).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('trackEvent', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = 'test-token';
      process.env.NODE_ENV = 'test';
      jest.resetModules();
    });

    it('should track event with properties', () => {
      const { trackEvent } = require('../config');

      trackEvent('Test_Event', { prop1: 'value1', prop2: 123 });

      expect(mockMixpanelInstance.track).toHaveBeenCalledWith('Test_Event', {
        prop1: 'value1',
        prop2: 123,
        timestamp: expect.any(String),
        environment: 'test',
      });
    });

    it('should track event without properties', () => {
      const { trackEvent } = require('../config');

      trackEvent('Simple_Event');

      expect(mockMixpanelInstance.track).toHaveBeenCalledWith('Simple_Event', {
        timestamp: expect.any(String),
        environment: 'test',
      });
    });

    it('should not track when token is missing', () => {
      process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = '';
      jest.resetModules();
      const { trackEvent } = require('../config');

      trackEvent('Test_Event');

      expect(mockMixpanelInstance.track).not.toHaveBeenCalled();
    });

    it('should include timestamp in ISO format', () => {
      const { trackEvent } = require('../config');

      trackEvent('Event_With_Time');

      const call = mockMixpanelInstance.track.mock.calls[0];
      const timestamp = call[1].timestamp;

      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('identifyUser', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = 'test-token';
      jest.resetModules();
    });

    it('should identify user with properties', () => {
      const { identifyUser } = require('../config');

      identifyUser('user-123', {
        $email: 'test@example.com',
        planTier: 'PRO',
      });

      expect(mockMixpanelInstance.identify).toHaveBeenCalledWith('user-123');
      expect(mockMixpanelInstance.people.set).toHaveBeenCalledWith({
        $email: 'test@example.com',
        planTier: 'PRO',
      });
    });

    it('should identify user without properties', () => {
      const { identifyUser } = require('../config');

      identifyUser('user-456');

      expect(mockMixpanelInstance.identify).toHaveBeenCalledWith('user-456');
      expect(mockMixpanelInstance.people.set).not.toHaveBeenCalled();
    });

    it('should not identify when token is missing', () => {
      process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = '';
      jest.resetModules();
      const { identifyUser } = require('../config');

      identifyUser('user-789', { prop: 'value' });

      expect(mockMixpanelInstance.identify).not.toHaveBeenCalled();
      expect(mockMixpanelInstance.people.set).not.toHaveBeenCalled();
    });
  });

  describe('setUserProperties', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = 'test-token';
      jest.resetModules();
    });

    it('should set user properties', () => {
      const { setUserProperties } = require('../config');

      setUserProperties({
        hasCreatedApp: true,
        totalApps: 5,
      });

      expect(mockMixpanelInstance.people.set).toHaveBeenCalledWith({
        hasCreatedApp: true,
        totalApps: 5,
      });
    });

    it('should not set properties when token is missing', () => {
      process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = '';
      jest.resetModules();
      const { setUserProperties } = require('../config');

      setUserProperties({ prop: 'value' });

      expect(mockMixpanelInstance.people.set).not.toHaveBeenCalled();
    });
  });

  describe('incrementUserProperty', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = 'test-token';
      jest.resetModules();
    });

    it('should increment property by default value (1)', () => {
      const { incrementUserProperty } = require('../config');

      incrementUserProperty('totalApps');

      expect(mockMixpanelInstance.people.increment).toHaveBeenCalledWith(
        'totalApps',
        1
      );
    });

    it('should increment property by custom value', () => {
      const { incrementUserProperty } = require('../config');

      incrementUserProperty('credits', 50);

      expect(mockMixpanelInstance.people.increment).toHaveBeenCalledWith(
        'credits',
        50
      );
    });

    it('should not increment when token is missing', () => {
      process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = '';
      jest.resetModules();
      const { incrementUserProperty } = require('../config');

      incrementUserProperty('totalApps');

      expect(mockMixpanelInstance.people.increment).not.toHaveBeenCalled();
    });
  });

  describe('resetAnalytics', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = 'test-token';
      jest.resetModules();
    });

    it('should reset mixpanel on logout', () => {
      const { resetAnalytics } = require('../config');

      resetAnalytics();

      expect(mockMixpanelInstance.reset).toHaveBeenCalled();
    });

    it('should not reset when token is missing', () => {
      process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = '';
      jest.resetModules();
      const { resetAnalytics } = require('../config');

      resetAnalytics();

      expect(mockMixpanelInstance.reset).not.toHaveBeenCalled();
    });
  });

  describe('trackRevenue', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = 'test-token';
      jest.resetModules();
    });

    it('should track revenue with properties', () => {
      const { trackRevenue } = require('../config');

      trackRevenue(2900, {
        planTier: 'PRO',
        interval: 'monthly',
      });

      expect(mockMixpanelInstance.people.track_charge).toHaveBeenCalledWith(
        2900,
        {
          planTier: 'PRO',
          interval: 'monthly',
        }
      );
    });

    it('should track revenue without properties', () => {
      const { trackRevenue } = require('../config');

      trackRevenue(1999);

      expect(mockMixpanelInstance.people.track_charge).toHaveBeenCalledWith(
        1999,
        undefined
      );
    });

    it('should not track revenue when token is missing', () => {
      process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = '';
      jest.resetModules();
      const { trackRevenue } = require('../config');

      trackRevenue(5000);

      expect(mockMixpanelInstance.people.track_charge).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = 'test-token';
      jest.resetModules();
    });

    it('should handle empty properties object', () => {
      const { trackEvent, setUserProperties } = require('../config');

      trackEvent('Event', {});
      setUserProperties({});

      expect(mockMixpanelInstance.track).toHaveBeenCalled();
      expect(mockMixpanelInstance.people.set).toHaveBeenCalledWith({});
    });

    it('should handle null/undefined values in properties', () => {
      const { trackEvent } = require('../config');

      trackEvent('Event', {
        prop1: null,
        prop2: undefined,
        prop3: 'value',
      });

      expect(mockMixpanelInstance.track).toHaveBeenCalledWith(
        'Event',
        expect.objectContaining({
          prop1: null,
          prop2: undefined,
          prop3: 'value',
        })
      );
    });

    it('should handle special characters in event names', () => {
      const { trackEvent } = require('../config');

      trackEvent('Event-With_Special.Characters!');

      expect(mockMixpanelInstance.track).toHaveBeenCalledWith(
        'Event-With_Special.Characters!',
        expect.any(Object)
      );
    });

    it('should handle zero as increment value', () => {
      const { incrementUserProperty } = require('../config');

      incrementUserProperty('counter', 0);

      expect(mockMixpanelInstance.people.increment).toHaveBeenCalledWith(
        'counter',
        0
      );
    });

    it('should handle negative increment values', () => {
      const { incrementUserProperty } = require('../config');

      incrementUserProperty('credits', -10);

      expect(mockMixpanelInstance.people.increment).toHaveBeenCalledWith(
        'credits',
        -10
      );
    });
  });
});
