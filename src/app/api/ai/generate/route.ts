import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { GoogleGenAI } from '@google/genai';
import { validateUIJson, validateReferences } from '@/lib/validation/uiJsonSchema';

/**
 * Sistema de instrução para o Google Gemini
 * Define como a IA deve gerar e modificar UI-JSON
 */
const SYSTEM_INSTRUCTION = `Você é um especialista em gerar e modificar UI-JSON, uma linguagem declarativa para criar interfaces e esquemas de dados de aplicativos.

ESTRUTURA COMPLETA:
{
  "version": "1.0",
  "app": {
    "name": "Nome do App",
    "theme": { ... },
    "designTokens": { "primaryColor": "#HEX", "spacingMedium": 16 },
    "databaseSchema": { ... },
    "authentication": {
      "enabled": true,
      "userTable": "users",
      "emailField": "email",
      "passwordField": "password",
      "postLoginScreen": "dashboard",
      "authRedirectScreen": "auth:login"
    }
  },
  "screens": { "screen_id": { "requiresAuth": true, ... } },
  "initialScreen": "screen_id"
}

SUAS CAPACIDADES:

1. GERENCIAR TELAS E COMPONENTES:
   - Criar, remover ou modificar telas e componentes.
   - Componentes disponíveis: text, input, button, image, list, card, select, checkbox, container, divider, datepicker, timepicker.
   - Usar \`"showIf": "session.isLoggedIn"|"session.isLoggedOut"\` para renderização condicional.

2. GERENCIAR O SCHEMA DE BANCO DE DADOS:
   - Criar e modificar o "databaseSchema".
   - Tipos de campo suportados: "string", "number", "boolean", "date", "time".
   - Exemplo: "fields": { "title": { "type": "string", "description": "Título da tarefa" }, "isComplete": { "type": "boolean", "default": false } }

3. GERENCIAR AUTENTICAÇÃO:
   - Habilitar autenticação configurando o objeto \`app.authentication\`.
   - Proteger telas com \`"requiresAuth": true\`.
   - Usar as telas mágicas \`"auth:login"\` e \`"auth:signup"\` em ações de navegação.
   - Usar as ações \`"auth:login"\`, \`"auth:signup"\`, e \`"auth:logout"\` em botões.

4. USAR DESIGN TOKENS:
   - Usar variáveis definidas em \`app.designTokens\` para manter a consistência.
   - Aplicar tokens a propriedades de estilo prefixando com '$', por exemplo: \`"marginBottom": "$spacingMedium"\`.

CONECTANDO UI AO BANCO DE DADOS:
- Botões: \`"action": { "type": "submit", "target": "database", ... }\`.
- Listas: \`"dataSource": { "table": "table_name" }\`.
- Templates: \`"title": "{{fieldName}}"\` para dados de lista, e \`"content": "{{session.user.email}}"\` para dados do usuário logado.

MODIFICANDO JSON EXISTENTE:
- Se um JSON ATUAL for fornecido, seu trabalho é MODIFICÁ-LO, não recriá-lo do zero.
- Analise o pedido do usuário e o JSON ATUAL para entender o contexto.
- Aplique as alterações solicitadas de forma incremental.

REGRAS DE RESPOSTA:
- RESPONDA APENAS COM O JSON COMPLETO E ATUALIZADO.
- NÃO inclua explicações, comentários ou markdown (como \`\`\`json). Apenas o JSON puro.`;

/**
 * Determina a categoria da requisição AI baseada no prompt
 */
function categorizeRequest(prompt: string, jsonBefore: string): 'CREATE' | 'MODIFY' | 'DATABASE' | 'AUTH' | 'COMPONENT' | 'SCREEN' {
  const lowerPrompt = prompt.toLowerCase();

  // Se o JSON está vazio ou quase vazio, é criação
  if (!jsonBefore || jsonBefore.trim().length < 100) {
    return 'CREATE';
  }

  // Detectar categoria baseada em palavras-chave
  if (lowerPrompt.includes('banco') || lowerPrompt.includes('database') || lowerPrompt.includes('tabela') || lowerPrompt.includes('table')) {
    return 'DATABASE';
  }
  if (lowerPrompt.includes('login') || lowerPrompt.includes('autenticação') || lowerPrompt.includes('auth') || lowerPrompt.includes('senha')) {
    return 'AUTH';
  }
  if (lowerPrompt.includes('tela') || lowerPrompt.includes('screen') || lowerPrompt.includes('página')) {
    return 'SCREEN';
  }
  if (lowerPrompt.includes('botão') || lowerPrompt.includes('input') || lowerPrompt.includes('lista') || lowerPrompt.includes('componente')) {
    return 'COMPONENT';
  }

  return 'MODIFY';
}

/**
 * Obtém os limites de AI do usuário baseado no plano
 */
async function getAILimits(userId: string, planTier: string) {
  const limits = {
    FREE: 10,
    PRO: 100,
    TEAM: 500,
    ENTERPRISE: -1, // ilimitado
  };

  const maxRequests = limits[planTier as keyof typeof limits] || 10;

  // Verificar uso diário
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyLimit = await prisma.aIDailyLimit.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  if (!dailyLimit) {
    // Criar registro para hoje
    await prisma.aIDailyLimit.create({
      data: {
        userId,
        date: today,
        requestCount: 0,
        maxRequests,
      },
    });
    return { current: 0, max: maxRequests, remaining: maxRequests };
  }

  return {
    current: dailyLimit.requestCount,
    max: maxRequests,
    remaining: maxRequests === -1 ? -1 : maxRequests - dailyLimit.requestCount,
  };
}

/**
 * Incrementa o contador de requisições AI
 */
async function incrementAIUsage(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.aIDailyLimit.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    update: {
      requestCount: {
        increment: 1,
      },
    },
    create: {
      userId,
      date: today,
      requestCount: 1,
      maxRequests: 10, // será atualizado com base no plano
    },
  });
}

/**
 * POST /api/ai/generate
 * Gera ou modifica UI-JSON usando Google Gemini
 *
 * Body:
 * {
 *   "prompt": "Crie uma tela de login",
 *   "currentJson": "{...}",
 * }
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // 1. Autenticação
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'Não autorizado. Faça login para usar a IA.' },
      { status: 401 }
    );
  }

  // 2. Buscar usuário e plano
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
  }

  // 3. Verificar limites de uso
  const limits = await getAILimits(user.id, user.planTier);

  if (limits.remaining === 0) {
    return NextResponse.json(
      {
        error: 'Limite diário de requisições AI atingido',
        limits,
        upgradeMessage: 'Faça upgrade para PRO e ganhe 100 requisições/dia',
      },
      { status: 429 }
    );
  }

  // 4. Validar API Key do Gemini
  if (!env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY não configurada');
    return NextResponse.json(
      { error: 'Serviço de IA temporariamente indisponível' },
      { status: 503 }
    );
  }

  // 5. Parsear request body
  let body;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json(
      { error: 'JSON inválido no corpo da requisição' },
      { status: 400 }
    );
  }

  const { prompt, currentJson } = body;

  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json(
      { error: 'Campo "prompt" é obrigatório e deve ser uma string' },
      { status: 400 }
    );
  }

  // 6. Chamar Google Gemini
  let generatedJson: string;
  let aiError: string | null = null;

  try {
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

    const fullPrompt = `JSON ATUAL:\n${currentJson || '{}'}\n\nPEDIDO DO USUÁRIO: ${prompt}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    generatedJson = response.text.trim();

    // Limpar markdown se presente
    if (generatedJson.startsWith('```json')) {
      generatedJson = generatedJson.substring(7, generatedJson.length - 3).trim();
    } else if (generatedJson.startsWith('```')) {
      generatedJson = generatedJson.substring(3, generatedJson.length - 3).trim();
    }
  } catch (error) {
    console.error('Erro ao chamar Google Gemini:', error);
    aiError = error instanceof Error ? error.message : 'Erro desconhecido';

    // Salvar erro no banco
    await prisma.aIUsage.create({
      data: {
        userId: user.id,
        prompt,
        jsonBefore: currentJson || null,
        jsonAfter: null,
        model: 'gemini-2.5-flash',
        responseTime: Date.now() - startTime,
        wasSuccessful: false,
        wasAccepted: false,
        errorMessage: aiError,
        category: categorizeRequest(prompt, currentJson || ''),
      },
    });

    return NextResponse.json(
      { error: 'Erro ao gerar resposta da IA. Tente novamente.' },
      { status: 500 }
    );
  }

  // 7. Validar JSON gerado
  let parsedJson;
  try {
    parsedJson = JSON.parse(generatedJson);
  } catch (error) {
    aiError = 'IA retornou JSON inválido';

    await prisma.aIUsage.create({
      data: {
        userId: user.id,
        prompt,
        jsonBefore: currentJson || null,
        jsonAfter: generatedJson,
        model: 'gemini-2.5-flash',
        responseTime: Date.now() - startTime,
        wasSuccessful: false,
        wasAccepted: false,
        errorMessage: aiError,
        category: categorizeRequest(prompt, currentJson || ''),
      },
    });

    return NextResponse.json(
      { error: 'A IA retornou um JSON inválido. Tente reformular o pedido.' },
      { status: 422 }
    );
  }

  // 8. Validar estrutura UI-JSON com Zod
  const validation = validateUIJson(parsedJson);

  if (!validation.success) {
    aiError = `Validação falhou: ${validation.errors?.join(', ')}`;

    await prisma.aIUsage.create({
      data: {
        userId: user.id,
        prompt,
        jsonBefore: currentJson || null,
        jsonAfter: generatedJson,
        model: 'gemini-2.5-flash',
        responseTime: Date.now() - startTime,
        wasSuccessful: false,
        wasAccepted: false,
        errorMessage: aiError,
        category: categorizeRequest(prompt, currentJson || ''),
      },
    });

    return NextResponse.json(
      {
        error: 'JSON gerado não segue a estrutura UI-JSON esperada',
        validationErrors: validation.errors,
      },
      { status: 422 }
    );
  }

  // 9. Validar referências (telas, tabelas)
  const refValidation = validateReferences(validation.data);
  const warnings: string[] = [];

  if (refValidation.missingScreens.length > 0) {
    warnings.push(`Telas referenciadas mas não definidas: ${refValidation.missingScreens.join(', ')}`);
  }
  if (refValidation.missingTables.length > 0) {
    warnings.push(`Tabelas referenciadas mas não definidas: ${refValidation.missingTables.join(', ')}`);
  }

  // 10. Incrementar contador de uso
  await incrementAIUsage(user.id);

  // 11. Salvar uso bem-sucedido no banco
  const responseTime = Date.now() - startTime;

  const usageRecord = await prisma.aIUsage.create({
    data: {
      userId: user.id,
      prompt,
      jsonBefore: currentJson || null,
      jsonAfter: generatedJson,
      model: 'gemini-2.5-flash',
      responseTime,
      wasSuccessful: true,
      wasAccepted: false, // Será atualizado quando usuário aceitar
      errorMessage: null,
      category: categorizeRequest(prompt, currentJson || ''),
    },
  });

  // 12. Retornar sucesso
  const updatedLimits = await getAILimits(user.id, user.planTier);

  return NextResponse.json({
    success: true,
    usageId: usageRecord.id,
    json: generatedJson,
    prettyJson: JSON.stringify(parsedJson, null, 2),
    warnings: warnings.length > 0 ? warnings : undefined,
    metadata: {
      responseTime,
      model: 'gemini-2.5-flash',
      category: categorizeRequest(prompt, currentJson || ''),
    },
    limits: updatedLimits,
  });
}

/**
 * GET /api/ai/generate
 * Retorna limites de uso de AI do usuário
 */
export async function GET() {
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

  const limits = await getAILimits(user.id, user.planTier);

  return NextResponse.json({
    limits,
    planTier: user.planTier,
  });
}
