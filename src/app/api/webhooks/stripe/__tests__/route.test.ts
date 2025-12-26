/**
 * @jest-environment node
 */

// Mock modules BEFORE imports
jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

jest.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
  },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    subscription: {
      upsert: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    invoice: {
      upsert: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logError: jest.fn(),
}));

jest.mock('@/lib/analytics/config', () => ({
  identifyUser: jest.fn(),
  trackEvent: jest.fn(),
  trackRevenue: jest.fn(),
  setUserProperties: jest.fn(),
}));

jest.mock('@/lib/email/config', () => ({
  sendEmail: jest.fn(),
}));

jest.mock('@/lib/email/payment-templates', () => ({
  getPaymentSuccessEmailTemplate: jest.fn(() => '<html>Payment Success</html>'),
  getPaymentFailedEmailTemplate: jest.fn(() => '<html>Payment Failed</html>'),
  getSubscriptionCanceledEmailTemplate: jest.fn(() => '<html>Subscription Canceled</html>'),
}));

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';
import { trackEvent, trackRevenue, setUserProperties } from '@/lib/analytics/config';

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  });

  describe('Signature Verification', () => {
    it('should return 400 when signature is missing', async () => {
      (headers as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue(null),
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({ type: 'test' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('No signature');
      expect(stripe.webhooks.constructEvent).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid signature', async () => {
      (headers as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue('invalid_signature'),
      });

      (stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({ type: 'test' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid signature');
      expect(logError).toHaveBeenCalled();
    });

    it('should verify signature with Stripe webhook secret', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { userId: 'user-123', planTier: 'PRO' },
            amount_total: 5000,
          },
        },
      };

      (headers as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue('valid_signature'),
      });

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);

      const requestBody = JSON.stringify(mockEvent);
      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: requestBody,
      });

      await POST(request);

      expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith(
        requestBody,
        'valid_signature',
        'whsec_test_secret'
      );
    });
  });

  describe('checkout.session.completed', () => {
    it('should handle checkout session completed event', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: {
              userId: 'user-123',
              planTier: 'PRO',
              interval: 'monthly',
            },
            amount_total: 5000,
            customer: 'cus_123',
          },
        },
      };

      (headers as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue('valid_signature'),
      });

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(trackEvent).toHaveBeenCalledWith('Checkout_Completed', {
        userId: 'user-123',
        planTier: 'PRO',
        interval: 'monthly',
        amount: 50, // 5000 cents / 100
        customerId: 'cus_123',
      });
      expect(trackRevenue).toHaveBeenCalledWith(50, {
        planTier: 'PRO',
        interval: 'monthly',
      });
    });

    it('should throw error when userId missing in checkout metadata', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { planTier: 'PRO' },
            amount_total: 5000,
          },
        },
      };

      (headers as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue('valid_signature'),
      });

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Webhook handler failed');
      expect(logError).toHaveBeenCalled();
    });

    it('should use default interval when not provided', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { userId: 'user-123', planTier: 'PRO' },
            amount_total: 5000,
            customer: 'cus_123',
          },
        },
      };

      (headers as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue('valid_signature'),
      });

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      await POST(request);

      expect(trackEvent).toHaveBeenCalledWith('Checkout_Completed', expect.objectContaining({
        interval: 'monthly',
      }));
    });
  });

  describe('customer.subscription.created/updated', () => {
    it('should create new subscription on subscription.created', async () => {
      const mockEvent = {
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            metadata: { userId: 'user-123', planTier: 'PRO' },
            status: 'trialing',
            current_period_start: 1703577600,
            current_period_end: 1706256000,
            cancel_at_period_end: false,
            trial_start: 1703577600,
            trial_end: 1704787200,
            items: {
              data: [
                {
                  price: {
                    id: 'price_123',
                    product: 'prod_123',
                    unit_amount: 2999,
                    currency: 'usd',
                    recurring: { interval: 'month' },
                  },
                },
              ],
            },
          },
        },
      };

      (headers as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue('valid_signature'),
      });

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
      (prisma.subscription.upsert as jest.Mock).mockResolvedValue({});
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ planTier: 'FREE' });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(prisma.subscription.upsert).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: 'sub_123' },
        create: expect.objectContaining({
          stripeSubscriptionId: 'sub_123',
          planTier: 'PRO',
          status: 'TRIALING',
          amount: 2999,
          currency: 'usd',
          interval: 'MONTH',
          userId: 'user-123',
        }),
        update: expect.any(Object),
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { planTier: 'PRO' },
      });
    });

    it('should track trial started when status is trialing', async () => {
      const mockEvent = {
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            metadata: { userId: 'user-123', planTier: 'PRO' },
            status: 'trialing',
            current_period_start: 1703577600,
            current_period_end: 1706256000,
            trial_start: 1703577600,
            trial_end: 1704787200,
            cancel_at_period_end: false,
            items: {
              data: [
                {
                  price: {
                    id: 'price_123',
                    product: 'prod_123',
                    unit_amount: 2999,
                    currency: 'usd',
                    recurring: { interval: 'month' },
                  },
                },
              ],
            },
          },
        },
      };

      (headers as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue('valid_signature'),
      });

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
      (prisma.subscription.upsert as jest.Mock).mockResolvedValue({});
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ planTier: 'FREE' });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      await POST(request);

      expect(trackEvent).toHaveBeenCalledWith('Trial_Started', {
        userId: 'user-123',
        planTier: 'PRO',
      });
      expect(setUserProperties).toHaveBeenCalledWith(expect.objectContaining({
        planTier: 'PRO',
        isTrialing: true,
      }));
    });

    it('should track subscription upgrade when plan changes', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_123',
            metadata: { userId: 'user-123', planTier: 'TEAM' },
            status: 'active',
            current_period_start: 1703577600,
            current_period_end: 1706256000,
            cancel_at_period_end: false,
            items: {
              data: [
                {
                  price: {
                    id: 'price_team',
                    product: 'prod_team',
                    unit_amount: 9999,
                    currency: 'usd',
                    recurring: { interval: 'month' },
                  },
                },
              ],
            },
          },
        },
      };

      (headers as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue('valid_signature'),
      });

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
      (prisma.subscription.upsert as jest.Mock).mockResolvedValue({});
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ planTier: 'PRO' });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      await POST(request);

      expect(trackEvent).toHaveBeenCalledWith('Subscription_Upgraded', {
        userId: 'user-123',
        fromPlan: 'PRO',
        toPlan: 'TEAM',
        newAmount: 99.99,
      });
    });

    it('should handle yearly subscription interval', async () => {
      const mockEvent = {
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            metadata: { userId: 'user-123', planTier: 'PRO' },
            status: 'active',
            current_period_start: 1703577600,
            current_period_end: 1735200000,
            cancel_at_period_end: false,
            items: {
              data: [
                {
                  price: {
                    id: 'price_yearly',
                    product: 'prod_123',
                    unit_amount: 29999,
                    currency: 'usd',
                    recurring: { interval: 'year' },
                  },
                },
              ],
            },
          },
        },
      };

      (headers as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue('valid_signature'),
      });

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
      (prisma.subscription.upsert as jest.Mock).mockResolvedValue({});
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ planTier: 'FREE' });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      await POST(request);

      expect(prisma.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            interval: 'YEAR',
          }),
        })
      );
    });
  });

  describe('customer.subscription.deleted', () => {
    it('should cancel subscription and downgrade to FREE', async () => {
      const mockEvent = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_123',
            metadata: { userId: 'user-123', planTier: 'PRO' },
          },
        },
      };

      const mockSubscription = {
        createdAt: new Date('2024-01-01'),
        currentPeriodEnd: new Date('2025-01-01'),
      };

      const mockUser = {
        email: 'user@test.com',
        name: 'Test User',
      };

      (headers as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue('valid_signature'),
      });

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
      (prisma.subscription.update as jest.Mock).mockResolvedValue({});
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(mockSubscription);
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const { sendEmail } = require('@/lib/email/config');
      (sendEmail as jest.Mock).mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: 'sub_123' },
        data: { status: 'CANCELED' },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { planTier: 'FREE' },
      });
      expect(trackEvent).toHaveBeenCalledWith('Subscription_Canceled', expect.objectContaining({
        userId: 'user-123',
        planTier: 'PRO',
      }));
    });

    it('should send cancellation email', async () => {
      const mockEvent = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_123',
            metadata: { userId: 'user-123', planTier: 'PRO' },
          },
        },
      };

      const mockSubscription = {
        createdAt: new Date('2024-01-01'),
        currentPeriodEnd: new Date('2025-01-01'),
      };

      const mockUser = {
        email: 'user@test.com',
        name: 'Test User',
      };

      (headers as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue('valid_signature'),
      });

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
      (prisma.subscription.update as jest.Mock).mockResolvedValue({});
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(mockSubscription);
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const { sendEmail } = require('@/lib/email/config');
      (sendEmail as jest.Mock).mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      await POST(request);

      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: expect.stringContaining('Assinatura Cancelada'),
        })
      );
    });
  });

  describe('invoice.paid', () => {
    it('should create invoice record when payment succeeds', async () => {
      const mockEvent = {
        type: 'invoice.paid',
        data: {
          object: {
            id: 'inv_123',
            metadata: { userId: 'user-123' },
            payment_intent: 'pi_123',
            amount_paid: 5000,
            currency: 'usd',
            hosted_invoice_url: 'https://invoice.stripe.com/inv_123',
            invoice_pdf: 'https://invoice.stripe.com/inv_123/pdf',
            period_start: 1703577600,
            period_end: 1706256000,
            status_transitions: {
              paid_at: 1703577600,
            },
          },
        },
      };

      const mockUser = {
        id: 'user-123',
        email: 'user@test.com',
        name: 'Test User',
      };

      const mockSubscription = {
        planTier: 'PRO',
      };

      (headers as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue('valid_signature'),
      });

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
      (prisma.invoice.upsert as jest.Mock).mockResolvedValue({});
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(mockSubscription);

      const { sendEmail } = require('@/lib/email/config');
      (sendEmail as jest.Mock).mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(prisma.invoice.upsert).toHaveBeenCalledWith({
        where: { stripeInvoiceId: 'inv_123' },
        create: expect.objectContaining({
          stripeInvoiceId: 'inv_123',
          status: 'PAID',
          amount: 5000,
          userId: 'user-123',
        }),
        update: expect.any(Object),
      });
    });

    it('should send payment success email', async () => {
      const mockEvent = {
        type: 'invoice.paid',
        data: {
          object: {
            id: 'inv_123',
            metadata: { userId: 'user-123' },
            payment_intent: 'pi_123',
            amount_paid: 5000,
            currency: 'usd',
            hosted_invoice_url: 'https://invoice.stripe.com/inv_123',
            invoice_pdf: 'https://invoice.stripe.com/inv_123/pdf',
            period_start: 1703577600,
            period_end: 1706256000,
            status_transitions: {
              paid_at: 1703577600,
            },
          },
        },
      };

      const mockUser = {
        id: 'user-123',
        email: 'user@test.com',
        name: 'Test User',
      };

      (headers as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue('valid_signature'),
      });

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
      (prisma.invoice.upsert as jest.Mock).mockResolvedValue({});
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({ planTier: 'PRO' });

      const { sendEmail } = require('@/lib/email/config');
      (sendEmail as jest.Mock).mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      await POST(request);

      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: expect.stringContaining('Pagamento Confirmado'),
        })
      );
    });
  });

  describe('invoice.payment_failed', () => {
    it('should mark invoice as uncollectible on payment failure', async () => {
      const mockEvent = {
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'inv_123',
            metadata: { userId: 'user-123' },
            amount_due: 5000,
            last_finalization_error: {
              message: 'Card declined',
            },
          },
        },
      };

      const mockUser = {
        email: 'user@test.com',
        name: 'Test User',
      };

      (headers as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue('valid_signature'),
      });

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
      (prisma.invoice.update as jest.Mock).mockResolvedValue({});
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({ planTier: 'PRO' });

      const { sendEmail } = require('@/lib/email/config');
      (sendEmail as jest.Mock).mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { stripeInvoiceId: 'inv_123' },
        data: { status: 'UNCOLLECTIBLE' },
      });
      expect(trackEvent).toHaveBeenCalledWith('Payment_Failed', expect.objectContaining({
        userId: 'user-123',
        amount: 50,
        reason: 'Card declined',
      }));
    });

    it('should send payment failure email', async () => {
      const mockEvent = {
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'inv_123',
            metadata: { userId: 'user-123' },
            amount_due: 5000,
            last_finalization_error: {
              message: 'Insufficient funds',
            },
          },
        },
      };

      const mockUser = {
        email: 'user@test.com',
        name: 'Test User',
      };

      (headers as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue('valid_signature'),
      });

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
      (prisma.invoice.update as jest.Mock).mockResolvedValue({});
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({ planTier: 'PRO' });

      const { sendEmail } = require('@/lib/email/config');
      (sendEmail as jest.Mock).mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      await POST(request);

      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: expect.stringContaining('Falha no Pagamento'),
        })
      );
    });
  });

  describe('Unhandled Events', () => {
    it('should acknowledge unhandled event types', async () => {
      const mockEvent = {
        type: 'customer.created',
        data: {
          object: {},
        },
      };

      (headers as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue('valid_signature'),
      });

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on handler error', async () => {
      const mockEvent = {
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            metadata: {}, // Missing userId will cause error
            status: 'active',
            items: { data: [] },
          },
        },
      };

      (headers as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue('valid_signature'),
      });

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Webhook handler failed');
      expect(logError).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const mockEvent = {
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            metadata: { userId: 'user-123', planTier: 'PRO' },
            status: 'active',
            current_period_start: 1703577600,
            current_period_end: 1706256000,
            cancel_at_period_end: false,
            items: {
              data: [
                {
                  price: {
                    id: 'price_123',
                    product: 'prod_123',
                    unit_amount: 2999,
                    currency: 'usd',
                    recurring: { interval: 'month' },
                  },
                },
              ],
            },
          },
        },
      };

      (headers as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue('valid_signature'),
      });

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
      (prisma.subscription.upsert as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      expect(logError).toHaveBeenCalled();
    });
  });
});
