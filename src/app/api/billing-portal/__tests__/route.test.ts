/**
 * Tests for POST /api/billing-portal
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock dependencies before imports
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/stripe', () => ({
  stripe: {
    billingPortal: {
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
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logError: jest.fn(),
}));

import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockStripe = stripe as jest.Mocked<typeof stripe>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockLogError = logError as jest.MockedFunction<typeof logError>;

describe('POST /api/billing-portal', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = new NextRequest('http://localhost:3000/api/billing-portal', {
      method: 'POST',
    });

    // Set default environment variable
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when session has no user', async () => {
      mockAuth.mockResolvedValue({} as any);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when session user has no id', async () => {
      mockAuth.mockResolvedValue({
        user: {},
      } as any);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('User Validation', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
      } as any);
    });

    it('should return 404 when user not found in database', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('No subscription found');
    });

    it('should return 404 when user has no Stripe customer ID', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'user@test.com',
        stripeCustomerId: null,
      } as any);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('No subscription found');
    });

    it('should query user by correct ID', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        stripeCustomerId: 'cus_123',
      } as any);

      mockStripe.billingPortal.sessions.create.mockResolvedValue({
        url: 'https://billing.stripe.com/session/123',
      } as any);

      await POST(mockRequest);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });
  });

  describe('Billing Portal Session Creation', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
      } as any);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'user@test.com',
        stripeCustomerId: 'cus_stripe_123',
      } as any);
    });

    it('should create billing portal session with correct parameters', async () => {
      mockStripe.billingPortal.sessions.create.mockResolvedValue({
        id: 'bps_123',
        url: 'https://billing.stripe.com/session/123',
      } as any);

      await POST(mockRequest);

      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_stripe_123',
        return_url: 'http://localhost:3000/dashboard/settings/billing',
      });
    });

    it('should return portal session URL on success', async () => {
      const mockPortalUrl = 'https://billing.stripe.com/session/abc123';

      mockStripe.billingPortal.sessions.create.mockResolvedValue({
        id: 'bps_123',
        url: mockPortalUrl,
      } as any);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.url).toBe(mockPortalUrl);
    });

    it('should use NEXTAUTH_URL from environment for return URL', async () => {
      process.env.NEXTAUTH_URL = 'https://myapp.com';

      mockStripe.billingPortal.sessions.create.mockResolvedValue({
        url: 'https://billing.stripe.com/session/123',
      } as any);

      await POST(mockRequest);

      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          return_url: 'https://myapp.com/dashboard/settings/billing',
        })
      );
    });

    it('should handle different Stripe customer IDs', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        stripeCustomerId: 'cus_different_id',
      } as any);

      mockStripe.billingPortal.sessions.create.mockResolvedValue({
        url: 'https://billing.stripe.com/session/123',
      } as any);

      await POST(mockRequest);

      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_different_id',
        })
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
      } as any);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        stripeCustomerId: 'cus_123',
      } as any);
    });

    it('should return 500 when Stripe API fails', async () => {
      const stripeError = new Error('Stripe API error');
      mockStripe.billingPortal.sessions.create.mockRejectedValue(stripeError);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should log error when Stripe API fails', async () => {
      const stripeError = new Error('Stripe connection failed');
      mockStripe.billingPortal.sessions.create.mockRejectedValue(stripeError);

      await POST(mockRequest);

      expect(mockLogError).toHaveBeenCalledWith(stripeError);
    });

    it('should return 500 when database query fails', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should log error when database query fails', async () => {
      const dbError = new Error('Database connection lost');
      mockPrisma.user.findUnique.mockRejectedValue(dbError);

      await POST(mockRequest);

      expect(mockLogError).toHaveBeenCalledWith(dbError);
    });

    it('should handle non-Error exceptions', async () => {
      mockStripe.billingPortal.sessions.create.mockRejectedValue('String error');

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(mockLogError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Billing portal failed',
        })
      );
    });

    it('should handle auth service errors', async () => {
      mockAuth.mockRejectedValue(new Error('Auth service down'));

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete successful flow', async () => {
      // Setup
      mockAuth.mockResolvedValue({
        user: { id: 'user-456', email: 'premium@test.com' },
      } as any);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-456',
        email: 'premium@test.com',
        stripeCustomerId: 'cus_premium_user',
      } as any);

      mockStripe.billingPortal.sessions.create.mockResolvedValue({
        id: 'bps_456',
        url: 'https://billing.stripe.com/session/premium',
      } as any);

      // Execute
      const response = await POST(mockRequest);
      const data = await response.json();

      // Verify
      expect(response.status).toBe(200);
      expect(data.url).toBe('https://billing.stripe.com/session/premium');
      expect(mockAuth).toHaveBeenCalled();
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-456' },
      });
      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_premium_user',
        return_url: 'http://localhost:3000/dashboard/settings/billing',
      });
    });

    it('should not call Stripe when user has no customer ID', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
      } as any);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        stripeCustomerId: null,
      } as any);

      await POST(mockRequest);

      expect(mockStripe.billingPortal.sessions.create).not.toHaveBeenCalled();
    });

    it('should not query database when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      await POST(mockRequest);

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
      expect(mockStripe.billingPortal.sessions.create).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty Stripe customer ID string', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
      } as any);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        stripeCustomerId: '',
      } as any);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('No subscription found');
    });

    it('should handle missing NEXTAUTH_URL', async () => {
      delete process.env.NEXTAUTH_URL;

      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
      } as any);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        stripeCustomerId: 'cus_123',
      } as any);

      mockStripe.billingPortal.sessions.create.mockResolvedValue({
        url: 'https://billing.stripe.com/session/123',
      } as any);

      await POST(mockRequest);

      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          return_url: 'undefined/dashboard/settings/billing',
        })
      );

      // Restore for other tests
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
    });

    it('should handle very long customer IDs', async () => {
      const longCustomerId = 'cus_' + 'a'.repeat(1000);

      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
      } as any);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        stripeCustomerId: longCustomerId,
      } as any);

      mockStripe.billingPortal.sessions.create.mockResolvedValue({
        url: 'https://billing.stripe.com/session/123',
      } as any);

      await POST(mockRequest);

      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: longCustomerId,
        })
      );
    });
  });
});
