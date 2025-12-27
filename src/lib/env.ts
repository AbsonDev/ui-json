import { z } from 'zod'

/**
 * Environment variables schema with strict validation
 * This ensures all required env vars are set before the app starts
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z
    .string()
    .url('DATABASE_URL must be a valid PostgreSQL connection URL')
    .startsWith('postgresql://', 'DATABASE_URL must be a PostgreSQL URL'),

  // NextAuth
  NEXTAUTH_URL: z
    .string()
    .url('NEXTAUTH_URL must be a valid URL'),

  NEXTAUTH_SECRET: z
    .string()
    .min(32, 'NEXTAUTH_SECRET must be at least 32 characters for security'),

  // Encryption (for database credentials)
  ENCRYPTION_KEY: z
    .string()
    .length(32, 'ENCRYPTION_KEY must be exactly 32 characters for AES-256'),

  // AI Assistant (Google Gemini)
  GEMINI_API_KEY: z
    .string()
    .min(10, 'GEMINI_API_KEY must be at least 10 characters'),

  // Stripe Payment
  STRIPE_SECRET_KEY: z
    .string()
    .startsWith('sk_', 'STRIPE_SECRET_KEY must start with sk_'),

  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .startsWith('pk_', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_'),

  STRIPE_WEBHOOK_SECRET: z
    .string()
    .startsWith('whsec_', 'STRIPE_WEBHOOK_SECRET must start with whsec_'),

  // Stripe Price IDs
  STRIPE_PRICE_PRO_MONTHLY: z
    .string()
    .startsWith('price_', 'STRIPE_PRICE_PRO_MONTHLY must start with price_'),

  STRIPE_PRICE_PRO_YEARLY: z
    .string()
    .startsWith('price_', 'STRIPE_PRICE_PRO_YEARLY must start with price_'),

  STRIPE_PRICE_TEAM_MONTHLY: z
    .string()
    .startsWith('price_', 'STRIPE_PRICE_TEAM_MONTHLY must start with price_'),

  STRIPE_PRICE_TEAM_YEARLY: z
    .string()
    .startsWith('price_', 'STRIPE_PRICE_TEAM_YEARLY must start with price_'),

  // Email Service - Resend
  RESEND_API_KEY: z
    .string()
    .startsWith('re_', 'RESEND_API_KEY must start with re_'),

  // Cron Job Secret
  CRON_SECRET: z
    .string()
    .min(32, 'CRON_SECRET must be at least 32 characters for security'),

  // Rate Limiting - Upstash Redis (Required in production)
  UPSTASH_REDIS_REST_URL: z
    .string()
    .url('UPSTASH_REDIS_REST_URL must be a valid URL')
    .optional()
    .refine(
      (val) => {
        const isProduction = process.env.NODE_ENV === 'production'
        return !isProduction || !!val
      },
      { message: 'UPSTASH_REDIS_REST_URL is required in production' }
    ),

  UPSTASH_REDIS_REST_TOKEN: z
    .string()
    .min(1, 'UPSTASH_REDIS_REST_TOKEN must not be empty')
    .optional()
    .refine(
      (val) => {
        const isProduction = process.env.NODE_ENV === 'production'
        return !isProduction || !!val
      },
      { message: 'UPSTASH_REDIS_REST_TOKEN is required in production' }
    ),

  // Sentry Error Tracking (Optional but recommended for production)
  SENTRY_DSN: z
    .string()
    .url('SENTRY_DSN must be a valid URL')
    .optional(),

  NEXT_PUBLIC_SENTRY_DSN: z
    .string()
    .url('NEXT_PUBLIC_SENTRY_DSN must be a valid URL')
    .optional(),

  SENTRY_ORG: z
    .string()
    .optional(),

  SENTRY_PROJECT: z
    .string()
    .optional(),

  SENTRY_AUTH_TOKEN: z
    .string()
    .optional(),

  // Analytics - Mixpanel
  NEXT_PUBLIC_MIXPANEL_TOKEN: z
    .string()
    .min(10, 'NEXT_PUBLIC_MIXPANEL_TOKEN must be at least 10 characters'),

  // Node Environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
})

/**
 * Validated and typed environment variables
 * Use this instead of process.env for type safety
 *
 * Note: Validation is skipped if SKIP_ENV_VALIDATION is set (e.g., in CI/CD)
 */
export const env = process.env.SKIP_ENV_VALIDATION
  ? (process.env as z.infer<typeof envSchema>)
  : envSchema.parse(process.env)

/**
 * Type-safe environment variable access
 */
export type Env = z.infer<typeof envSchema>

/**
 * Validate environment variables and throw detailed errors if invalid
 * Call this at app startup to fail fast
 */
export function validateEnv(): void {
  try {
    envSchema.parse(process.env)
    console.log('✅ Environment variables validated successfully')
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:')
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })

      console.error('\n📝 Required environment variables:')
      console.error('  DATABASE_URL: PostgreSQL connection URL')
      console.error('  NEXTAUTH_URL: Application URL (e.g., http://localhost:3000)')
      console.error('  NEXTAUTH_SECRET: Random secret (min 32 chars)')
      console.error('  ENCRYPTION_KEY: Exactly 32 characters for AES-256')
      console.error('  GEMINI_API_KEY: Google Gemini API key')
      console.error('  STRIPE_SECRET_KEY: Stripe secret key')
      console.error('  STRIPE_WEBHOOK_SECRET: Stripe webhook secret')
      console.error('  STRIPE_PRICE_*: Stripe price IDs for plans')
      console.error('  RESEND_API_KEY: Resend API key for emails')
      console.error('  CRON_SECRET: Secret for cron job authentication')
      console.error('  UPSTASH_REDIS_*: Required in production for rate limiting')
      console.error('  NEXT_PUBLIC_MIXPANEL_TOKEN: Mixpanel analytics token')

      console.error('\n🔧 Generate secrets with:')
      console.error('  openssl rand -base64 32')
      console.error('  openssl rand -base64 32 | cut -c1-32  # For ENCRYPTION_KEY')

      console.error('\n📚 See .env.example for all required variables')

      throw new Error('Environment validation failed. Check the errors above.')
    }
    throw error
  }
}

// Auto-validate in non-test environments (unless explicitly skipped)
if (process.env.NODE_ENV !== 'test' && !process.env.SKIP_ENV_VALIDATION) {
  validateEnv()
}
