/**
 * @jest-environment node
 */

// Mock modules BEFORE imports
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/stripe', () => ({
  stripe: {
    customers: {
      create: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
  },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logError: jest.fn(),
  logUserAction: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { logError, logUserAction } from '@/lib/logger';

describe('POST /api/checkout', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'user@test.com',
      name: 'Test User',
    },
  };

  const mockUser = {
    id: 'user-123',
    email: 'user@test.com',
    name: 'Test User',
    stripeCustomerId: null,
  };

  const mockStripeCustomer = {
    id: 'cus_123',
    email: 'user@test.com',
  };

  const mockCheckoutSession = {
    id: 'cs_123',
    url: 'https://checkout.stripe.com/session/cs_123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_123',
          planTier: 'PRO',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
    });

    it('should return 401 when session has no user', async () => {
      (auth as jest.Mock).mockResolvedValue({ user: null });

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_123',
          planTier: 'PRO',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Request Validation', () => {
    it('should return 400 for missing priceId', async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          planTier: 'PRO',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
    });

    it('should return 400 for missing planTier', async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
    });

    it('should return 400 for invalid planTier', async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_123',
          planTier: 'INVALID',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
    });

    it('should accept valid planTiers: PRO, TEAM, ENTERPRISE', async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        stripeCustomerId: 'cus_existing',
      });
      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockCheckoutSession);

      const validTiers = ['PRO', 'TEAM', 'ENTERPRISE'];

      for (const tier of validTiers) {
        const request = new NextRequest('http://localhost:3000/api/checkout', {
          method: 'POST',
          body: JSON.stringify({
            priceId: 'price_123',
            planTier: tier,
          }),
        });

        const response = await POST(request);
        expect(response.status).toBe(200);
      }
    });
  });

  describe('User Lookup', () => {
    it('should return 404 when user not found', async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_123',
          planTier: 'PRO',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });
  });

  describe('Stripe Customer Creation', () => {
    it('should create new Stripe customer when user has no customerId', async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (stripe.customers.create as jest.Mock).mockResolvedValue(mockStripeCustomer);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        stripeCustomerId: 'cus_123',
      });
      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockCheckoutSession);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_123',
          planTier: 'PRO',
        }),
      });

      const response = await POST(request);

      expect(stripe.customers.create).toHaveBeenCalledWith({
        email: 'user@test.com',
        name: 'Test User',
        metadata: {
          userId: 'user-123',
        },
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { stripeCustomerId: 'cus_123' },
      });

      expect(response.status).toBe(200);
    });

    it('should use existing Stripe customer when available', async () => {
      const userWithCustomer = {
        ...mockUser,
        stripeCustomerId: 'cus_existing',
      };

      (auth as jest.Mock).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithCustomer);
      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockCheckoutSession);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_123',
          planTier: 'PRO',
        }),
      });

      const response = await POST(request);

      expect(stripe.customers.create).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should handle user without name', async () => {
      const userNoName = {
        ...mockUser,
        name: null,
      };

      (auth as jest.Mock).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userNoName);
      (stripe.customers.create as jest.Mock).mockResolvedValue(mockStripeCustomer);
      (prisma.user.update as jest.Mock).mockResolvedValue(userNoName);
      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockCheckoutSession);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_123',
          planTier: 'PRO',
        }),
      });

      await POST(request);

      expect(stripe.customers.create).toHaveBeenCalledWith({
        email: 'user@test.com',
        name: undefined,
        metadata: {
          userId: 'user-123',
        },
      });
    });
  });

  describe('Checkout Session Creation', () => {
    it('should create checkout session with correct parameters', async () => {
      const userWithCustomer = {
        ...mockUser,
        stripeCustomerId: 'cus_existing',
      };

      (auth as jest.Mock).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithCustomer);
      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockCheckoutSession);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_pro_monthly',
          planTier: 'PRO',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_existing',
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: 'price_pro_monthly',
            quantity: 1,
          },
        ],
        success_url: 'http://localhost:3000/dashboard?checkout=success',
        cancel_url: 'http://localhost:3000/pricing?checkout=canceled',
        metadata: {
          userId: 'user-123',
          planTier: 'PRO',
        },
        subscription_data: {
          metadata: {
            userId: 'user-123',
            planTier: 'PRO',
          },
          trial_period_days: 14,
        },
        allow_promotion_codes: true,
      });

      expect(response.status).toBe(200);
      expect(data.sessionId).toBe('cs_123');
      expect(data.url).toBe('https://checkout.stripe.com/session/cs_123');
    });

    it('should include 14-day trial period', async () => {
      const userWithCustomer = {
        ...mockUser,
        stripeCustomerId: 'cus_existing',
      };

      (auth as jest.Mock).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithCustomer);
      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockCheckoutSession);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_123',
          planTier: 'PRO',
        }),
      });

      await POST(request);

      const call = (stripe.checkout.sessions.create as jest.Mock).mock.calls[0][0];
      expect(call.subscription_data.trial_period_days).toBe(14);
    });

    it('should allow promotion codes', async () => {
      const userWithCustomer = {
        ...mockUser,
        stripeCustomerId: 'cus_existing',
      };

      (auth as jest.Mock).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithCustomer);
      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockCheckoutSession);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_123',
          planTier: 'PRO',
        }),
      });

      await POST(request);

      const call = (stripe.checkout.sessions.create as jest.Mock).mock.calls[0][0];
      expect(call.allow_promotion_codes).toBe(true);
    });
  });

  describe('Logging', () => {
    it('should log checkout started event', async () => {
      const userWithCustomer = {
        ...mockUser,
        stripeCustomerId: 'cus_existing',
      };

      (auth as jest.Mock).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithCustomer);
      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockCheckoutSession);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_123',
          planTier: 'TEAM',
        }),
      });

      await POST(request);

      expect(logUserAction).toHaveBeenCalledWith('checkout_started', 'user-123', {
        planTier: 'TEAM',
        priceId: 'price_123',
        sessionId: 'cs_123',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle Stripe customer creation errors', async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (stripe.customers.create as jest.Mock).mockRejectedValue(
        new Error('Stripe API error')
      );

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_123',
          planTier: 'PRO',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(logError).toHaveBeenCalled();
    });

    it('should handle checkout session creation errors', async () => {
      const userWithCustomer = {
        ...mockUser,
        stripeCustomerId: 'cus_existing',
      };

      (auth as jest.Mock).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithCustomer);
      (stripe.checkout.sessions.create as jest.Mock).mockRejectedValue(
        new Error('Checkout error')
      );

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_123',
          planTier: 'PRO',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(logError).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_123',
          planTier: 'PRO',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(logError).toHaveBeenCalled();
    });

    it('should handle malformed JSON', async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Security', () => {
    it('should only allow authenticated users to create checkout', async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_123',
          planTier: 'PRO',
        }),
      });

      await POST(request);

      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
    });

    it('should use session user ID for database lookup', async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_123',
          planTier: 'PRO',
        }),
      });

      await POST(request);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should include userId in Stripe metadata', async () => {
      const userWithCustomer = {
        ...mockUser,
        stripeCustomerId: 'cus_existing',
      };

      (auth as jest.Mock).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithCustomer);
      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockCheckoutSession);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_123',
          planTier: 'PRO',
        }),
      });

      await POST(request);

      const call = (stripe.checkout.sessions.create as jest.Mock).mock.calls[0][0];
      expect(call.metadata.userId).toBe('user-123');
      expect(call.subscription_data.metadata.userId).toBe('user-123');
    });
  });

  describe('Different Plan Tiers', () => {
    it('should handle PRO plan checkout', async () => {
      const userWithCustomer = {
        ...mockUser,
        stripeCustomerId: 'cus_existing',
      };

      (auth as jest.Mock).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithCustomer);
      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockCheckoutSession);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_pro',
          planTier: 'PRO',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const call = (stripe.checkout.sessions.create as jest.Mock).mock.calls[0][0];
      expect(call.metadata.planTier).toBe('PRO');
    });

    it('should handle TEAM plan checkout', async () => {
      const userWithCustomer = {
        ...mockUser,
        stripeCustomerId: 'cus_existing',
      };

      (auth as jest.Mock).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithCustomer);
      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockCheckoutSession);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_team',
          planTier: 'TEAM',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const call = (stripe.checkout.sessions.create as jest.Mock).mock.calls[0][0];
      expect(call.metadata.planTier).toBe('TEAM');
    });

    it('should handle ENTERPRISE plan checkout', async () => {
      const userWithCustomer = {
        ...mockUser,
        stripeCustomerId: 'cus_existing',
      };

      (auth as jest.Mock).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithCustomer);
      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockCheckoutSession);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_enterprise',
          planTier: 'ENTERPRISE',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const call = (stripe.checkout.sessions.create as jest.Mock).mock.calls[0][0];
      expect(call.metadata.planTier).toBe('ENTERPRISE');
    });
  });
});
