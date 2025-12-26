import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { GoogleGenAI } from '@google/genai';

/**
 * POST /api/ai/execute
 * Executa IA para apps dos clientes
 *
 * Body:
 * {
 *   "appId": "app123",
 *   "aiAction": "chat" | "analyze" | "suggest" | "classify" | "generate",
 *   "prompt": "Texto do usuário",
 *   "persona": "Opcional: personalidade da IA",
 *   "context": {...}, // Contexto opcional (formData, etc)
 *   "chatHistory": [...] // Para chat
 * }
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Autenticação (opcional - pode permitir apps públicos)
    const session = await getServerSession(authOptions);

    // 2. Parse request
    const body = await req.json();
    const {
      appId,
      aiAction = 'chat',
      prompt,
      persona,
      context = {},
      chatHistory = [],
    } = body;

    if (!appId) {
      return NextResponse.json(
        { error: 'appId é obrigatório' },
        { status: 400 }
      );
    }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'prompt é obrigatório' },
        { status: 400 }
      );
    }

    // 3. Buscar app
    const app = await prisma.app.findUnique({
      where: { id: appId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            planTier: true,
          },
        },
      },
    });

    if (!app) {
      return NextResponse.json(
        { error: 'App não encontrado' },
        { status: 404 }
      );
    }

    // 4. Verificar se o app é público ou se o usuário tem acesso
    if (!app.isPublic && (!session?.user?.email || app.user.email !== session.user.email)) {
      return NextResponse.json(
        { error: 'Acesso negado a este app' },
        { status: 403 }
      );
    }

    // 5. Verificar limites de uso do DONO DO APP
    const limits = await getAIExecutionLimits(app.user.id, app.user.planTier);

    if (limits.remaining === 0) {
      return NextResponse.json(
        {
          error: 'O proprietário deste app atingiu o limite de requisições IA',
          upgradeMessage: 'Entre em contato com o desenvolvedor do app',
        },
        { status: 429 }
      );
    }

    // 6. Validar API Key do Gemini
    if (!env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY não configurada');
      return NextResponse.json(
        { error: 'Serviço de IA temporariamente indisponível' },
        { status: 503 }
      );
    }

    // 7. Construir prompt baseado no tipo de ação
    let systemInstruction = persona || 'Você é um assistente prestativo e conciso.';
    let finalPrompt = prompt;

    switch (aiAction) {
      case 'chat':
        // Manter como está, conversação natural
        break;
      case 'analyze':
        systemInstruction = 'Você é um analisador de texto preciso e objetivo. Responda de forma direta e concisa.';
        break;
      case 'suggest':
        systemInstruction = 'Você é um assistente que fornece sugestões úteis e práticas. Seja específico e direto.';
        break;
      case 'classify':
        systemInstruction = 'Você é um classificador de texto. Responda apenas com a categoria, sem explicações adicionais.';
        break;
      case 'generate':
        systemInstruction = 'Você é um gerador de conteúdo criativo. Gere conteúdo de alta qualidade baseado na solicitação.';
        break;
    }

    // 8. Chamar Gemini
    const genAI = new GoogleGenAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction,
    });

    // Construir histórico de chat se houver
    let chatRequest: any = { contents: [] };

    if (aiAction === 'chat' && chatHistory.length > 0) {
      chatRequest.contents = chatHistory.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));
    }

    // Adicionar prompt atual
    chatRequest.contents.push({
      role: 'user',
      parts: [{ text: finalPrompt }],
    });

    const result = await model.generateContent(chatRequest);
    const response = result.response;
    const text = response.text();

    // 9. Incrementar uso do DONO DO APP
    await incrementAIExecutionUsage(app.user.id, appId);

    // 10. Salvar log de uso
    const responseTime = Date.now() - startTime;
    await prisma.appAIUsage.create({
      data: {
        userId: app.user.id,
        appId: app.id,
        aiAction,
        prompt: prompt.substring(0, 500), // Limitar tamanho
        result: text.substring(0, 1000),
        tokensUsed: response.usageMetadata?.totalTokenCount || 0,
        responseTime,
        wasSuccessful: true,
        context: JSON.stringify(context),
      },
    });

    return NextResponse.json({
      result: text,
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
      responseTime,
    });
  } catch (error: any) {
    console.error('Erro ao executar IA:', error);

    // Log de erro
    try {
      const body = await req.json();
      if (body.appId) {
        const app = await prisma.app.findUnique({
          where: { id: body.appId },
          select: { userId: true, id: true },
        });

        if (app) {
          await prisma.appAIUsage.create({
            data: {
              userId: app.userId,
              appId: app.id,
              aiAction: body.aiAction || 'unknown',
              prompt: (body.prompt || '').substring(0, 500),
              result: '',
              tokensUsed: 0,
              responseTime: Date.now() - startTime,
              wasSuccessful: false,
              errorMessage: error.message,
            },
          });
        }
      }
    } catch (logError) {
      console.error('Erro ao salvar log de erro:', logError);
    }

    return NextResponse.json(
      {
        error: 'Erro ao processar requisição de IA',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Obtém limites de execução de IA para apps dos clientes
 */
async function getAIExecutionLimits(userId: string, planTier: string) {
  const limits = {
    FREE: 100, // 100 execuções/mês nos apps
    PRO: 1000,
    TEAM: 10000,
    ENTERPRISE: -1, // ilimitado
  };

  const maxExecutions = limits[planTier as keyof typeof limits] || 100;

  // Verificar uso mensal
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyLimit = await prisma.aIExecutionLimit.findUnique({
    where: {
      userId_month: {
        userId,
        month: startOfMonth,
      },
    },
  });

  if (!monthlyLimit) {
    // Criar registro para este mês
    await prisma.aIExecutionLimit.create({
      data: {
        userId,
        month: startOfMonth,
        executionCount: 0,
        maxExecutions,
      },
    });
    return { current: 0, max: maxExecutions, remaining: maxExecutions };
  }

  return {
    current: monthlyLimit.executionCount,
    max: maxExecutions,
    remaining: maxExecutions === -1 ? -1 : maxExecutions - monthlyLimit.executionCount,
  };
}

/**
 * Incrementa contador de execuções de IA
 */
async function incrementAIExecutionUsage(userId: string, appId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  await prisma.aIExecutionLimit.upsert({
    where: {
      userId_month: {
        userId,
        month: startOfMonth,
      },
    },
    update: {
      executionCount: {
        increment: 1,
      },
    },
    create: {
      userId,
      month: startOfMonth,
      executionCount: 1,
      maxExecutions: 100, // será atualizado com base no plano
    },
  });
}

/**
 * GET /api/ai/execute
 * Retorna limites de uso atuais
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
  }

  const limits = await getAIExecutionLimits(user.id, user.planTier);

  return NextResponse.json({ limits });
}
