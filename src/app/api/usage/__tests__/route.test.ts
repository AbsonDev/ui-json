/**
 * Tests for GET /api/usage
 * @jest-environment node
 */

import { GET } from '../route';

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('../../auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    usageMetric: {
      findMany: jest.fn(),
    },
  },
}));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('GET /api/usage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when no session', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when session has no user', async () => {
      mockGetServerSession.mockResolvedValue({} as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when session user has no email', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {},
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should not query database when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      await GET();

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.usageMetric.findMany).not.toHaveBeenCalled();
    });
  });

  describe('User Validation', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);
    });

    it('should return 404 when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('should return 404 when user has no planConfig', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        apps: [],
        planConfig: null,
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('should query user with correct email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await GET();

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: {
          apps: true,
          planConfig: true,
        },
      });
    });
  });

  describe('Usage Metrics Calculation', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);
    });

    it('should return usage for FREE plan user with no usage', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        apps: [],
        planConfig: {
          maxApps: 3,
          maxExports: 10,
          maxBuilds: 5,
        },
      } as any);

      mockPrisma.usageMetric.findMany.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        apps: { current: 0, limit: 3 },
        exports: { current: 0, limit: 10 },
        builds: { current: 0, limit: 5 },
      });
    });

    it('should count apps correctly', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        apps: [
          { id: 'app-1', name: 'App 1' },
          { id: 'app-2', name: 'App 2' },
        ],
        planConfig: {
          maxApps: 10,
          maxExports: 50,
          maxBuilds: 25,
        },
      } as any);

      mockPrisma.usageMetric.findMany.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(data.apps.current).toBe(2);
      expect(data.apps.limit).toBe(10);
    });

    it('should count exports correctly', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        apps: [],
        planConfig: {
          maxApps: 10,
          maxExports: 50,
          maxBuilds: 25,
        },
      } as any);

      mockPrisma.usageMetric.findMany.mockResolvedValue([
        { id: '1', metricType: 'EXPORT', userId: 'user-123' },
        { id: '2', metricType: 'EXPORT', userId: 'user-123' },
        { id: '3', metricType: 'EXPORT', userId: 'user-123' },
      ] as any);

      const response = await GET();
      const data = await response.json();

      expect(data.exports.current).toBe(3);
      expect(data.exports.limit).toBe(50);
    });

    it('should count builds correctly', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        apps: [],
        planConfig: {
          maxApps: 10,
          maxExports: 50,
          maxBuilds: 25,
        },
      } as any);

      mockPrisma.usageMetric.findMany.mockResolvedValue([
        { id: '1', metricType: 'BUILD', userId: 'user-123' },
        { id: '2', metricType: 'BUILD', userId: 'user-123' },
      ] as any);

      const response = await GET();
      const data = await response.json();

      expect(data.builds.current).toBe(2);
      expect(data.builds.limit).toBe(25);
    });

    it('should count mixed metric types correctly', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        apps: [{ id: 'app-1' }],
        planConfig: {
          maxApps: 10,
          maxExports: 50,
          maxBuilds: 25,
        },
      } as any);

      mockPrisma.usageMetric.findMany.mockResolvedValue([
        { id: '1', metricType: 'EXPORT', userId: 'user-123' },
        { id: '2', metricType: 'BUILD', userId: 'user-123' },
        { id: '3', metricType: 'EXPORT', userId: 'user-123' },
        { id: '4', metricType: 'BUILD', userId: 'user-123' },
        { id: '5', metricType: 'EXPORT', userId: 'user-123' },
      ] as any);

      const response = await GET();
      const data = await response.json();

      expect(data.apps.current).toBe(1);
      expect(data.exports.current).toBe(3);
      expect(data.builds.current).toBe(2);
    });

    it('should ignore other metric types', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        apps: [],
        planConfig: {
          maxApps: 10,
          maxExports: 50,
          maxBuilds: 25,
        },
      } as any);

      mockPrisma.usageMetric.findMany.mockResolvedValue([
        { id: '1', metricType: 'EXPORT', userId: 'user-123' },
        { id: '2', metricType: 'OTHER_TYPE', userId: 'user-123' },
        { id: '3', metricType: 'BUILD', userId: 'user-123' },
      ] as any);

      const response = await GET();
      const data = await response.json();

      expect(data.exports.current).toBe(1);
      expect(data.builds.current).toBe(1);
    });
  });

  describe('Monthly Usage Query', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        apps: [],
        planConfig: {
          maxApps: 10,
          maxExports: 50,
          maxBuilds: 25,
        },
      } as any);

      mockPrisma.usageMetric.findMany.mockResolvedValue([]);
    });

    it('should query usage metrics for current month', async () => {
      await GET();

      expect(mockPrisma.usageMetric.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it('should query by user ID', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'different-user-id',
        apps: [],
        planConfig: { maxApps: 10, maxExports: 50, maxBuilds: 25 },
      } as any);

      await GET();

      expect(mockPrisma.usageMetric.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'different-user-id',
          }),
        })
      );
    });
  });

  describe('Different Plan Tiers', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      mockPrisma.usageMetric.findMany.mockResolvedValue([]);
    });

    it('should return FREE plan limits', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        apps: [],
        planConfig: {
          maxApps: 3,
          maxExports: 10,
          maxBuilds: 5,
        },
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(data.apps.limit).toBe(3);
      expect(data.exports.limit).toBe(10);
      expect(data.builds.limit).toBe(5);
    });

    it('should return PRO plan limits', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        apps: [],
        planConfig: {
          maxApps: 10,
          maxExports: 50,
          maxBuilds: 25,
        },
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(data.apps.limit).toBe(10);
      expect(data.exports.limit).toBe(50);
      expect(data.builds.limit).toBe(25);
    });

    it('should return ENTERPRISE plan limits (unlimited = -1)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        apps: [],
        planConfig: {
          maxApps: -1,
          maxExports: -1,
          maxBuilds: -1,
        },
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(data.apps.limit).toBe(-1);
      expect(data.exports.limit).toBe(-1);
      expect(data.builds.limit).toBe(-1);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);
    });

    it('should return 500 when user query fails', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(
        new Error('Database error')
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch usage');
    });

    it('should return 500 when usage metrics query fails', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        apps: [],
        planConfig: {
          maxApps: 10,
          maxExports: 50,
          maxBuilds: 25,
        },
      } as any);

      mockPrisma.usageMetric.findMany.mockRejectedValue(
        new Error('Query failed')
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch usage');
    });

    it('should handle database connection errors', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(
        new Error('Connection timeout')
      );

      const response = await GET();

      expect(response.status).toBe(500);
    });

    it('should handle unexpected errors', async () => {
      mockPrisma.user.findUnique.mockRejectedValue('Unexpected error');

      const response = await GET();

      expect(response.status).toBe(500);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);
    });

    it('should handle user at exact limit', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        apps: [{ id: '1' }, { id: '2' }, { id: '3' }],
        planConfig: {
          maxApps: 3,
          maxExports: 10,
          maxBuilds: 5,
        },
      } as any);

      mockPrisma.usageMetric.findMany.mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => ({
          id: `${i}`,
          metricType: 'EXPORT',
        })) as any
      );

      const response = await GET();
      const data = await response.json();

      expect(data.apps.current).toBe(3);
      expect(data.apps.limit).toBe(3);
      expect(data.exports.current).toBe(10);
      expect(data.exports.limit).toBe(10);
    });

    it('should handle user over limit', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        apps: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
        planConfig: {
          maxApps: 3,
          maxExports: 10,
          maxBuilds: 5,
        },
      } as any);

      mockPrisma.usageMetric.findMany.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(data.apps.current).toBe(4);
      expect(data.apps.limit).toBe(3);
    });

    it('should handle empty apps array', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        apps: [],
        planConfig: {
          maxApps: 10,
          maxExports: 50,
          maxBuilds: 25,
        },
      } as any);

      mockPrisma.usageMetric.findMany.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(data.apps.current).toBe(0);
    });

    it('should handle empty usage metrics', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        apps: [],
        planConfig: {
          maxApps: 10,
          maxExports: 50,
          maxBuilds: 25,
        },
      } as any);

      mockPrisma.usageMetric.findMany.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(data.exports.current).toBe(0);
      expect(data.builds.current).toBe(0);
    });

    it('should handle very high usage numbers', async () => {
      const manyExports = Array.from({ length: 999 }, (_, i) => ({
        id: `export-${i}`,
        metricType: 'EXPORT',
      }));

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        apps: [],
        planConfig: {
          maxApps: 10,
          maxExports: 1000,
          maxBuilds: 25,
        },
      } as any);

      mockPrisma.usageMetric.findMany.mockResolvedValue(manyExports as any);

      const response = await GET();
      const data = await response.json();

      expect(data.exports.current).toBe(999);
    });

    it('should handle different email formats', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'user+test@subdomain.example.co.uk' },
      } as any);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        apps: [],
        planConfig: { maxApps: 10, maxExports: 50, maxBuilds: 25 },
      } as any);

      mockPrisma.usageMetric.findMany.mockResolvedValue([]);

      await GET();

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'user+test@subdomain.example.co.uk' },
        })
      );
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete flow for active PRO user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'pro@example.com' },
      } as any);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-pro',
        email: 'pro@example.com',
        apps: [
          { id: 'app-1', name: 'My App 1' },
          { id: 'app-2', name: 'My App 2' },
        ],
        planConfig: {
          maxApps: 10,
          maxExports: 50,
          maxBuilds: 25,
        },
      } as any);

      mockPrisma.usageMetric.findMany.mockResolvedValue([
        { id: '1', metricType: 'EXPORT' },
        { id: '2', metricType: 'EXPORT' },
        { id: '3', metricType: 'BUILD' },
      ] as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        apps: { current: 2, limit: 10 },
        exports: { current: 2, limit: 50 },
        builds: { current: 1, limit: 25 },
      });

      expect(mockGetServerSession).toHaveBeenCalled();
      expect(mockPrisma.user.findUnique).toHaveBeenCalled();
      expect(mockPrisma.usageMetric.findMany).toHaveBeenCalled();
    });

    it('should handle complete flow for new FREE user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'newuser@example.com' },
      } as any);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-new',
        email: 'newuser@example.com',
        apps: [],
        planConfig: {
          maxApps: 3,
          maxExports: 10,
          maxBuilds: 5,
        },
      } as any);

      mockPrisma.usageMetric.findMany.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        apps: { current: 0, limit: 3 },
        exports: { current: 0, limit: 10 },
        builds: { current: 0, limit: 5 },
      });
    });
  });
});
