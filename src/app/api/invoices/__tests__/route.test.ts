/**
 * Tests for GET /api/invoices
 * @jest-environment node
 */

// Mock dependencies BEFORE imports
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
    invoice: {
      findMany: jest.fn(),
    },
  },
}));

// Now import after mocks
import { GET } from '../route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;
const mockFindUnique = prisma.user.findUnique as jest.MockedFunction<
  typeof prisma.user.findUnique
>;
const mockFindMany = prisma.invoice.findMany as jest.MockedFunction<
  typeof prisma.invoice.findMany
>;

describe('GET /api/invoices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 401 when session has no email', async () => {
    mockGetServerSession.mockResolvedValue({
      user: {},
      expires: new Date().toISOString(),
    });

    const response = await GET();
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

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('should return empty array when user has no invoices', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com' },
      expires: new Date().toISOString(),
    });
    mockFindUnique.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      name: null,
      emailVerified: null,
      image: null,
      planConfigId: 'config-1',
    });
    mockFindMany.mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it('should return user invoices successfully', async () => {
    const mockInvoices = [
      {
        id: 'inv-1',
        userId: 'user-123',
        stripeInvoiceId: 'stripe-inv-1',
        amount: 2900,
        currency: 'usd',
        status: 'PAID' as const,
        paidAt: new Date('2025-01-15'),
        hostedInvoiceUrl: 'https://invoice.stripe.com/1',
        invoicePdf: 'https://invoice.stripe.com/1/pdf',
        subscriptionId: 'sub-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'inv-2',
        userId: 'user-123',
        stripeInvoiceId: 'stripe-inv-2',
        amount: 2900,
        currency: 'usd',
        status: 'PAID' as const,
        paidAt: new Date('2024-12-15'),
        hostedInvoiceUrl: 'https://invoice.stripe.com/2',
        invoicePdf: 'https://invoice.stripe.com/2/pdf',
        subscriptionId: 'sub-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com' },
      expires: new Date().toISOString(),
    });
    mockFindUnique.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      name: null,
      emailVerified: null,
      image: null,
      planConfigId: 'config-1',
    });
    mockFindMany.mockResolvedValue(mockInvoices);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0]).toEqual({
      id: 'inv-1',
      amount: 2900,
      currency: 'usd',
      status: 'PAID',
      paidAt: expect.any(String),
      hostedInvoiceUrl: 'https://invoice.stripe.com/1',
      invoicePdf: 'https://invoice.stripe.com/1/pdf',
    });
  });

  it('should limit to last 12 invoices', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com' },
      expires: new Date().toISOString(),
    });
    mockFindUnique.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      name: null,
      emailVerified: null,
      image: null,
      planConfigId: 'config-1',
    });

    await GET();

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      orderBy: { paidAt: 'desc' },
      take: 12,
    });
  });

  it('should order invoices by paidAt descending', async () => {
    const mockInvoices = [
      {
        id: 'inv-recent',
        userId: 'user-123',
        stripeInvoiceId: 'stripe-inv-recent',
        amount: 2900,
        currency: 'usd',
        status: 'PAID' as const,
        paidAt: new Date('2025-01-15'), // Most recent
        hostedInvoiceUrl: 'https://invoice.stripe.com/recent',
        invoicePdf: 'https://invoice.stripe.com/recent/pdf',
        subscriptionId: 'sub-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'inv-old',
        userId: 'user-123',
        stripeInvoiceId: 'stripe-inv-old',
        amount: 2900,
        currency: 'usd',
        status: 'PAID' as const,
        paidAt: new Date('2024-01-15'), // Older
        hostedInvoiceUrl: 'https://invoice.stripe.com/old',
        invoicePdf: 'https://invoice.stripe.com/old/pdf',
        subscriptionId: 'sub-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com' },
      expires: new Date().toISOString(),
    });
    mockFindUnique.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      name: null,
      emailVerified: null,
      image: null,
      planConfigId: 'config-1',
    });
    mockFindMany.mockResolvedValue(mockInvoices);

    const response = await GET();
    const data = await response.json();

    expect(data[0].id).toBe('inv-recent');
    expect(data[1].id).toBe('inv-old');
  });

  it('should handle different invoice statuses', async () => {
    const mockInvoices = [
      {
        id: 'inv-paid',
        userId: 'user-123',
        stripeInvoiceId: 'stripe-inv-paid',
        amount: 2900,
        currency: 'usd',
        status: 'PAID' as const,
        paidAt: new Date(),
        hostedInvoiceUrl: 'https://invoice.stripe.com/paid',
        invoicePdf: 'https://invoice.stripe.com/paid/pdf',
        subscriptionId: 'sub-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'inv-pending',
        userId: 'user-123',
        stripeInvoiceId: 'stripe-inv-pending',
        amount: 2900,
        currency: 'usd',
        status: 'OPEN' as const,
        paidAt: new Date(),
        hostedInvoiceUrl: 'https://invoice.stripe.com/pending',
        invoicePdf: null,
        subscriptionId: 'sub-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com' },
      expires: new Date().toISOString(),
    });
    mockFindUnique.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      name: null,
      emailVerified: null,
      image: null,
      planConfigId: 'config-1',
    });
    mockFindMany.mockResolvedValue(mockInvoices);

    const response = await GET();
    const data = await response.json();

    expect(data[0].status).toBe('PAID');
    expect(data[1].status).toBe('OPEN');
  });

  it('should handle different currencies', async () => {
    const mockInvoices = [
      {
        id: 'inv-usd',
        userId: 'user-123',
        stripeInvoiceId: 'stripe-inv-usd',
        amount: 2900,
        currency: 'usd',
        status: 'PAID' as const,
        paidAt: new Date(),
        hostedInvoiceUrl: 'https://invoice.stripe.com/usd',
        invoicePdf: 'https://invoice.stripe.com/usd/pdf',
        subscriptionId: 'sub-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'inv-eur',
        userId: 'user-123',
        stripeInvoiceId: 'stripe-inv-eur',
        amount: 2500,
        currency: 'eur',
        status: 'PAID' as const,
        paidAt: new Date(),
        hostedInvoiceUrl: 'https://invoice.stripe.com/eur',
        invoicePdf: 'https://invoice.stripe.com/eur/pdf',
        subscriptionId: 'sub-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com' },
      expires: new Date().toISOString(),
    });
    mockFindUnique.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      name: null,
      emailVerified: null,
      image: null,
      planConfigId: 'config-1',
    });
    mockFindMany.mockResolvedValue(mockInvoices);

    const response = await GET();
    const data = await response.json();

    expect(data[0].currency).toBe('usd');
    expect(data[0].amount).toBe(2900);
    expect(data[1].currency).toBe('eur');
    expect(data[1].amount).toBe(2500);
  });

  it('should only return specific invoice fields', async () => {
    const mockInvoices = [
      {
        id: 'inv-1',
        userId: 'user-123', // Should NOT be returned
        stripeInvoiceId: 'stripe-inv-1', // Should NOT be returned
        amount: 2900,
        currency: 'usd',
        status: 'PAID' as const,
        paidAt: new Date(),
        hostedInvoiceUrl: 'https://invoice.stripe.com/1',
        invoicePdf: 'https://invoice.stripe.com/1/pdf',
        subscriptionId: 'sub-1', // Should NOT be returned
        createdAt: new Date(), // Should NOT be returned
        updatedAt: new Date(), // Should NOT be returned
      },
    ];

    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com' },
      expires: new Date().toISOString(),
    });
    mockFindUnique.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      name: null,
      emailVerified: null,
      image: null,
      planConfigId: 'config-1',
    });
    mockFindMany.mockResolvedValue(mockInvoices);

    const response = await GET();
    const data = await response.json();

    const invoice = data[0];
    expect(invoice).toHaveProperty('id');
    expect(invoice).toHaveProperty('amount');
    expect(invoice).toHaveProperty('currency');
    expect(invoice).toHaveProperty('status');
    expect(invoice).toHaveProperty('paidAt');
    expect(invoice).toHaveProperty('hostedInvoiceUrl');
    expect(invoice).toHaveProperty('invoicePdf');

    expect(invoice).not.toHaveProperty('userId');
    expect(invoice).not.toHaveProperty('stripeInvoiceId');
    expect(invoice).not.toHaveProperty('subscriptionId');
    expect(invoice).not.toHaveProperty('createdAt');
    expect(invoice).not.toHaveProperty('updatedAt');
  });

  it('should return 500 when database query fails', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com' },
      expires: new Date().toISOString(),
    });
    mockFindUnique.mockRejectedValue(new Error('Database error'));

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch invoices');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to fetch invoices:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should handle null invoicePdf field', async () => {
    const mockInvoices = [
      {
        id: 'inv-no-pdf',
        userId: 'user-123',
        stripeInvoiceId: 'stripe-inv-no-pdf',
        amount: 2900,
        currency: 'usd',
        status: 'OPEN' as const,
        paidAt: new Date(),
        hostedInvoiceUrl: 'https://invoice.stripe.com/no-pdf',
        invoicePdf: null, // No PDF available yet
        subscriptionId: 'sub-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com' },
      expires: new Date().toISOString(),
    });
    mockFindUnique.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      name: null,
      emailVerified: null,
      image: null,
      planConfigId: 'config-1',
    });
    mockFindMany.mockResolvedValue(mockInvoices);

    const response = await GET();
    const data = await response.json();

    expect(data[0].invoicePdf).toBeNull();
  });
});
