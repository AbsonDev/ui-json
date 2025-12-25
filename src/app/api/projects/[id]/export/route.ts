/**
 * API de Export Mobile
 * POST /api/projects/[id]/export - Solicita build AAB ou IPA
 * GET /api/projects/[id]/export - Lista builds do projeto
 */

import { NextRequest, NextResponse } from 'next/server';
import { mobileBuilder } from '@/lib/mobile-builder/MobileBuilder';
import type { BuildRequest, Platform, BuildType } from '@/lib/mobile-builder/types';

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

    // Processar build (em produção, isto deveria ser uma fila/job)
    const result = await mobileBuilder.buildProject(buildRequest, {
      includeAssets: true,
      minify: buildType === 'release',
      signing: buildType === 'release' ? signing : undefined,
    });

    return NextResponse.json(result);

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

    // Listar builds do projeto
    const builds = await mobileBuilder.listBuilds(projectId);

    return NextResponse.json({ builds });

  } catch (error) {
    console.error('List builds error:', error);
    return NextResponse.json(
      { error: 'Failed to list builds' },
      { status: 500 }
    );
  }
}
