/**
 * Tests for GET /api/subscription
 * @jest-environment node
 */

import { NextResponse } from 'next/server';
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
  },
}));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('GET /api/subscription', () => {
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
    });
  });

  describe('User Not Found', () => {
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

    it('should query user by email from session', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await GET();

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: {
          subscriptions: {
            where: {
              status: {
                in: ['ACTIVE', 'TRIALING', 'PAST_DUE'],
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
    });
  });

  describe('FREE Plan (No Subscription)', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'free@example.com' },
      } as any);
    });

    it('should return FREE plan when user has no subscriptions', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'free@example.com',
        subscriptions: [],
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        planTier: 'FREE',
        status: 'ACTIVE',
        interval: null,
        amount: 0,
        currency: 'usd',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        trialEnd: null,
      });
    });

    it('should return FREE plan when subscriptions is null', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'free@example.com',
        subscriptions: null,
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.planTier).toBe('FREE');
      expect(data.status).toBe('ACTIVE');
      expect(data.amount).toBe(0);
    });

    it('should return FREE plan when subscriptions array is empty', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'free@example.com',
        subscriptions: [],
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(data.planTier).toBe('FREE');
      expect(data.currentPeriodEnd).toBeNull();
      expect(data.trialEnd).toBeNull();
    });
  });

  describe('Active Subscription', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'pro@example.com' },
      } as any);
    });

    it('should return active subscription details', async () => {
      const mockSubscription = {
        id: 'sub_123',
        planTier: 'PRO',
        status: 'ACTIVE',
        interval: 'month',
        amount: 2900,
        currency: 'usd',
        currentPeriodEnd: new Date('2024-12-31'),
        cancelAtPeriodEnd: false,
        trialEnd: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'pro@example.com',
        subscriptions: [mockSubscription],
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        planTier: 'PRO',
        status: 'ACTIVE',
        interval: 'month',
        amount: 2900,
        currency: 'usd',
        currentPeriodEnd: mockSubscription.currentPeriodEnd.toISOString(),
        cancelAtPeriodEnd: false,
        trialEnd: null,
      });
    });

    it('should return yearly subscription', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        subscriptions: [
          {
            planTier: 'TEAM',
            status: 'ACTIVE',
            interval: 'year',
            amount: 29900,
            currency: 'usd',
            currentPeriodEnd: new Date('2025-12-31'),
            cancelAtPeriodEnd: false,
            trialEnd: null,
          },
        ],
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(data.planTier).toBe('TEAM');
      expect(data.interval).toBe('year');
      expect(data.amount).toBe(29900);
    });

    it('should return subscription in trialing status', async () => {
      const trialEnd = new Date('2024-12-15');

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        subscriptions: [
          {
            planTier: 'PRO',
            status: 'TRIALING',
            interval: 'month',
            amount: 2900,
            currency: 'usd',
            currentPeriodEnd: new Date('2024-12-31'),
            cancelAtPeriodEnd: false,
            trialEnd,
          },
        ],
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(data.status).toBe('TRIALING');
      expect(data.trialEnd).toBe(trialEnd.toISOString());
    });

    it('should return subscription in past_due status', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        subscriptions: [
          {
            planTier: 'PRO',
            status: 'PAST_DUE',
            interval: 'month',
            amount: 2900,
            currency: 'usd',
            currentPeriodEnd: new Date('2024-11-30'),
            cancelAtPeriodEnd: false,
            trialEnd: null,
          },
        ],
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(data.status).toBe('PAST_DUE');
    });

    it('should return subscription with cancelAtPeriodEnd true', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        subscriptions: [
          {
            planTier: 'PRO',
            status: 'ACTIVE',
            interval: 'month',
            amount: 2900,
            currency: 'usd',
            currentPeriodEnd: new Date('2024-12-31'),
            cancelAtPeriodEnd: true,
            trialEnd: null,
          },
        ],
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(data.cancelAtPeriodEnd).toBe(true);
    });

    it('should return enterprise subscription', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        subscriptions: [
          {
            planTier: 'ENTERPRISE',
            status: 'ACTIVE',
            interval: 'year',
            amount: 99900,
            currency: 'usd',
            currentPeriodEnd: new Date('2025-12-31'),
            cancelAtPeriodEnd: false,
            trialEnd: null,
          },
        ],
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(data.planTier).toBe('ENTERPRISE');
      expect(data.amount).toBe(99900);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);
    });

    it('should return 500 when database query fails', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(
        new Error('Database error')
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch subscription');
    });

    it('should handle database connection errors', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(
        new Error('Connection timeout')
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch subscription');
    });

    it('should handle unexpected errors', async () => {
      mockPrisma.user.findUnique.mockRejectedValue('Unexpected error');

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
    });
  });

  describe('Query Filtering', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);
    });

    it('should only query ACTIVE, TRIALING, and PAST_DUE subscriptions', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        subscriptions: [],
      } as any);

      await GET();

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            subscriptions: expect.objectContaining({
              where: {
                status: {
                  in: ['ACTIVE', 'TRIALING', 'PAST_DUE'],
                },
              },
            }),
          },
        })
      );
    });

    it('should order subscriptions by createdAt desc', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        subscriptions: [],
      } as any);

      await GET();

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            subscriptions: expect.objectContaining({
              orderBy: { createdAt: 'desc' },
            }),
          },
        })
      );
    });

    it('should take only 1 subscription', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        subscriptions: [],
      } as any);

      await GET();

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            subscriptions: expect.objectContaining({
              take: 1,
            }),
          },
        })
      );
    });

    it('should return first subscription when multiple exist', async () => {
      // This shouldn't happen due to take:1, but testing the logic
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        subscriptions: [
          {
            id: 'sub_new',
            planTier: 'PRO',
            status: 'ACTIVE',
            interval: 'month',
            amount: 2900,
            currency: 'usd',
            currentPeriodEnd: new Date('2024-12-31'),
            cancelAtPeriodEnd: false,
            trialEnd: null,
            createdAt: new Date('2024-12-01'),
          },
          {
            id: 'sub_old',
            planTier: 'FREE',
            status: 'ACTIVE',
            interval: null,
            amount: 0,
            currency: 'usd',
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            trialEnd: null,
            createdAt: new Date('2024-01-01'),
          },
        ],
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(data.planTier).toBe('PRO');
    });
  });

  describe('Edge Cases', () => {
    it('should handle different email formats', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'user+test@example.co.uk' },
      } as any);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        subscriptions: [],
      } as any);

      await GET();

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'user+test@example.co.uk' },
        })
      );
    });

    it('should handle different currencies', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        subscriptions: [
          {
            planTier: 'PRO',
            status: 'ACTIVE',
            interval: 'month',
            amount: 2500,
            currency: 'eur',
            currentPeriodEnd: new Date('2024-12-31'),
            cancelAtPeriodEnd: false,
            trialEnd: null,
          },
        ],
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(data.currency).toBe('eur');
    });

    it('should handle zero amount subscriptions', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        subscriptions: [
          {
            planTier: 'SPECIAL',
            status: 'ACTIVE',
            interval: 'month',
            amount: 0,
            currency: 'usd',
            currentPeriodEnd: new Date('2024-12-31'),
            cancelAtPeriodEnd: false,
            trialEnd: null,
          },
        ],
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(data.amount).toBe(0);
    });

    it('should handle very large amounts', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        subscriptions: [
          {
            planTier: 'ENTERPRISE',
            status: 'ACTIVE',
            interval: 'year',
            amount: 99999999,
            currency: 'usd',
            currentPeriodEnd: new Date('2024-12-31'),
            cancelAtPeriodEnd: false,
            trialEnd: null,
          },
        ],
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(data.amount).toBe(99999999);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete flow for PRO user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'pro@example.com' },
      } as any);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-pro',
        email: 'pro@example.com',
        subscriptions: [
          {
            id: 'sub_pro',
            planTier: 'PRO',
            status: 'ACTIVE',
            interval: 'month',
            amount: 2900,
            currency: 'usd',
            currentPeriodEnd: new Date('2024-12-31T23:59:59Z'),
            cancelAtPeriodEnd: false,
            trialEnd: null,
          },
        ],
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.planTier).toBe('PRO');
      expect(data.status).toBe('ACTIVE');
      expect(data.amount).toBe(2900);
      expect(mockGetServerSession).toHaveBeenCalled();
      expect(mockPrisma.user.findUnique).toHaveBeenCalled();
    });

    it('should handle complete flow for FREE user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'free@example.com' },
      } as any);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-free',
        email: 'free@example.com',
        subscriptions: [],
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.planTier).toBe('FREE');
      expect(data.amount).toBe(0);
      expect(data.interval).toBeNull();
    });
  });
});
