/**
 * API de Download de Builds
 * GET /api/builds/[id]/download - Faz download do AAB ou IPA
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import logger, { logApiRequest, logApiResponse, logError } from '@/lib/logger';
import { getClientIdentifier, createRateLimitResponse } from '@/lib/rate-limit';

// Rate limiter for downloads - 10 downloads per hour per IP
const downloadRateLimiter = {
  check: (identifier: string) => {
    const rateLimiter = require('@/lib/rate-limit').default;
    return rateLimiter.check(identifier, 10, 60 * 60 * 1000); // 10 requests per hour
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const clientId = getClientIdentifier(request);

  try {
    // Rate limiting check
    const rateLimitResult = downloadRateLimiter.check(clientId);
    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded for download', {
        clientId,
        buildId: params.id,
        resetAt: new Date(rateLimitResult.resetAt).toISOString()
      });
      return createRateLimitResponse(rateLimitResult.resetAt);
    }

    const buildId = params.id;
    logApiRequest('GET', `/api/builds/${buildId}/download`, clientId);
    const buildsDir = path.join(process.cwd(), 'builds', 'downloads');

    // Procurar arquivo (AAB ou IPA)
    let filePath: string | null = null;
    let filename: string | null = null;
    let contentType: string | null = null;

    const aabPath = path.join(buildsDir, `${buildId}.aab`);
    const ipaPath = path.join(buildsDir, `${buildId}.ipa`);

    try {
      await fs.access(aabPath);
      filePath = aabPath;
      filename = `${buildId}.aab`;
      contentType = 'application/octet-stream';
    } catch {
      try {
        await fs.access(ipaPath);
        filePath = ipaPath;
        filename = `${buildId}.ipa`;
        contentType = 'application/octet-stream';
      } catch {
        logger.warn('Build file not found', { buildId, clientId });
        const duration = Date.now() - startTime;
        logApiResponse('GET', `/api/builds/${buildId}/download`, 404, duration);
        return NextResponse.json(
          { error: 'Build not found' },
          { status: 404 }
        );
      }
    }

    // Ler arquivo
    const file = await fs.readFile(filePath);

    logger.info('Build file downloaded', {
      buildId,
      filename,
      fileSize: file.length,
      clientId
    });

    const duration = Date.now() - startTime;
    logApiResponse('GET', `/api/builds/${buildId}/download`, 200, duration);

    // Retornar arquivo para download
    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': file.length.toString(),
      },
    });

  } catch (error) {
    logError(error instanceof Error ? error : new Error('Download failed'), {
      buildId: params.id,
      clientId
    });

    const duration = Date.now() - startTime;
    logApiResponse('GET', `/api/builds/${params.id}/download`, 500, duration);

    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    );
  }
}
