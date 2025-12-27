#!/usr/bin/env tsx
/**
 * Environment Validation Script
 * Validates all required environment variables before deployment
 */

interface EnvCheck {
  name: string;
  required: boolean;
  pattern?: RegExp;
  minLength?: number;
  description: string;
}

const envChecks: EnvCheck[] = [
  // Database
  { name: 'DATABASE_URL', required: true, pattern: /^postgresql:\/\//, description: 'PostgreSQL connection string' },
  
  // NextAuth
  { name: 'NEXTAUTH_URL', required: true, pattern: /^https?:\/\//, description: 'Application URL' },
  { name: 'NEXTAUTH_SECRET', required: true, minLength: 32, description: 'NextAuth secret key' },
  
  // Encryption
  { name: 'ENCRYPTION_KEY', required: true, minLength: 32, description: 'Encryption key for database credentials' },
  
  // AI
  { name: 'GEMINI_API_KEY', required: true, description: 'Google Gemini API key' },
  
  // Stripe
  { name: 'STRIPE_SECRET_KEY', required: true, pattern: /^sk_(test|live)_/, description: 'Stripe secret key' },
  { name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', required: true, pattern: /^pk_(test|live)_/, description: 'Stripe publishable key' },
  { name: 'STRIPE_WEBHOOK_SECRET', required: true, pattern: /^whsec_/, description: 'Stripe webhook secret' },
  { name: 'STRIPE_PRICE_PRO_MONTHLY', required: true, pattern: /^price_/, description: 'Stripe PRO monthly price ID' },
  { name: 'STRIPE_PRICE_PRO_YEARLY', required: true, pattern: /^price_/, description: 'Stripe PRO yearly price ID' },
  { name: 'STRIPE_PRICE_TEAM_MONTHLY', required: true, pattern: /^price_/, description: 'Stripe TEAM monthly price ID' },
  { name: 'STRIPE_PRICE_TEAM_YEARLY', required: true, pattern: /^price_/, description: 'Stripe TEAM yearly price ID' },
  
  // Email
  { name: 'RESEND_API_KEY', required: true, pattern: /^re_/, description: 'Resend API key' },
  
  // Cron
  { name: 'CRON_SECRET', required: true, minLength: 32, description: 'Cron job authentication secret' },
  
  // Redis (required in production)
  { name: 'UPSTASH_REDIS_REST_URL', required: true, pattern: /^https:\/\//, description: 'Upstash Redis REST URL' },
  { name: 'UPSTASH_REDIS_REST_TOKEN', required: true, description: 'Upstash Redis REST token' },
  
  // Analytics
  { name: 'NEXT_PUBLIC_MIXPANEL_TOKEN', required: true, description: 'Mixpanel project token' },
  
  // Monitoring (optional but recommended)
  { name: 'SENTRY_DSN', required: false, pattern: /^https:\/\//, description: 'Sentry DSN' },
  { name: 'NEXT_PUBLIC_SENTRY_DSN', required: false, pattern: /^https:\/\//, description: 'Sentry public DSN' },
];

function validateEnv(): boolean {
  console.log('🔍 Validating environment variables...\n');
  
  let hasErrors = false;
  let warnings = 0;

  for (const check of envChecks) {
    const value = process.env[check.name];
    
    // Check if required
    if (check.required && !value) {
      console.error(`❌ ${check.name} - MISSING (required)`);
      console.error(`   ${check.description}`);
      hasErrors = true;
      continue;
    }
    
    // Optional and not set
    if (!check.required && !value) {
      console.warn(`⚠️  ${check.name} - Not set (optional)`);
      console.warn(`   ${check.description}`);
      warnings++;
      continue;
    }
    
    // Validate pattern
    if (value && check.pattern && !check.pattern.test(value)) {
      console.error(`❌ ${check.name} - INVALID FORMAT`);
      console.error(`   Expected pattern: ${check.pattern}`);
      hasErrors = true;
      continue;
    }
    
    // Validate length
    if (value && check.minLength && value.length < check.minLength) {
      console.error(`❌ ${check.name} - TOO SHORT`);
      console.error(`   Expected minimum ${check.minLength} characters, got ${value.length}`);
      hasErrors = true;
      continue;
    }
    
    // Valid
    console.log(`✅ ${check.name}`);
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (hasErrors) {
    console.error(`\n❌ Validation FAILED with errors`);
    console.error(`\nFix the errors above before deploying to production.`);
    return false;
  }
  
  if (warnings > 0) {
    console.warn(`\n⚠️  Validation PASSED with ${warnings} warnings`);
    console.warn(`\nConsider setting optional variables for better monitoring.`);
  } else {
    console.log(`\n✅ Validation PASSED - All required variables are set correctly!`);
  }
  
  return true;
}

// Run validation
const isValid = validateEnv();
process.exit(isValid ? 0 : 1);
