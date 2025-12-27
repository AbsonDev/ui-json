/**
 * @jest-environment node
 */

// Mock auth module BEFORE any imports
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

// Mock Prisma BEFORE any imports
jest.mock('@/lib/prisma', () => ({
  prisma: {
    usageMetric: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    app: {
      count: jest.fn(),
    },
    build: {
      count: jest.fn(),
    },
  },
}));

// Mock limits module BEFORE any imports
jest.mock('../limits', () => ({
  checkAppLimit: jest.fn(),
  checkBuildLimit: jest.fn(),
  checkExportLimit: jest.fn(),
  checkFeatureAccess: jest.fn(),
  getUserUsageStats: jest.fn(),
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  checkAppLimit,
  checkBuildLimit,
  checkExportLimit,
  checkFeatureAccess,
  getUserUsageStats,
} from '../limits';
import {
  UsageLimitError,
  enforceAppLimit,
  enforceBuildLimit,
  enforceExportLimit,
  enforceFeatureAccess,
  trackExport,
} from '../enforcement';

describe('Subscription Enforcement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UsageLimitError', () => {
    it('should create error with correct properties', () => {
      const error = new UsageLimitError('Test message', 'apps', 5, 3, '/pricing');

      expect(error.name).toBe('UsageLimitError');
      expect(error.message).toBe('Test message');
      expect(error.limitType).toBe('apps');
      expect(error.currentUsage).toBe(5);
      expect(error.limit).toBe(3);
      expect(error.upgradeUrl).toBe('/pricing');
    });

    it('should use default upgrade URL', () => {
      const error = new UsageLimitError('Test message', 'apps', 5, 3);

      expect(error.upgradeUrl).toBe('/pricing');
    });
  });

  describe('enforceAppLimit', () => {
    it('should pass when user is under app limit', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'user@test.com' },
      };

      (auth as jest.Mock).mockResolvedValue(mockSession);
      (checkAppLimit as jest.Mock).mockResolvedValue(true);

      await expect(enforceAppLimit()).resolves.not.toThrow();
      expect(checkAppLimit).toHaveBeenCalledWith('user-123');
    });

    it('should throw UsageLimitError when app limit exceeded', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'user@test.com' },
      };

      const mockStats = {
        apps: { current: 3, limit: 3, percentage: 100 },
        builds: { current: 5, limit: 10, percentage: 50 },
        exports: { current: 2, limit: 5, percentage: 40 },
      };

      (auth as jest.Mock).mockResolvedValue(mockSession);
      (checkAppLimit as jest.Mock).mockResolvedValue(false);
      (getUserUsageStats as jest.Mock).mockResolvedValue(mockStats);

      await expect(enforceAppLimit()).rejects.toThrow(UsageLimitError);

      try {
        await enforceAppLimit();
      } catch (error) {
        expect(error).toBeInstanceOf(UsageLimitError);
        expect((error as UsageLimitError).limitType).toBe('apps');
        expect((error as UsageLimitError).currentUsage).toBe(3);
        expect((error as UsageLimitError).limit).toBe(3);
        expect((error as UsageLimitError).message).toContain('app limit');
      }
    });

    it('should throw error when not authenticated', async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      await expect(enforceAppLimit()).rejects.toThrow('Unauthorized');
      expect(checkAppLimit).not.toHaveBeenCalled();
    });

    it('should throw error when session has no user', async () => {
      (auth as jest.Mock).mockResolvedValue({ user: null });

      await expect(enforceAppLimit()).rejects.toThrow('Unauthorized');
      expect(checkAppLimit).not.toHaveBeenCalled();
    });
  });

  describe('enforceBuildLimit', () => {
    it('should pass when user is under build limit', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'user@test.com' },
      };

      (auth as jest.Mock).mockResolvedValue(mockSession);
      (checkBuildLimit as jest.Mock).mockResolvedValue(true);

      await expect(enforceBuildLimit()).resolves.not.toThrow();
      expect(checkBuildLimit).toHaveBeenCalledWith('user-123');
    });

    it('should throw UsageLimitError when build limit exceeded', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'user@test.com' },
      };

      const mockStats = {
        apps: { current: 2, limit: 3, percentage: 66 },
        builds: { current: 10, limit: 10, percentage: 100 },
        exports: { current: 2, limit: 5, percentage: 40 },
      };

      (auth as jest.Mock).mockResolvedValue(mockSession);
      (checkBuildLimit as jest.Mock).mockResolvedValue(false);
      (getUserUsageStats as jest.Mock).mockResolvedValue(mockStats);

      await expect(enforceBuildLimit()).rejects.toThrow(UsageLimitError);

      try {
        await enforceBuildLimit();
      } catch (error) {
        expect(error).toBeInstanceOf(UsageLimitError);
        expect((error as UsageLimitError).limitType).toBe('builds');
        expect((error as UsageLimitError).currentUsage).toBe(10);
        expect((error as UsageLimitError).limit).toBe(10);
        expect((error as UsageLimitError).message).toContain('monthly build limit');
      }
    });

    it('should throw error when not authenticated', async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      await expect(enforceBuildLimit()).rejects.toThrow('Unauthorized');
      expect(checkBuildLimit).not.toHaveBeenCalled();
    });
  });

  describe('enforceExportLimit', () => {
    it('should pass when user is under export limit', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'user@test.com' },
      };

      (auth as jest.Mock).mockResolvedValue(mockSession);
      (checkExportLimit as jest.Mock).mockResolvedValue(true);

      await expect(enforceExportLimit()).resolves.not.toThrow();
      expect(checkExportLimit).toHaveBeenCalledWith('user-123');
    });

    it('should throw UsageLimitError when export limit exceeded', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'user@test.com' },
      };

      const mockStats = {
        apps: { current: 2, limit: 3, percentage: 66 },
        builds: { current: 5, limit: 10, percentage: 50 },
        exports: { current: 5, limit: 5, percentage: 100 },
      };

      (auth as jest.Mock).mockResolvedValue(mockSession);
      (checkExportLimit as jest.Mock).mockResolvedValue(false);
      (getUserUsageStats as jest.Mock).mockResolvedValue(mockStats);

      await expect(enforceExportLimit()).rejects.toThrow(UsageLimitError);

      try {
        await enforceExportLimit();
      } catch (error) {
        expect(error).toBeInstanceOf(UsageLimitError);
        expect((error as UsageLimitError).limitType).toBe('exports');
        expect((error as UsageLimitError).currentUsage).toBe(5);
        expect((error as UsageLimitError).limit).toBe(5);
        expect((error as UsageLimitError).message).toContain('monthly export limit');
      }
    });

    it('should throw error when not authenticated', async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      await expect(enforceExportLimit()).rejects.toThrow('Unauthorized');
      expect(checkExportLimit).not.toHaveBeenCalled();
    });
  });

  describe('enforceFeatureAccess', () => {
    it('should pass when user has feature access', async () => {
      const mockSession = {
        user: { id: 'user-pro', email: 'pro@test.com' },
      };

      (auth as jest.Mock).mockResolvedValue(mockSession);
      (checkFeatureAccess as jest.Mock).mockResolvedValue(true);

      await expect(enforceFeatureAccess('aiAssistant')).resolves.not.toThrow();
      expect(checkFeatureAccess).toHaveBeenCalledWith('user-pro', 'aiAssistant');
    });

    it('should throw error when user does not have feature access', async () => {
      const mockSession = {
        user: { id: 'user-free', email: 'free@test.com' },
      };

      (auth as jest.Mock).mockResolvedValue(mockSession);
      (checkFeatureAccess as jest.Mock).mockResolvedValue(false);

      await expect(enforceFeatureAccess('aiAssistant')).rejects.toThrow(
        'This feature requires a paid plan. Upgrade to access AI Assistant.'
      );
    });

    it('should throw error when not authenticated', async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      await expect(enforceFeatureAccess('aiAssistant')).rejects.toThrow('Unauthorized');
      expect(checkFeatureAccess).not.toHaveBeenCalled();
    });

    it('should handle all feature types correctly', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'user@test.com' },
      };

      const features = [
        'customDomain',
        'prioritySupport',
        'removeWatermark',
        'teamCollaboration',
        'analytics',
        'versionHistory',
        'aiAssistant',
      ] as const;

      (auth as jest.Mock).mockResolvedValue(mockSession);
      (checkFeatureAccess as jest.Mock).mockResolvedValue(false);

      for (const feature of features) {
        await expect(enforceFeatureAccess(feature)).rejects.toThrow(
          'This feature requires a paid plan'
        );
      }

      expect(checkFeatureAccess).toHaveBeenCalledTimes(features.length);
    });
  });

  describe('trackExport', () => {
    it('should update existing usage metric when one exists', async () => {
      const mockUsageMetric = {
        id: 'metric-123',
        exportsCount: 3,
        userId: 'user-123',
      };

      (prisma.usageMetric.findFirst as jest.Mock).mockResolvedValue(mockUsageMetric);
      (prisma.usageMetric.update as jest.Mock).mockResolvedValue({
        ...mockUsageMetric,
        exportsCount: 4,
      });

      await trackExport('user-123');

      expect(prisma.usageMetric.update).toHaveBeenCalledWith({
        where: { id: 'metric-123' },
        data: {
          exportsCount: { increment: 1 },
        },
      });
      expect(prisma.usageMetric.create).not.toHaveBeenCalled();
    });

    it('should create new usage metric when none exists', async () => {
      (prisma.usageMetric.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.app.count as jest.Mock).mockResolvedValue(2);
      (prisma.build.count as jest.Mock).mockResolvedValue(5);
      (prisma.usageMetric.create as jest.Mock).mockResolvedValue({
        id: 'metric-new',
        userId: 'user-123',
        exportsCount: 1,
        appsCount: 2,
        buildsCount: 5,
      });

      await trackExport('user-123');

      expect(prisma.usageMetric.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          periodStart: expect.any(Date),
          periodEnd: expect.any(Date),
          exportsCount: 1,
          appsCount: 2,
          buildsCount: 5,
        },
      });
      expect(prisma.usageMetric.update).not.toHaveBeenCalled();
    });

    it('should calculate correct month boundaries', async () => {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      (prisma.usageMetric.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.app.count as jest.Mock).mockResolvedValue(2);
      (prisma.build.count as jest.Mock).mockResolvedValue(5);
      (prisma.usageMetric.create as jest.Mock).mockResolvedValue({});

      await trackExport('user-123');

      const createCall = (prisma.usageMetric.create as jest.Mock).mock.calls[0][0];

      // Verify month boundaries are correct
      expect(createCall.data.periodStart.getDate()).toBe(firstDayOfMonth.getDate());
      expect(createCall.data.periodEnd.getDate()).toBe(lastDayOfMonth.getDate());
    });

    it('should query builds for current month when creating metric', async () => {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      (prisma.usageMetric.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.app.count as jest.Mock).mockResolvedValue(2);
      (prisma.build.count as jest.Mock).mockResolvedValue(5);
      (prisma.usageMetric.create as jest.Mock).mockResolvedValue({});

      await trackExport('user-123');

      expect(prisma.build.count).toHaveBeenCalledWith({
        where: {
          app: { userId: 'user-123' },
          createdAt: { gte: expect.any(Date) },
        },
      });

      const buildCountCall = (prisma.build.count as jest.Mock).mock.calls[0][0];
      expect(buildCountCall.where.createdAt.gte.getDate()).toBe(firstDayOfMonth.getDate());
    });
  });

  describe('Security and Edge Cases', () => {
    it('should not leak usage stats when unauthorized', async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      await expect(enforceAppLimit()).rejects.toThrow('Unauthorized');
      expect(getUserUsageStats).not.toHaveBeenCalled();
    });

    it('should handle concurrent limit checks', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'user@test.com' },
      };

      (auth as jest.Mock).mockResolvedValue(mockSession);
      (checkAppLimit as jest.Mock).mockResolvedValue(true);
      (checkBuildLimit as jest.Mock).mockResolvedValue(true);
      (checkExportLimit as jest.Mock).mockResolvedValue(true);

      // Run all enforcements concurrently
      await Promise.all([enforceAppLimit(), enforceBuildLimit(), enforceExportLimit()]);

      expect(checkAppLimit).toHaveBeenCalledTimes(1);
      expect(checkBuildLimit).toHaveBeenCalledTimes(1);
      expect(checkExportLimit).toHaveBeenCalledTimes(1);
    });

    it('should preserve error message format for all limits', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'user@test.com' },
      };

      const limitTests = [
        {
          enforce: enforceAppLimit,
          check: checkAppLimit,
          expectedType: 'apps',
          expectedMessage: 'app limit',
        },
        {
          enforce: enforceBuildLimit,
          check: checkBuildLimit,
          expectedType: 'builds',
          expectedMessage: 'monthly build limit',
        },
        {
          enforce: enforceExportLimit,
          check: checkExportLimit,
          expectedType: 'exports',
          expectedMessage: 'monthly export limit',
        },
      ];

      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getUserUsageStats as jest.Mock).mockResolvedValue({
        apps: { current: 3, limit: 3, percentage: 100 },
        builds: { current: 10, limit: 10, percentage: 100 },
        exports: { current: 5, limit: 5, percentage: 100 },
      });

      for (const test of limitTests) {
        (test.check as jest.Mock).mockResolvedValue(false);

        try {
          await test.enforce();
          fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(UsageLimitError);
          expect((error as UsageLimitError).limitType).toBe(test.expectedType);
          expect((error as UsageLimitError).message).toContain(test.expectedMessage);
          expect((error as UsageLimitError).upgradeUrl).toBe('/pricing');
        }
      }
    });
  });
});
