/**
 * API de Export Mobile
 * POST /api/projects/[id]/export - Solicita build AAB ou IPA
 * GET /api/projects/[id]/export - Lista builds do projeto
 */

import { NextRequest, NextResponse } from 'next/server';
import { mobileBuilder } from '@/lib/mobile-builder/MobileBuilder';
import type { BuildRequest, Platform, BuildType } from '@/lib/mobile-builder/types';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const body = await request.json();

    const { platform, buildType, config, signing } = body;

    // Validar parâmetros
    if (!platform || !['android', 'ios'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be "android" or "ios"' },
        { status: 400 }
      );
    }

    if (!buildType || !['debug', 'release'].includes(buildType)) {
      return NextResponse.json(
        { error: 'Invalid build type. Must be "debug" or "release"' },
        { status: 400 }
      );
    }

    // Validar configuração do projeto
    if (!config || !config.name || !config.bundleId) {
      return NextResponse.json(
        { error: 'Invalid project config. Required: name, bundleId' },
        { status: 400 }
      );
    }

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

      return NextResponse.json({
        ...result,
        buildId: buildRecord.id,
      });

    } catch (err) {
      // Atualizar build com erro
      await prisma.build.update({
        where: { id: buildRecord.id },
        data: {
          status: 'failed',
          error: err instanceof Error ? err.message : 'Build failed',
          completedAt: new Date(),
        },
      });

      throw err;
    }

  } catch (error) {
    console.error('Export error:', error);
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
  try {
    const projectId = params.id;

    // Listar builds do projeto do banco de dados
    const builds = await prisma.build.findMany({
      where: { appId: projectId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ builds });

  } catch (error) {
    console.error('List builds error:', error);
    return NextResponse.json(
      { error: 'Failed to list builds' },
      { status: 500 }
    );
  }
}
