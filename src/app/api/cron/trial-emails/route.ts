import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/config'
import { getTrialEmail } from '@/lib/email/templates'
import { trackEvent } from '@/lib/analytics/config'

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

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-here'

export async function GET(req: NextRequest) {
  // Verify authorization
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('🔄 Running trial email cron job...')

  try {
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
          console.log(`⏭️  Skipping user ${user.email} - email already sent`)
          results.skipped++
          continue
        }

        // Get usage stats
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const usageMetrics = await prisma.usageMetric.findMany({
          where: {
            userId: user.id,
            createdAt: { gte: startOfMonth }
          }
        })

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

          console.log(`✅ Sent trial day ${daysSinceTrial} email to ${user.email}`)
          results.sent++
        } else {
          console.error(`❌ Failed to send email to ${user.email}:`, result.error)
          results.errors++
        }

      } catch (error) {
        console.error(`❌ Error processing user:`, error)
        results.errors++
      }
    }

    console.log('✅ Trial email cron job completed:', results)

    return NextResponse.json({
      success: true,
      results,
    })

  } catch (error) {
    console.error('❌ Trial email cron job failed:', error)
    return NextResponse.json(
      { error: 'Cron job failed', details: error },
      { status: 500 }
    )
  }
}
