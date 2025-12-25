/**
 * API de Export Mobile
 * POST /api/projects/[id]/export - Solicita build AAB ou IPA
 * GET /api/projects/[id]/export - Lista builds do projeto
 */

import { NextRequest, NextResponse } from 'next/server';
import { mobileBuilder } from '@/lib/mobile-builder/MobileBuilder';
import type { BuildRequest, Platform, BuildType } from '@/lib/mobile-builder/types';
import { prisma } from '@/lib/prisma';
import logger, { logApiRequest, logApiResponse, logError, logUserAction } from '@/lib/logger';
import { getClientIdentifier, createRateLimitResponse } from '@/lib/rate-limit';

// Rate limiter for mobile builds - 3 builds per hour per IP
const buildRateLimiter = {
  check: (identifier: string) => {
    const rateLimiter = require('@/lib/rate-limit').default;
    return rateLimiter.check(identifier, 3, 60 * 60 * 1000); // 3 requests per hour
  }
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const clientId = getClientIdentifier(request);

  try {
    // Rate limiting check
    const rateLimitResult = buildRateLimiter.check(clientId);
    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded for mobile build', {
        clientId,
        projectId: params.id,
        resetAt: new Date(rateLimitResult.resetAt).toISOString()
      });
      return createRateLimitResponse(rateLimitResult.resetAt);
    }

    const projectId = params.id;
    logApiRequest('POST', `/api/projects/${projectId}/export`, clientId);

    const body = await request.json();

    const { platform, buildType, config, signing } = body;

    // Validar parâmetros
    if (!platform || !['android', 'ios'].includes(platform)) {
      logger.warn('Invalid platform parameter', { platform, projectId, clientId });
      return NextResponse.json(
        { error: 'Invalid platform. Must be "android" or "ios"' },
        { status: 400 }
      );
    }

    if (!buildType || !['debug', 'release'].includes(buildType)) {
      logger.warn('Invalid build type parameter', { buildType, projectId, clientId });
      return NextResponse.json(
        { error: 'Invalid build type. Must be "debug" or "release"' },
        { status: 400 }
      );
    }

    // Validar configuração do projeto
    if (!config || !config.name || !config.bundleId) {
      logger.warn('Invalid project config', { config, projectId, clientId });
      return NextResponse.json(
        { error: 'Invalid project config. Required: name, bundleId' },
        { status: 400 }
      );
    }

    logger.info('Starting mobile build', {
      projectId,
      platform,
      buildType,
      bundleId: config.bundleId,
      clientId
    });

    // Criar registro do build no banco
    const buildRecord = await prisma.build.create({
      data: {
        appId: projectId,
        platform: platform as Platform,
        buildType: buildType as BuildType,
        status: 'pending',
        bundleId: config.bundleId,
        appVersion: config.version || '1.0.0',
        versionCode: config.versionCode || 1,
        appName: config.name,
      },
    });

    // Criar requisição de build
    const buildRequest: BuildRequest = {
      projectId,
      platform: platform as Platform,
      buildType: buildType as BuildType,
      config: {
        id: projectId,
        name: config.name,
        bundleId: config.bundleId,
        version: config.version || '1.0.0',
        versionCode: config.versionCode || 1,
        description: config.description,
        author: config.author,
        icon: config.icon,
        splashScreen: config.splashScreen,
      },
    };

    // Inicializar builder
    await mobileBuilder.initialize();

    // Atualizar status para building
    await prisma.build.update({
      where: { id: buildRecord.id },
      data: { status: 'building' },
    });

    const startTime = Date.now();

    try {
      // Processar build (em produção, isto deveria ser uma fila/job)
      const result = await mobileBuilder.buildProject(buildRequest, {
        includeAssets: true,
        minify: buildType === 'release',
        signing: buildType === 'release' ? signing : undefined,
      });

      const buildDuration = Math.floor((Date.now() - startTime) / 1000);

      // Atualizar build com resultado
      await prisma.build.update({
        where: { id: buildRecord.id },
        data: {
          status: result.status,
          downloadUrl: result.downloadUrl,
          error: result.error,
          buildDuration,
          completedAt: result.completedAt,
        },
      });

      logger.info('Mobile build completed successfully', {
        projectId,
        buildId: buildRecord.id,
        platform,
        buildType,
        duration: buildDuration,
        status: result.status
      });

      const totalDuration = Date.now() - startTime;
      logApiResponse('POST', `/api/projects/${projectId}/export`, 200, totalDuration);

      return NextResponse.json({
        ...result,
        buildId: buildRecord.id,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Build failed';

      // Atualizar build com erro
      await prisma.build.update({
        where: { id: buildRecord.id },
        data: {
          status: 'failed',
          error: errorMessage,
          completedAt: new Date(),
        },
      });

      logger.error('Mobile build failed', {
        projectId,
        buildId: buildRecord.id,
        platform,
        buildType,
        error: errorMessage,
        stack: err instanceof Error ? err.stack : undefined
      });

      throw err;
    }

  } catch (error) {
    logError(error instanceof Error ? error : new Error('Export failed'), {
      projectId: params.id,
      clientId
    });

    const totalDuration = Date.now() - startTime;
    logApiResponse('POST', `/api/projects/${params.id}/export`, 500, totalDuration);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const clientId = getClientIdentifier(request);

  try {
    const projectId = params.id;
    logApiRequest('GET', `/api/projects/${projectId}/export`, clientId);

    // Listar builds do projeto do banco de dados
    const builds = await prisma.build.findMany({
      where: { appId: projectId },
      orderBy: { createdAt: 'desc' },
    });

    logger.info('Listed project builds', {
      projectId,
      buildCount: builds.length,
      clientId
    });

    const duration = Date.now() - startTime;
    logApiResponse('GET', `/api/projects/${projectId}/export`, 200, duration);

    return NextResponse.json({ builds });

  } catch (error) {
    logError(error instanceof Error ? error : new Error('Failed to list builds'), {
      projectId: params.id,
      clientId
    });

    const duration = Date.now() - startTime;
    logApiResponse('GET', `/api/projects/${params.id}/export`, 500, duration);

    return NextResponse.json(
      { error: 'Failed to list builds' },
      { status: 500 }
    );
  }
}
