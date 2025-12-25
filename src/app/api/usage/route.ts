import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/usage
 * Returns user's current usage stats
 */
export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        apps: true,
        planConfig: true,
      }
    })

    if (!user || !user.planConfig) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get current month's usage
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const usageMetrics = await prisma.usageMetric.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: startOfMonth }
      }
    })

    // Count exports this month
    const exportsCount = usageMetrics.filter(m => m.metricType === 'EXPORT').length

    // Count builds this month
    const buildsCount = usageMetrics.filter(m => m.metricType === 'BUILD').length

    // Count apps
    const appsCount = user.apps.length

    return NextResponse.json({
      apps: {
        current: appsCount,
        limit: user.planConfig.maxApps,
      },
      exports: {
        current: exportsCount,
        limit: user.planConfig.maxExports,
      },
      builds: {
        current: buildsCount,
        limit: user.planConfig.maxBuilds,
      },
    })
  } catch (error) {
    console.error('Failed to fetch usage:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    )
  }
}
