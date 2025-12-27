import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/config'
import { getTrialEmail } from '@/lib/email/templates'
import { trackEvent } from '@/lib/analytics/config'
import { env } from '@/lib/env'
import logger, { logSecurityEvent } from '@/lib/logger'

/**
 * Cron Job: Send Trial Nurture Emails
 *
 * This endpoint should be called daily by a cron service (Vercel Cron, GitHub Actions, etc.)
 * It finds users in trial and sends appropriate emails based on trial day
 *
 * Schedule: Run daily at 10:00 AM UTC
 *
 * Setup:
 * - Vercel: Add to vercel.json
 * - Manual: Call this endpoint daily via cron/scheduler
 */

export async function GET(req: NextRequest) {
  // Verify authorization
  const authHeader = req.headers.get('authorization')
  const expectedAuth = `Bearer ${env.CRON_SECRET}`

  if (authHeader !== expectedAuth) {
    logSecurityEvent('Unauthorized cron job access attempt', {
      endpoint: '/api/cron/trial-emails',
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
    })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  logger.info('Running trial email cron job')

  try {
    // Calculate start of month for usage metrics
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // Find all users currently in trial
    const trialingUsers = await prisma.subscription.findMany({
      where: {
        status: 'TRIALING',
        trialStart: { not: null },
        trialEnd: { not: null },
      },
      include: {
        user: {
          include: {
            apps: true,
            usageMetrics: {
              where: {
                createdAt: { gte: startOfMonth }
              }
            }
          }
        }
      }
    })

    const results = {
      checked: trialingUsers.length,
      sent: 0,
      skipped: 0,
      errors: 0,
    }

    for (const subscription of trialingUsers) {
      try {
        const user = subscription.user
        const trialStart = subscription.trialStart!
        const trialEnd = subscription.trialEnd!

        // Calculate days since trial started
        const daysSinceTrial = Math.floor(
          (Date.now() - trialStart.getTime()) / (1000 * 60 * 60 * 24)
        )

        // Skip if outside email schedule
        const emailDays = [1, 4, 8, 11, 14]
        if (!emailDays.includes(daysSinceTrial)) {
          results.skipped++
          continue
        }

        // Check if email already sent for this day
        const existingEmail = await prisma.emailLog.findFirst({
          where: {
            userId: user.id,
            emailType: `trial_day_${daysSinceTrial}`,
            sentAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        })

        if (existingEmail) {
          logger.debug('Skipping user - email already sent', { userId: user.id, email: user.email })
          results.skipped++
          continue
        }

        // Get usage stats (already loaded with include)
        const usageMetrics = user.usageMetrics
        const appsCreated = user.apps.length
        const exportsCreated = usageMetrics.filter(m => m.metricType === 'EXPORT').length
        const aiRequestsUsed = usageMetrics.filter(m => m.metricType === 'AI_REQUEST').length

        // Generate email
        const emailData = getTrialEmail(daysSinceTrial, {
          userName: user.name || 'there',
          planTier: subscription.planTier,
          appsCreated,
          exportsCreated,
          aiRequestsUsed,
          trialEndsAt: trialEnd.toLocaleDateString('pt-BR'),
        })

        if (!emailData) {
          results.skipped++
          continue
        }

        // Send email
        const result = await sendEmail({
          to: user.email,
          subject: emailData.subject,
          html: emailData.html,
        })

        if (result.success) {
          // Log email sent
          await prisma.emailLog.create({
            data: {
              userId: user.id,
              emailType: `trial_day_${daysSinceTrial}`,
              subject: emailData.subject,
              sentAt: new Date(),
            }
          })

          // Track in analytics
          trackEvent('Email_Sent', {
            userId: user.id,
            emailType: `trial_day_${daysSinceTrial}`,
            trialDay: daysSinceTrial,
          })

          logger.info('Sent trial email', {
            userId: user.id,
            email: user.email,
            trialDay: daysSinceTrial,
          })
          results.sent++
        } else {
          logger.error('Failed to send trial email', {
            userId: user.id,
            email: user.email,
            error: result.error,
          })
          results.errors++
        }

      } catch (error) {
        logger.error('Error processing user in trial email cron', {
          error: error instanceof Error ? error.message : String(error),
        })
        results.errors++
      }
    }

    logger.info('Trial email cron job completed', results)

    return NextResponse.json({
      success: true,
      results,
    })

  } catch (error) {
    logger.error('Trial email cron job failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    )
  }
}
