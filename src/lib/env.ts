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

  // AI Assistant (Google Gemini) - Optional
  GEMINI_API_KEY: z
    .string()
    .min(10, 'GEMINI_API_KEY must be at least 10 characters')
    .optional(),

  // Node Environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
})

/**
 * Validated and typed environment variables
 * Use this instead of process.env for type safety
 */
export const env = envSchema.parse(process.env)

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
      console.error('  GEMINI_API_KEY: Google Gemini API key (optional)')

      console.error('\n🔧 Generate secrets with:')
      console.error('  openssl rand -base64 32')
      console.error('  openssl rand -base64 32 | cut -c1-32  # For ENCRYPTION_KEY')

      throw new Error('Environment validation failed. Check the errors above.')
    }
    throw error
  }
}

// Auto-validate in non-test environments
if (process.env.NODE_ENV !== 'test') {
  validateEnv()
}
