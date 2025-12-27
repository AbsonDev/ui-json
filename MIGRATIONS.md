# Database Migration Strategy

This document outlines the proper way to handle database migrations in production.

## ⚠️ CRITICAL: Never use `db:push` in Production

**ALWAYS** use `prisma migrate deploy` in production environments.

### Why?

- `db:push` doesn't track migration history
- No rollback capability
- Can cause data loss
- Not designed for production use

### Correct Commands

```bash
# ❌ WRONG - Never in production
npm run db:push

# ✅ CORRECT - Always in production
npm run db:migrate
# or
npx prisma migrate deploy
```

---

## Migration Workflow

### 1. Development Phase

When making schema changes in development:

```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name descriptive_migration_name

# This will:
# - Create a new migration file
# - Apply it to your dev database
# - Regenerate Prisma Client
```

### 2. Testing Phase

Test migrations on a staging database:

```bash
# Apply migrations
npx prisma migrate deploy

# Verify database state
npx prisma db pull

# Run application tests
npm test
```

### 3. Production Deployment

**Pre-deployment checklist:**
- [ ] All migrations tested on staging
- [ ] Database backup created
- [ ] Rollback plan prepared
- [ ] Migration is backward-compatible (if possible)

**Deployment steps:**

```bash
# 1. Backup database (automated or manual)
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M).sql

# 2. Apply migrations
npx prisma migrate deploy

# 3. Verify migration succeeded
npx prisma migrate status

# 4. If failed, rollback (see Rollback section)
```

---

## Migration Best Practices

### 1. Backward Compatible Migrations

Prefer migrations that don't break existing code:

✅ **Safe:**
- Adding new optional fields
- Adding new tables
- Adding indexes
- Adding constraints (with care)

⚠️ **Careful:**
- Renaming fields (requires code changes)
- Changing field types
- Adding required fields (need defaults)

❌ **Dangerous:**
- Dropping fields still in use
- Dropping tables
- Changing unique constraints
- Removing indexes under load

### 2. Multi-Step Migrations

For breaking changes, use multi-step deployments:

**Example: Renaming a field**

```
Step 1: Add new field
Step 2: Deploy code that writes to both fields
Step 3: Backfill data
Step 4: Deploy code that reads from new field
Step 5: Remove old field
```

### 3. Data Migrations

For data transformations, create a separate migration:

```sql
-- migrations/20250101_backfill_email_verified.sql
UPDATE users
SET email_verified = true
WHERE email_verified_at IS NOT NULL;
```

Run manually after schema migration:

```bash
psql $DATABASE_URL < migrations/20250101_backfill_email_verified.sql
```

---

## Adding System Configurations

After deploying the SystemConfig model:

```bash
# Run initialization script
npm run db:init-config

# Or manually via Node.js
node -e "require('./src/lib/config').initializeDefaultConfigs()"
```

---

## Adding Database Constraints

After Prisma migrations, apply custom constraints:

```bash
# Apply constraints
psql $DATABASE_URL < prisma/migrations/add_constraints.sql

# Verify constraints were added
psql $DATABASE_URL -c "\d+ invoices"
```

---

## Rollback Procedure

### Automatic Rollback (Recommended)

Use database snapshots/backups:

```bash
# Restore from backup
pg_restore -d $DATABASE_URL backup-20250101-1200.dump
```

### Manual Rollback

If snapshot isn't available:

```bash
# 1. Mark migration as rolled back
npx prisma migrate resolve --rolled-back <migration_name>

# 2. Manually write reverse migration
# Create: migrations/rollback_<migration_name>.sql

# 3. Apply reverse migration
psql $DATABASE_URL < migrations/rollback_<migration_name>.sql

# 4. Update migration history
npx prisma migrate resolve --applied <previous_migration>
```

---

## Monitoring Migrations

### Check Migration Status

```bash
# See applied migrations
npx prisma migrate status

# Output:
# Database schema is up to date!
# ✓ 10 migrations applied
```

### Track Migration Performance

Monitor migration execution time:

```bash
time npx prisma migrate deploy
```

Expected times:
- Simple migrations: < 5 seconds
- Adding indexes: 10-60 seconds (depends on data)
- Data migrations: varies (test on staging first)

---

## Common Issues

### Issue: Migration Fails Midway

**Symptoms:**
```
Error: Migration failed to apply cleanly
```

**Solution:**
1. Check migration logs
2. Restore from backup
3. Fix migration SQL
4. Reapply

### Issue: Schema Drift Detected

**Symptoms:**
```
Your database schema is not in sync with your migration history
```

**Solution:**
```bash
# In development only
npx prisma migrate reset

# In production - investigate and fix manually
npx prisma migrate resolve --help
```

### Issue: Long-Running Migration

**Symptoms:**
Migration takes too long, locks tables

**Prevention:**
- Create indexes `CONCURRENTLY`
- Add constraints with minimal locking
- Run data migrations separately
- Use connection pooling

**Example: Safe index creation**
```sql
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
```

---

## Migration Scripts (package.json)

```json
{
  "scripts": {
    "db:migrate": "prisma migrate deploy",
    "db:migrate:dev": "prisma migrate dev",
    "db:status": "prisma migrate status",
    "db:generate": "prisma generate",
    "db:seed": "tsx prisma/seed.ts",
    "db:init-config": "tsx -r dotenv/config scripts/init-config.ts",
    "db:backup": "scripts/backup-db.sh"
  }
}
```

---

## Emergency Contacts

- Database Provider Support: [Your Provider]
- DBA On-Call: [Contact]
- Platform Team: [Contact]

---

**Last Updated:** 2025-12-27
