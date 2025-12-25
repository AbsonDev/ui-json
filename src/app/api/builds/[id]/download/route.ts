/**
 * API de Download de Builds
 * GET /api/builds/[id]/download - Faz download do AAB ou IPA
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const buildId = params.id;
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
        return NextResponse.json(
          { error: 'Build not found' },
          { status: 404 }
        );
      }
    }

    // Ler arquivo
    const file = await fs.readFile(filePath);

    // Retornar arquivo para download
    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': file.length.toString(),
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    );
  }
}
