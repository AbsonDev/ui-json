/**
 * Tests for /api/ai/execute endpoint
 */

import { NextRequest } from 'next/server';
import { POST, GET } from '../route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';

// Mocks
jest.mock('next-auth');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    app: {
      findUnique: jest.fn(),
    },
    aIExecutionLimit: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    appAIUsage: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));
jest.mock('@/lib/env', () => ({
  env: {
    GEMINI_API_KEY: 'test-api-key',
  },
}));
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue('AI response'),
          usageMetadata: {
            totalTokenCount: 50,
          },
        },
      }),
    }),
  })),
}));

const mockedGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockedPrisma = prisma as any;

describe('POST /api/ai/execute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if appId is missing', async () => {
    const request = new NextRequest('http://localhost/api/ai/execute', {
      method: 'POST',
      body: JSON.stringify({
        prompt: 'test',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('appId é obrigatório');
  });

  it('should return 400 if prompt is missing', async () => {
    const request = new NextRequest('http://localhost/api/ai/execute', {
      method: 'POST',
      body: JSON.stringify({
        appId: 'test-app',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('prompt é obrigatório');
  });

  it('should return 404 if app not found', async () => {
    mockedPrisma.app.findUnique.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost/api/ai/execute', {
      method: 'POST',
      body: JSON.stringify({
        appId: 'non-existent',
        prompt: 'test',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('App não encontrado');
  });

  it('should return 403 if app is private and user not owner', async () => {
    mockedGetServerSession.mockResolvedValueOnce({
      user: { email: 'other@example.com' },
    } as any);

    mockedPrisma.app.findUnique.mockResolvedValueOnce({
      id: 'app-123',
      isPublic: false,
      user: {
        id: 'user-123',
        email: 'owner@example.com',
        planTier: 'PRO',
      },
    });

    const request = new NextRequest('http://localhost/api/ai/execute', {
      method: 'POST',
      body: JSON.stringify({
        appId: 'app-123',
        prompt: 'test',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Acesso negado a este app');
  });

  it('should return 429 if user reached AI execution limit', async () => {
    mockedPrisma.app.findUnique.mockResolvedValueOnce({
      id: 'app-123',
      isPublic: true,
      user: {
        id: 'user-123',
        email: 'user@example.com',
        planTier: 'FREE',
      },
    });

    mockedPrisma.aIExecutionLimit.findUnique.mockResolvedValueOnce({
      id: 'limit-123',
      userId: 'user-123',
      month: new Date(),
      executionCount: 100,
      maxExecutions: 100,
    });

    const request = new NextRequest('http://localhost/api/ai/execute', {
      method: 'POST',
      body: JSON.stringify({
        appId: 'app-123',
        prompt: 'test',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toContain('limite de requisições IA');
  });

  it('should successfully execute AI for chat action', async () => {
    mockedPrisma.app.findUnique.mockResolvedValueOnce({
      id: 'app-123',
      isPublic: true,
      user: {
        id: 'user-123',
        email: 'user@example.com',
        planTier: 'PRO',
      },
    });

    mockedPrisma.aIExecutionLimit.findUnique.mockResolvedValueOnce({
      id: 'limit-123',
      userId: 'user-123',
      month: new Date(),
      executionCount: 50,
      maxExecutions: 1000,
    });

    mockedPrisma.aIExecutionLimit.upsert.mockResolvedValueOnce({} as any);
    mockedPrisma.appAIUsage.create.mockResolvedValueOnce({} as any);

    const request = new NextRequest('http://localhost/api/ai/execute', {
      method: 'POST',
      body: JSON.stringify({
        appId: 'app-123',
        aiAction: 'chat',
        prompt: 'Hello AI',
        persona: 'You are helpful',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.result).toBe('AI response');
    expect(data.tokensUsed).toBe(50);
    expect(mockedPrisma.appAIUsage.create).toHaveBeenCalled();
  });

  it('should handle different AI actions', async () => {
    mockedPrisma.app.findUnique.mockResolvedValue({
      id: 'app-123',
      isPublic: true,
      user: {
        id: 'user-123',
        email: 'user@example.com',
        planTier: 'PRO',
      },
    });

    mockedPrisma.aIExecutionLimit.findUnique.mockResolvedValue({
      executionCount: 0,
      maxExecutions: 1000,
    });

    const actions = ['chat', 'analyze', 'suggest', 'classify', 'generate'];

    for (const action of actions) {
      const request = new NextRequest('http://localhost/api/ai/execute', {
        method: 'POST',
        body: JSON.stringify({
          appId: 'app-123',
          aiAction: action,
          prompt: 'test',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    }
  });

  it('should log failed AI execution', async () => {
    mockedPrisma.app.findUnique.mockResolvedValueOnce({
      id: 'app-123',
      userId: 'user-123',
      isPublic: true,
      user: {
        id: 'user-123',
        email: 'user@example.com',
        planTier: 'PRO',
      },
    });

    // Simular erro no Gemini
    const { GoogleGenAI } = require('@google/genai');
    GoogleGenAI.mockImplementationOnce(() => ({
      getGenerativeModel: () => ({
        generateContent: jest.fn().mockRejectedValue(new Error('Gemini error')),
      }),
    }));

    const request = new NextRequest('http://localhost/api/ai/execute', {
      method: 'POST',
      body: JSON.stringify({
        appId: 'app-123',
        aiAction: 'chat',
        prompt: 'test',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Erro ao processar');
  });

  it('should create new limit record if none exists', async () => {
    mockedPrisma.app.findUnique.mockResolvedValueOnce({
      id: 'app-123',
      isPublic: true,
      user: {
        id: 'user-123',
        email: 'user@example.com',
        planTier: 'PRO',
      },
    });

    mockedPrisma.aIExecutionLimit.findUnique.mockResolvedValueOnce(null);
    mockedPrisma.aIExecutionLimit.create.mockResolvedValueOnce({
      executionCount: 0,
      maxExecutions: 1000,
    } as any);

    const request = new NextRequest('http://localhost/api/ai/execute', {
      method: 'POST',
      body: JSON.stringify({
        appId: 'app-123',
        prompt: 'test',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockedPrisma.aIExecutionLimit.create).toHaveBeenCalled();
  });
});

describe('GET /api/ai/execute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    mockedGetServerSession.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost/api/ai/execute');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Não autorizado');
  });

  it('should return 404 if user not found', async () => {
    mockedGetServerSession.mockResolvedValueOnce({
      user: { email: 'test@example.com' },
    } as any);

    mockedPrisma.user.findUnique.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost/api/ai/execute');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Usuário não encontrado');
  });

  it('should return current limits for authenticated user', async () => {
    mockedGetServerSession.mockResolvedValueOnce({
      user: { email: 'test@example.com' },
    } as any);

    mockedPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-123',
      email: 'test@example.com',
      planTier: 'PRO',
    });

    mockedPrisma.aIExecutionLimit.findUnique.mockResolvedValueOnce({
      executionCount: 50,
      maxExecutions: 1000,
    });

    const request = new NextRequest('http://localhost/api/ai/execute');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.limits).toEqual({
      current: 50,
      max: 1000,
      remaining: 950,
    });
  });
});
