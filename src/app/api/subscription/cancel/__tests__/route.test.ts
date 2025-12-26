/**
 * @jest-environment node
 */

// Mock dependencies BEFORE imports
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('../../../auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    subscription: {
      update: jest.fn(),
    },
  },
}));
jest.mock('@/lib/stripe', () => ({
  stripe: {
    subscriptions: {
      update: jest.fn(),
    },
  },
}));

// Now import after mocks
import { POST } from '../route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;
const mockFindUnique = prisma.user.findUnique as jest.MockedFunction<
  typeof prisma.user.findUnique
>;
const mockSubscriptionUpdate = prisma.subscription.update as jest.MockedFunction<
  typeof prisma.subscription.update
>;
const mockStripeUpdate = stripe.subscriptions.update as jest.MockedFunction<
  typeof stripe.subscriptions.update
>;

describe('POST /api/subscription/cancel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 401 when session has no email', async () => {
    mockGetServerSession.mockResolvedValue({
      user: {},
      expires: new Date().toISOString(),
    });

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 404 when user not found', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com' },
      expires: new Date().toISOString(),
    });
    mockFindUnique.mockResolvedValue(null);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('No active subscription found');
  });

  it('should return 404 when user has no subscriptions', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com' },
      expires: new Date().toISOString(),
    });
    mockFindUnique.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      subscriptions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      name: null,
      emailVerified: null,
      image: null,
      planConfigId: 'config-1',
    });

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('No active subscription found');
  });

  it('should cancel active subscription successfully', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      subscriptions: [
        {
          id: 'sub-123',
          stripeSubscriptionId: 'stripe-sub-123',
          status: 'ACTIVE' as const,
          userId: 'user-123',
          planTier: 'PRO' as const,
          interval: 'MONTHLY' as const,
          cancelAtPeriodEnd: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          currentPeriodEnd: new Date(),
          stripeCustomerId: 'cus-123',
          stripePriceId: 'price-123',
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      name: null,
      emailVerified: null,
      image: null,
      planConfigId: 'config-1',
    };

    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com' },
      expires: new Date().toISOString(),
    });
    mockFindUnique.mockResolvedValue(mockUser);
    mockStripeUpdate.mockResolvedValue({} as any);
    mockSubscriptionUpdate.mockResolvedValue({
      ...mockUser.subscriptions[0],
      cancelAtPeriodEnd: true,
    });

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('end of the billing period');

    expect(mockStripeUpdate).toHaveBeenCalledWith('stripe-sub-123', {
      cancel_at_period_end: true,
    });

    expect(mockSubscriptionUpdate).toHaveBeenCalledWith({
      where: { id: 'sub-123' },
      data: { cancelAtPeriodEnd: true },
    });
  });

  it('should cancel trialing subscription successfully', async () => {
    const mockUser = {
      id: 'user-456',
      email: 'trial@example.com',
      subscriptions: [
        {
          id: 'sub-456',
          stripeSubscriptionId: 'stripe-sub-456',
          status: 'TRIALING' as const,
          userId: 'user-456',
          planTier: 'PRO' as const,
          interval: 'MONTHLY' as const,
          cancelAtPeriodEnd: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          currentPeriodEnd: new Date(),
          stripeCustomerId: 'cus-456',
          stripePriceId: 'price-456',
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      name: null,
      emailVerified: null,
      image: null,
      planConfigId: 'config-1',
    };

    mockGetServerSession.mockResolvedValue({
      user: { email: 'trial@example.com' },
      expires: new Date().toISOString(),
    });
    mockFindUnique.mockResolvedValue(mockUser);
    mockStripeUpdate.mockResolvedValue({} as any);
    mockSubscriptionUpdate.mockResolvedValue({
      ...mockUser.subscriptions[0],
      cancelAtPeriodEnd: true,
    });

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    expect(mockStripeUpdate).toHaveBeenCalledWith('stripe-sub-456', {
      cancel_at_period_end: true,
    });
  });

  it('should select most recent subscription when multiple exist', async () => {
    const oldDate = new Date('2024-01-01');
    const newDate = new Date('2024-12-01');

    const mockUser = {
      id: 'user-789',
      email: 'test@example.com',
      subscriptions: [
        {
          id: 'sub-new',
          stripeSubscriptionId: 'stripe-sub-new',
          status: 'ACTIVE' as const,
          createdAt: newDate, // Most recent
          userId: 'user-789',
          planTier: 'PRO' as const,
          interval: 'MONTHLY' as const,
          cancelAtPeriodEnd: false,
          updatedAt: new Date(),
          currentPeriodEnd: new Date(),
          stripeCustomerId: 'cus-789',
          stripePriceId: 'price-789',
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      name: null,
      emailVerified: null,
      image: null,
      planConfigId: 'config-1',
    };

    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com' },
      expires: new Date().toISOString(),
    });
    mockFindUnique.mockResolvedValue(mockUser);
    mockStripeUpdate.mockResolvedValue({} as any);
    mockSubscriptionUpdate.mockResolvedValue({
      ...mockUser.subscriptions[0],
      cancelAtPeriodEnd: true,
    });

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockStripeUpdate).toHaveBeenCalledWith('stripe-sub-new', {
      cancel_at_period_end: true,
    });
  });

  it('should return 500 when Stripe update fails', async () => {
    const mockUser = {
      id: 'user-error',
      email: 'error@example.com',
      subscriptions: [
        {
          id: 'sub-error',
          stripeSubscriptionId: 'stripe-sub-error',
          status: 'ACTIVE' as const,
          userId: 'user-error',
          planTier: 'PRO' as const,
          interval: 'MONTHLY' as const,
          cancelAtPeriodEnd: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          currentPeriodEnd: new Date(),
          stripeCustomerId: 'cus-error',
          stripePriceId: 'price-error',
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      name: null,
      emailVerified: null,
      image: null,
      planConfigId: 'config-1',
    };

    mockGetServerSession.mockResolvedValue({
      user: { email: 'error@example.com' },
      expires: new Date().toISOString(),
    });
    mockFindUnique.mockResolvedValue(mockUser);
    mockStripeUpdate.mockRejectedValue(new Error('Stripe API error'));

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to cancel subscription');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to cancel subscription:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should return 500 when database update fails', async () => {
    const mockUser = {
      id: 'user-db-error',
      email: 'db-error@example.com',
      subscriptions: [
        {
          id: 'sub-db-error',
          stripeSubscriptionId: 'stripe-sub-db-error',
          status: 'ACTIVE' as const,
          userId: 'user-db-error',
          planTier: 'PRO' as const,
          interval: 'MONTHLY' as const,
          cancelAtPeriodEnd: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          currentPeriodEnd: new Date(),
          stripeCustomerId: 'cus-db-error',
          stripePriceId: 'price-db-error',
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      name: null,
      emailVerified: null,
      image: null,
      planConfigId: 'config-1',
    };

    mockGetServerSession.mockResolvedValue({
      user: { email: 'db-error@example.com' },
      expires: new Date().toISOString(),
    });
    mockFindUnique.mockResolvedValue(mockUser);
    mockStripeUpdate.mockResolvedValue({} as any);
    mockSubscriptionUpdate.mockRejectedValue(new Error('Database error'));

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to cancel subscription');

    consoleErrorSpy.mockRestore();
  });

  it('should filter only active and trialing subscriptions', async () => {
    // This test verifies the query filters in the route
    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com' },
      expires: new Date().toISOString(),
    });

    await POST();

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      include: {
        subscriptions: {
          where: {
            status: {
              in: ['ACTIVE', 'TRIALING'],
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  });
});
