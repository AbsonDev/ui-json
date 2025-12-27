/**
 * Email Service Configuration - Resend
 *
 * IMPORTANT: Add to .env.local:
 * RESEND_API_KEY=re_your_api_key_here
 */

import { Resend } from 'resend'
import logger, { logError } from '../logger'

export const resend = new Resend(process.env.RESEND_API_KEY)

export const EMAIL_FROM = 'UI-JSON <onboarding@uijson.com>'
export const EMAIL_REPLY_TO = 'support@uijson.com'

/**
 * Send email with Resend
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = EMAIL_FROM,
  replyTo = EMAIL_REPLY_TO,
}: {
  to: string
  subject: string
  html: string
  from?: string
  replyTo?: string
}) {
  if (!process.env.RESEND_API_KEY) {
    logger.warn('⚠️ RESEND_API_KEY not configured. Email not sent.')
    logger.info(`Would send email to: ${to}`)
    logger.info(`Subject: ${subject}`)
    return { success: false, error: 'Email not configured' }
  }

  try {
    const data = await resend.emails.send({
      from,
      to,
      subject,
      html,
      replyTo,
    })

    logger.info(`✉️ Email sent to ${to}: ${subject}`)
    return { success: true, data }
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Failed to send email'))
    return { success: false, error }
  }
}
