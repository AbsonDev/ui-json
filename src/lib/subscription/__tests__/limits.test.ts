/**
 * @jest-environment node
 */

// Mock @prisma/client BEFORE any imports
jest.mock('@prisma/client', () => ({
  PlanTier: {
    FREE: 'FREE',
    PRO: 'PRO',
    TEAM: 'TEAM',
  },
}));

// Mock Prisma BEFORE any imports
jest.mock('@/lib/prisma', () => ({
  prisma: {
    planConfig: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    build: {
      count: jest.fn(),
    },
    app: {
      count: jest.fn(),
    },
    usageMetric: {
      findFirst: jest.fn(),
    },
  },
}));

import { PlanTier } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  getPlanLimits,
  checkAppLimit,
  checkBuildLimit,
  checkExportLimit,
  checkFeatureAccess,
  getUserUsageStats,
} from '../limits';

describe('Subscription Limits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlanLimits', () => {
    it('should return limits for FREE tier', async () => {
      const mockConfig = {
        planTier: PlanTier.FREE,
        maxApps: 3,
        maxBuilds: 10,
        maxExports: 5,
        maxTemplates: 2,
        maxApiCalls: 100,
        maxStorageMB: 50,
        customDomain: false,
        prioritySupport: false,
        removeWatermark: false,
        teamCollaboration: false,
        analytics: false,
        versionHistory: false,
        aiAssistant: false,
      };

      (prisma.planConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig);

      const limits = await getPlanLimits(PlanTier.FREE);

      expect(limits.maxApps).toBe(3);
      expect(limits.features.customDomain).toBe(false);
      expect(limits.features.aiAssistant).toBe(false);
      expect(prisma.planConfig.findUnique).toHaveBeenCalledWith({
        where: { planTier: PlanTier.FREE },
      });
    });

    it('should return limits for PRO tier', async () => {
      const mockConfig = {
        planTier: PlanTier.PRO,
        maxApps: -1, // unlimited
        maxBuilds: 100,
        maxExports: -1,
        maxTemplates: 50,
        maxApiCalls: 10000,
        maxStorageMB: 5000,
        customDomain: true,
        prioritySupport: true,
        removeWatermark: true,
        teamCollaboration: false,
        analytics: true,
        versionHistory: true,
        aiAssistant: true,
      };

      (prisma.planConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig);

      const limits = await getPlanLimits(PlanTier.PRO);

      expect(limits.maxApps).toBe(-1);
      expect(limits.features.customDomain).toBe(true);
      expect(limits.features.aiAssistant).toBe(true);
    });

    it('should throw error when plan config not found', async () => {
      (prisma.planConfig.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(getPlanLimits(PlanTier.FREE)).rejects.toThrow(
        'Plan config not found for tier: FREE'
      );
    });
  });

  describe('checkAppLimit', () => {
    it('should return true when user is under limit', async () => {
      const mockUser = {
        id: 'user-123',
        planTier: PlanTier.FREE,
        apps: [{ id: '1' }, { id: '2' }], // 2 apps
      };

      const mockConfig = {
        planTier: PlanTier.FREE,
        maxApps: 3,
        maxBuilds: 10,
        maxExports: 5,
        maxTemplates: 2,
        maxApiCalls: 100,
        maxStorageMB: 50,
        customDomain: false,
        prioritySupport: false,
        removeWatermark: false,
        teamCollaboration: false,
        analytics: false,
        versionHistory: false,
        aiAssistant: false,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.planConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig);

      const result = await checkAppLimit('user-123');

      expect(result).toBe(true);
    });

    it('should return false when user is at limit', async () => {
      const mockUser = {
        id: 'user-123',
        planTier: PlanTier.FREE,
        apps: [{ id: '1' }, { id: '2' }, { id: '3' }], // 3 apps
      };

      const mockConfig = {
        planTier: PlanTier.FREE,
        maxApps: 3,
        maxBuilds: 10,
        maxExports: 5,
        maxTemplates: 2,
        maxApiCalls: 100,
        maxStorageMB: 50,
        customDomain: false,
        prioritySupport: false,
        removeWatermark: false,
        teamCollaboration: false,
        analytics: false,
        versionHistory: false,
        aiAssistant: false,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.planConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig);

      const result = await checkAppLimit('user-123');

      expect(result).toBe(false);
    });

    it('should return true for unlimited plan (-1)', async () => {
      const mockUser = {
        id: 'user-pro',
        planTier: PlanTier.PRO,
        apps: Array.from({ length: 100 }, (_, i) => ({ id: `${i}` })),
      };

      const mockConfig = {
        planTier: PlanTier.PRO,
        maxApps: -1, // unlimited
        maxBuilds: 100,
        maxExports: -1,
        maxTemplates: 50,
        maxApiCalls: 10000,
        maxStorageMB: 5000,
        customDomain: true,
        prioritySupport: true,
        removeWatermark: true,
        teamCollaboration: false,
        analytics: true,
        versionHistory: true,
        aiAssistant: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.planConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig);

      const result = await checkAppLimit('user-pro');

      expect(result).toBe(true);
    });

    it('should return false when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await checkAppLimit('invalid-user');

      expect(result).toBe(false);
    });
  });

  describe('checkBuildLimit', () => {
    it('should return true when under monthly build limit', async () => {
      const mockUser = {
        id: 'user-123',
        planTier: PlanTier.FREE,
      };

      const mockConfig = {
        planTier: PlanTier.FREE,
        maxApps: 3,
        maxBuilds: 10,
        maxExports: 5,
        maxTemplates: 2,
        maxApiCalls: 100,
        maxStorageMB: 50,
        customDomain: false,
        prioritySupport: false,
        removeWatermark: false,
        teamCollaboration: false,
        analytics: false,
        versionHistory: false,
        aiAssistant: false,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.planConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig);
      (prisma.build.count as jest.Mock).mockResolvedValue(5); // 5 builds this month

      const result = await checkBuildLimit('user-123');

      expect(result).toBe(true);
      expect(prisma.build.count).toHaveBeenCalledWith({
        where: {
          app: { userId: 'user-123' },
          createdAt: { gte: expect.any(Date) },
        },
      });
    });

    it('should return false when at monthly build limit', async () => {
      const mockUser = {
        id: 'user-123',
        planTier: PlanTier.FREE,
      };

      const mockConfig = {
        planTier: PlanTier.FREE,
        maxApps: 3,
        maxBuilds: 10,
        maxExports: 5,
        maxTemplates: 2,
        maxApiCalls: 100,
        maxStorageMB: 50,
        customDomain: false,
        prioritySupport: false,
        removeWatermark: false,
        teamCollaboration: false,
        analytics: false,
        versionHistory: false,
        aiAssistant: false,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.planConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig);
      (prisma.build.count as jest.Mock).mockResolvedValue(10); // at limit

      const result = await checkBuildLimit('user-123');

      expect(result).toBe(false);
    });

    it('should return true for unlimited builds', async () => {
      const mockUser = {
        id: 'user-pro',
        planTier: PlanTier.PRO,
      };

      const mockConfig = {
        planTier: PlanTier.PRO,
        maxApps: -1,
        maxBuilds: -1, // unlimited
        maxExports: -1,
        maxTemplates: 50,
        maxApiCalls: 10000,
        maxStorageMB: 5000,
        customDomain: true,
        prioritySupport: true,
        removeWatermark: true,
        teamCollaboration: false,
        analytics: true,
        versionHistory: true,
        aiAssistant: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.planConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig);

      const result = await checkBuildLimit('user-pro');

      expect(result).toBe(true);
      expect(prisma.build.count).not.toHaveBeenCalled();
    });
  });

  describe('checkExportLimit', () => {
    it('should return true when under monthly export limit', async () => {
      const mockUser = {
        id: 'user-123',
        planTier: PlanTier.FREE,
      };

      const mockConfig = {
        planTier: PlanTier.FREE,
        maxApps: 3,
        maxBuilds: 10,
        maxExports: 5,
        maxTemplates: 2,
        maxApiCalls: 100,
        maxStorageMB: 50,
        customDomain: false,
        prioritySupport: false,
        removeWatermark: false,
        teamCollaboration: false,
        analytics: false,
        versionHistory: false,
        aiAssistant: false,
      };

      const mockUsageMetric = {
        exportsCount: 3,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.planConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig);
      (prisma.usageMetric.findFirst as jest.Mock).mockResolvedValue(mockUsageMetric);

      const result = await checkExportLimit('user-123');

      expect(result).toBe(true);
    });

    it('should return true when no usage metric exists (0 exports)', async () => {
      const mockUser = {
        id: 'user-123',
        planTier: PlanTier.FREE,
      };

      const mockConfig = {
        planTier: PlanTier.FREE,
        maxApps: 3,
        maxBuilds: 10,
        maxExports: 5,
        maxTemplates: 2,
        maxApiCalls: 100,
        maxStorageMB: 50,
        customDomain: false,
        prioritySupport: false,
        removeWatermark: false,
        teamCollaboration: false,
        analytics: false,
        versionHistory: false,
        aiAssistant: false,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.planConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig);
      (prisma.usageMetric.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await checkExportLimit('user-123');

      expect(result).toBe(true);
    });
  });

  describe('checkFeatureAccess', () => {
    it('should return true when user has feature access', async () => {
      const mockUser = {
        id: 'user-pro',
        planTier: PlanTier.PRO,
      };

      const mockConfig = {
        planTier: PlanTier.PRO,
        maxApps: -1,
        maxBuilds: 100,
        maxExports: -1,
        maxTemplates: 50,
        maxApiCalls: 10000,
        maxStorageMB: 5000,
        customDomain: true,
        prioritySupport: true,
        removeWatermark: true,
        teamCollaboration: false,
        analytics: true,
        versionHistory: true,
        aiAssistant: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.planConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig);

      const result = await checkFeatureAccess('user-pro', 'aiAssistant');

      expect(result).toBe(true);
    });

    it('should return false when user does not have feature access', async () => {
      const mockUser = {
        id: 'user-free',
        planTier: PlanTier.FREE,
      };

      const mockConfig = {
        planTier: PlanTier.FREE,
        maxApps: 3,
        maxBuilds: 10,
        maxExports: 5,
        maxTemplates: 2,
        maxApiCalls: 100,
        maxStorageMB: 50,
        customDomain: false,
        prioritySupport: false,
        removeWatermark: false,
        teamCollaboration: false,
        analytics: false,
        versionHistory: false,
        aiAssistant: false,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.planConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig);

      const result = await checkFeatureAccess('user-free', 'aiAssistant');

      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await checkFeatureAccess('invalid-user', 'aiAssistant');

      expect(result).toBe(false);
    });
  });

  describe('getUserUsageStats', () => {
    it('should return comprehensive usage statistics', async () => {
      const mockUser = {
        id: 'user-123',
        planTier: PlanTier.FREE,
        apps: [{ id: '1' }, { id: '2' }],
      };

      const mockConfig = {
        planTier: PlanTier.FREE,
        maxApps: 3,
        maxBuilds: 10,
        maxExports: 5,
        maxTemplates: 2,
        maxApiCalls: 100,
        maxStorageMB: 50,
        customDomain: false,
        prioritySupport: false,
        removeWatermark: false,
        teamCollaboration: false,
        analytics: false,
        versionHistory: false,
        aiAssistant: false,
      };

      const mockUsageMetric = {
        exportsCount: 3,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.planConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig);
      (prisma.build.count as jest.Mock).mockResolvedValue(5);
      (prisma.usageMetric.findFirst as jest.Mock).mockResolvedValue(mockUsageMetric);

      const stats = await getUserUsageStats('user-123');

      expect(stats.apps.current).toBe(2);
      expect(stats.apps.limit).toBe(3);
      expect(stats.apps.percentage).toBeCloseTo(66.67, 1);

      expect(stats.builds.current).toBe(5);
      expect(stats.builds.limit).toBe(10);
      expect(stats.builds.percentage).toBe(50);

      expect(stats.exports.current).toBe(3);
      expect(stats.exports.limit).toBe(5);
      expect(stats.exports.percentage).toBe(60);
    });

    it('should handle unlimited limits correctly (percentage = 0)', async () => {
      const mockUser = {
        id: 'user-pro',
        planTier: PlanTier.PRO,
        apps: Array.from({ length: 50 }, (_, i) => ({ id: `${i}` })),
      };

      const mockConfig = {
        planTier: PlanTier.PRO,
        maxApps: -1, // unlimited
        maxBuilds: -1,
        maxExports: -1,
        maxTemplates: 50,
        maxApiCalls: 10000,
        maxStorageMB: 5000,
        customDomain: true,
        prioritySupport: true,
        removeWatermark: true,
        teamCollaboration: false,
        analytics: true,
        versionHistory: true,
        aiAssistant: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.planConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig);
      (prisma.build.count as jest.Mock).mockResolvedValue(100);
      (prisma.usageMetric.findFirst as jest.Mock).mockResolvedValue({ exportsCount: 200 });

      const stats = await getUserUsageStats('user-pro');

      expect(stats.apps.percentage).toBe(0); // unlimited
      expect(stats.builds.percentage).toBe(0); // unlimited
      expect(stats.exports.percentage).toBe(0); // unlimited
    });

    it('should throw error when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(getUserUsageStats('invalid-user')).rejects.toThrow('User not found');
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with no apps', async () => {
      const mockUser = {
        id: 'user-new',
        planTier: PlanTier.FREE,
        apps: [],
      };

      const mockConfig = {
        planTier: PlanTier.FREE,
        maxApps: 3,
        maxBuilds: 10,
        maxExports: 5,
        maxTemplates: 2,
        maxApiCalls: 100,
        maxStorageMB: 50,
        customDomain: false,
        prioritySupport: false,
        removeWatermark: false,
        teamCollaboration: false,
        analytics: false,
        versionHistory: false,
        aiAssistant: false,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.planConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig);

      const result = await checkAppLimit('user-new');

      expect(result).toBe(true);
    });

    it('should correctly calculate month boundaries', async () => {
      const mockUser = {
        id: 'user-123',
        planTier: PlanTier.FREE,
      };

      const mockConfig = {
        planTier: PlanTier.FREE,
        maxApps: 3,
        maxBuilds: 10,
        maxExports: 5,
        maxTemplates: 2,
        maxApiCalls: 100,
        maxStorageMB: 50,
        customDomain: false,
        prioritySupport: false,
        removeWatermark: false,
        teamCollaboration: false,
        analytics: false,
        versionHistory: false,
        aiAssistant: false,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.planConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig);
      (prisma.build.count as jest.Mock).mockResolvedValue(1);

      await checkBuildLimit('user-123');

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      expect(prisma.build.count).toHaveBeenCalledWith({
        where: {
          app: { userId: 'user-123' },
          createdAt: { gte: firstDayOfMonth },
        },
      });
    });
  });
});
