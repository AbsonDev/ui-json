import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Health Check Endpoint
 * GET /api/health
 *
 * Returns the health status of the application and its dependencies
 */
export async function GET() {
  const startTime = Date.now();

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '0.1.0',
    checks: {
      database: {
        status: 'unknown',
        responseTime: 0,
        error: null as string | null,
      },
      memory: {
        status: 'healthy',
        usage: process.memoryUsage(),
        heapUsedPercentage: 0,
      },
    },
  };

  // Check database connection
  try {
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbEndTime = Date.now();

    health.checks.database = {
      status: 'healthy',
      responseTime: dbEndTime - dbStartTime,
      error: null,
    };
  } catch (error) {
    health.status = 'unhealthy';
    health.checks.database = {
      status: 'unhealthy',
      responseTime: 0,
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const heapUsedPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;

  health.checks.memory = {
    status: heapUsedPercentage > 90 ? 'warning' : 'healthy',
    usage: memUsage,
    heapUsedPercentage: Math.round(heapUsedPercentage * 100) / 100,
  };

  // Overall health status
  if (health.checks.database.status === 'unhealthy') {
    health.status = 'unhealthy';
  } else if (health.checks.memory.status === 'warning') {
    health.status = 'degraded';
  }

  const responseTime = Date.now() - startTime;

  return NextResponse.json({
    ...health,
    responseTime,
  }, {
    status: health.status === 'unhealthy' ? 503 : 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

/**
 * HEAD /api/health
 * Lightweight health check (no body)
 */
export async function HEAD() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
