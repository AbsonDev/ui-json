import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/ai/feedback
 * Registra feedback do usuário sobre sugestão da IA
 *
 * Body:
 * {
 *   "usageId": "cuid",
 *   "accepted": true,
 *   "feedback": "opcional comentário"
 * }
 */
export async function POST(req: NextRequest) {
  // 1. Autenticação
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // 2. Buscar usuário
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
  }

  // 3. Parsear body
  let body;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { usageId, accepted, feedback } = body;

  if (!usageId || typeof accepted !== 'boolean') {
    return NextResponse.json(
      { error: 'Campos "usageId" e "accepted" são obrigatórios' },
      { status: 400 }
    );
  }

  // 4. Verificar se o registro de uso existe e pertence ao usuário
  const aiUsage = await prisma.aIUsage.findUnique({
    where: { id: usageId },
  });

  if (!aiUsage) {
    return NextResponse.json({ error: 'Registro de uso não encontrado' }, { status: 404 });
  }

  if (aiUsage.userId !== user.id) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  // 5. Atualizar registro com feedback
  await prisma.aIUsage.update({
    where: { id: usageId },
    data: {
      wasAccepted: accepted,
    },
  });

  return NextResponse.json({
    success: true,
    message: 'Feedback registrado com sucesso',
  });
}
