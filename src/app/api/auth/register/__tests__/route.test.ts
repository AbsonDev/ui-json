/**
 * @jest-environment node
 */

// Mock modules BEFORE imports
jest.mock('@/lib/auth', () => ({
  registerUser: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  registerRateLimiter: {
    check: jest.fn(),
  },
  getClientIdentifier: jest.fn(),
  createRateLimitResponse: jest.fn(),
}));

import { POST } from '../route';
import { registerUser } from '@/lib/auth';
import {
  registerRateLimiter,
  getClientIdentifier,
  createRateLimitResponse,
} from '@/lib/rate-limit';

describe('POST /api/auth/register', () => {
  const mockUser = {
    id: 'user-123',
    email: 'newuser@test.com',
    name: 'New User',
  };

  const mockRegistrationData = {
    email: 'newuser@test.com',
    password: 'SecureP@ssw0rd!',
    name: 'New User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Registration', () => {
    it('should register a new user successfully', async () => {
      (getClientIdentifier as jest.Mock).mockReturnValue('127.0.0.1');
      (registerRateLimiter.check as jest.Mock).mockReturnValue({ success: true });
      (registerUser as jest.Mock).mockResolvedValue(mockUser);

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRegistrationData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.user).toEqual({
        id: 'user-123',
        email: 'newuser@test.com',
        name: 'New User',
      });
    });

    it('should call registerUser with request body', async () => {
      (getClientIdentifier as jest.Mock).mockReturnValue('127.0.0.1');
      (registerRateLimiter.check as jest.Mock).mockReturnValue({ success: true });
      (registerUser as jest.Mock).mockResolvedValue(mockUser);

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRegistrationData),
      });

      await POST(request);

      expect(registerUser).toHaveBeenCalledWith(mockRegistrationData);
    });

    it('should not expose password in response', async () => {
      (getClientIdentifier as jest.Mock).mockReturnValue('127.0.0.1');
      (registerRateLimiter.check as jest.Mock).mockReturnValue({ success: true });
      (registerUser as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: 'hashed_password',
      });

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRegistrationData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.user).not.toHaveProperty('password');
      expect(data.user.id).toBe('user-123');
      expect(data.user.email).toBe('newuser@test.com');
      expect(data.user.name).toBe('New User');
    });
  });

  describe('Rate Limiting', () => {
    it('should check rate limit before registration', async () => {
      (getClientIdentifier as jest.Mock).mockReturnValue('127.0.0.1');
      (registerRateLimiter.check as jest.Mock).mockReturnValue({ success: true });
      (registerUser as jest.Mock).mockResolvedValue(mockUser);

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRegistrationData),
      });

      await POST(request);

      expect(getClientIdentifier).toHaveBeenCalledWith(request);
      expect(registerRateLimiter.check).toHaveBeenCalledWith('127.0.0.1');
    });

    it('should return rate limit response when limit exceeded', async () => {
      const mockResetAt = new Date('2025-12-26T12:00:00Z');
      const mockRateLimitResponse = new Response(
        JSON.stringify({ error: 'Too many requests' }),
        {
          status: 429,
          headers: { 'Retry-After': '60' },
        }
      );

      (getClientIdentifier as jest.Mock).mockReturnValue('127.0.0.1');
      (registerRateLimiter.check as jest.Mock).mockReturnValue({
        success: false,
        resetAt: mockResetAt,
      });
      (createRateLimitResponse as jest.Mock).mockReturnValue(mockRateLimitResponse);

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRegistrationData),
      });

      const response = await POST(request);

      expect(createRateLimitResponse).toHaveBeenCalledWith(mockResetAt);
      expect(registerUser).not.toHaveBeenCalled();
      expect(response.status).toBe(429);
    });

    it('should use client identifier for rate limiting', async () => {
      (getClientIdentifier as jest.Mock).mockReturnValue('192.168.1.100');
      (registerRateLimiter.check as jest.Mock).mockReturnValue({
        success: false,
        resetAt: new Date(),
      });
      (createRateLimitResponse as jest.Mock).mockReturnValue(
        new Response('', { status: 429 })
      );

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRegistrationData),
      });

      await POST(request);

      expect(registerRateLimiter.check).toHaveBeenCalledWith('192.168.1.100');
    });
  });

  describe('Error Handling', () => {
    it('should return 400 for duplicate email', async () => {
      (getClientIdentifier as jest.Mock).mockReturnValue('127.0.0.1');
      (registerRateLimiter.check as jest.Mock).mockReturnValue({ success: true });
      (registerUser as jest.Mock).mockRejectedValue(
        new Error('User with this email already exists')
      );

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRegistrationData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('User with this email already exists');
    });

    it('should return 400 for invalid password', async () => {
      (getClientIdentifier as jest.Mock).mockReturnValue('127.0.0.1');
      (registerRateLimiter.check as jest.Mock).mockReturnValue({ success: true });
      (registerUser as jest.Mock).mockRejectedValue(
        new Error('Password must be at least 8 characters')
      );

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...mockRegistrationData,
          password: 'weak',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Password must be at least 8 characters');
    });

    it('should return 400 for invalid email', async () => {
      (getClientIdentifier as jest.Mock).mockReturnValue('127.0.0.1');
      (registerRateLimiter.check as jest.Mock).mockReturnValue({ success: true });
      (registerUser as jest.Mock).mockRejectedValue(new Error('Invalid email format'));

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...mockRegistrationData,
          email: 'invalid-email',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid email format');
    });

    it('should handle missing fields', async () => {
      (getClientIdentifier as jest.Mock).mockReturnValue('127.0.0.1');
      (registerRateLimiter.check as jest.Mock).mockReturnValue({ success: true });
      (registerUser as jest.Mock).mockRejectedValue(new Error('Email is required'));

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email is required');
    });

    it('should handle malformed JSON', async () => {
      (getClientIdentifier as jest.Mock).mockReturnValue('127.0.0.1');
      (registerRateLimiter.check as jest.Mock).mockReturnValue({ success: true });

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeTruthy();
    });

    it('should handle generic errors gracefully', async () => {
      (getClientIdentifier as jest.Mock).mockReturnValue('127.0.0.1');
      (registerRateLimiter.check as jest.Mock).mockReturnValue({ success: true });
      (registerUser as jest.Mock).mockRejectedValue(new Error());

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRegistrationData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Registration failed');
    });
  });

  describe('Security', () => {
    it('should not register when rate limited', async () => {
      (getClientIdentifier as jest.Mock).mockReturnValue('127.0.0.1');
      (registerRateLimiter.check as jest.Mock).mockReturnValue({
        success: false,
        resetAt: new Date(),
      });
      (createRateLimitResponse as jest.Mock).mockReturnValue(
        new Response('', { status: 429 })
      );

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRegistrationData),
      });

      await POST(request);

      expect(registerUser).not.toHaveBeenCalled();
    });

    it('should validate input before registration', async () => {
      (getClientIdentifier as jest.Mock).mockReturnValue('127.0.0.1');
      (registerRateLimiter.check as jest.Mock).mockReturnValue({ success: true });
      (registerUser as jest.Mock).mockRejectedValue(new Error('Validation error'));

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@test.com',
          password: '',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(registerUser).toHaveBeenCalled();
    });

    it('should only return safe user data', async () => {
      (getClientIdentifier as jest.Mock).mockReturnValue('127.0.0.1');
      (registerRateLimiter.check as jest.Mock).mockReturnValue({ success: true });
      (registerUser as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: 'hashed_password',
        stripeCustomerId: 'cus_123',
        planTier: 'FREE',
        createdAt: new Date(),
      });

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRegistrationData),
      });

      const response = await POST(request);
      const data = await response.json();

      // Only id, email, and name should be returned
      expect(Object.keys(data.user)).toEqual(['id', 'email', 'name']);
      expect(data.user).not.toHaveProperty('password');
      expect(data.user).not.toHaveProperty('stripeCustomerId');
      expect(data.user).not.toHaveProperty('planTier');
    });
  });

  describe('Request Processing', () => {
    it('should handle registration with all fields', async () => {
      (getClientIdentifier as jest.Mock).mockReturnValue('127.0.0.1');
      (registerRateLimiter.check as jest.Mock).mockReturnValue({ success: true });
      (registerUser as jest.Mock).mockResolvedValue(mockUser);

      const fullRegistrationData = {
        email: 'newuser@test.com',
        password: 'SecureP@ssw0rd!',
        name: 'New User',
      };

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullRegistrationData),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(registerUser).toHaveBeenCalledWith(fullRegistrationData);
    });

    it('should process registration in correct order', async () => {
      const callOrder: string[] = [];

      (getClientIdentifier as jest.Mock).mockImplementation((req) => {
        callOrder.push('getClientIdentifier');
        return '127.0.0.1';
      });

      (registerRateLimiter.check as jest.Mock).mockImplementation(() => {
        callOrder.push('rateLimit');
        return { success: true };
      });

      (registerUser as jest.Mock).mockImplementation(() => {
        callOrder.push('registerUser');
        return Promise.resolve(mockUser);
      });

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRegistrationData),
      });

      await POST(request);

      // Verify the order: getClientIdentifier -> rateLimit -> registerUser
      expect(callOrder).toEqual(['getClientIdentifier', 'rateLimit', 'registerUser']);
    });
  });

  describe('Response Format', () => {
    it('should return correct success response format', async () => {
      (getClientIdentifier as jest.Mock).mockReturnValue('127.0.0.1');
      (registerRateLimiter.check as jest.Mock).mockReturnValue({ success: true });
      (registerUser as jest.Mock).mockResolvedValue(mockUser);

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRegistrationData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('user');
      expect(data.success).toBe(true);
      expect(data.user).toHaveProperty('id');
      expect(data.user).toHaveProperty('email');
      expect(data.user).toHaveProperty('name');
    });

    it('should return correct error response format', async () => {
      (getClientIdentifier as jest.Mock).mockReturnValue('127.0.0.1');
      (registerRateLimiter.check as jest.Mock).mockReturnValue({ success: true });
      (registerUser as jest.Mock).mockRejectedValue(new Error('Test error'));

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRegistrationData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('error');
      expect(data).not.toHaveProperty('success');
      expect(typeof data.error).toBe('string');
    });
  });
});
