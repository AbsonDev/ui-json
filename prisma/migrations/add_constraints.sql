-- Add database constraints for data integrity
-- This migration adds CHECK constraints that Prisma doesn't natively support

-- ============================================
-- Invoice Constraints
-- ============================================

-- Ensure invoice amount is positive
ALTER TABLE invoices
ADD CONSTRAINT check_invoice_amount_positive
CHECK (amount > 0);

-- ============================================
-- Subscription Constraints
-- ============================================

-- Ensure subscription amount is positive
ALTER TABLE subscriptions
ADD CONSTRAINT check_subscription_amount_positive
CHECK (amount > 0);

-- Ensure currentPeriodEnd is after currentPeriodStart
ALTER TABLE subscriptions
ADD CONSTRAINT check_subscription_period_valid
CHECK (current_period_end > current_period_start);

-- Ensure trialEnd is after trialStart (if both are set)
ALTER TABLE subscriptions
ADD CONSTRAINT check_trial_period_valid
CHECK (
  (trial_start IS NULL AND trial_end IS NULL) OR
  (trial_start IS NOT NULL AND trial_end IS NOT NULL AND trial_end > trial_start)
);

-- ============================================
-- UsageMetric Constraints
-- ============================================

-- Ensure all usage counts are non-negative
ALTER TABLE usage_metrics
ADD CONSTRAINT check_usage_counts_non_negative
CHECK (
  apps_count >= 0 AND
  builds_count >= 0 AND
  exports_count >= 0 AND
  templates_used_count >= 0 AND
  api_calls_count >= 0 AND
  storage_used_mb >= 0
);

-- Ensure periodEnd is after periodStart
ALTER TABLE usage_metrics
ADD CONSTRAINT check_usage_period_valid
CHECK (period_end > period_start);

-- ============================================
-- Build Constraints
-- ============================================

-- Ensure version code is positive
ALTER TABLE builds
ADD CONSTRAINT check_version_code_positive
CHECK (version_code > 0);

-- Ensure file size is positive (if set)
ALTER TABLE builds
ADD CONSTRAINT check_file_size_positive
CHECK (file_size IS NULL OR file_size > 0);

-- Ensure build duration is positive (if set)
ALTER TABLE builds
ADD CONSTRAINT check_build_duration_positive
CHECK (build_duration IS NULL OR build_duration > 0);

-- ============================================
-- AI Usage Constraints
-- ============================================

-- Ensure tokens used is non-negative
ALTER TABLE ai_usages
ADD CONSTRAINT check_tokens_non_negative
CHECK (tokens_used IS NULL OR tokens_used >= 0);

-- Ensure response time is positive
ALTER TABLE ai_usages
ADD CONSTRAINT check_response_time_positive
CHECK (response_time IS NULL OR response_time > 0);

-- Ensure tokens used for app AI is non-negative
ALTER TABLE app_ai_usages
ADD CONSTRAINT check_app_tokens_non_negative
CHECK (tokens_used >= 0);

-- Ensure response time for app AI is positive
ALTER TABLE app_ai_usages
ADD CONSTRAINT check_app_response_time_positive
CHECK (response_time > 0);

-- ============================================
-- AI Limit Constraints
-- ============================================

-- Ensure daily limit count is non-negative
ALTER TABLE ai_daily_limits
ADD CONSTRAINT check_daily_limit_non_negative
CHECK (daily_request_count >= 0);

-- Ensure max requests is positive
ALTER TABLE ai_daily_limits
ADD CONSTRAINT check_max_requests_positive
CHECK (max_daily_requests > 0 OR max_daily_requests = -1);

-- Ensure execution count is non-negative
ALTER TABLE ai_execution_limits
ADD CONSTRAINT check_execution_count_non_negative
CHECK (execution_count >= 0);

-- Ensure max executions is positive or unlimited
ALTER TABLE ai_execution_limits
ADD CONSTRAINT check_max_executions_valid
CHECK (max_executions > 0 OR max_executions = -1);

-- ============================================
-- PlanConfig Constraints
-- ============================================

-- Ensure plan limits are non-negative or unlimited (-1)
ALTER TABLE plan_configs
ADD CONSTRAINT check_plan_limits_valid
CHECK (
  (max_apps >= 0 OR max_apps = -1) AND
  (max_exports_per_month >= 0 OR max_exports_per_month = -1) AND
  (max_storage_mb >= 0 OR max_storage_mb = -1) AND
  (max_templates >= 0 OR max_templates = -1) AND
  (max_api_calls_per_month >= 0 OR max_api_calls_per_month = -1) AND
  (max_ai_requests_per_day >= 0 OR max_ai_requests_per_day = -1)
);

-- Ensure prices are non-negative
ALTER TABLE plan_configs
ADD CONSTRAINT check_plan_prices_non_negative
CHECK (
  (price_monthly IS NULL OR price_monthly >= 0) AND
  (price_yearly IS NULL OR price_yearly >= 0)
);

-- ============================================
-- User Constraints (additional)
-- ============================================

-- Ensure email is lowercase and valid format
-- Note: Basic check, real validation should be in application layer
ALTER TABLE users
ADD CONSTRAINT check_email_format
CHECK (email ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$');

COMMENT ON CONSTRAINT check_email_format ON users IS 'Basic email format validation';
COMMENT ON CONSTRAINT check_invoice_amount_positive ON invoices IS 'Invoices must have positive amounts';
COMMENT ON CONSTRAINT check_subscription_amount_positive ON subscriptions IS 'Subscriptions must have positive amounts';
COMMENT ON CONSTRAINT check_subscription_period_valid ON subscriptions IS 'Subscription period end must be after start';
