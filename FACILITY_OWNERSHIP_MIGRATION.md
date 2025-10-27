# Facility Ownership Migration Guide

## Overview

This guide explains how to assign `gpUserId` to existing facilities to enable multi-tenant security. **This migration MUST be completed before deploying to production with multi-tenant GP access.**

## Why This Migration is Required

The AlphaNAV platform implements strict multi-tenant security for GP users. Each facility must have a `gpUserId` field that identifies which GP user owns that facility. Without this assignment:

- GP users cannot access any facilities
- Draw requests, cash flows, and covenant monitoring will fail with 403 errors
- Legal document generation will be blocked

## Migration Options

### Option 1: Quick Development Migration (Recommended for Dev/Test)

Automatically assigns ALL unassigned facilities to the first GP user found in the system.

**When to use:**
- Development environment
- Testing environment
- Single-tenant deployments
- Quick setup for demo purposes

**Command:**
```bash
tsx server/migrations/dev-assign-facilities.ts
```

**What it does:**
1. Finds the first GP user in the system
2. Assigns all facilities without `gpUserId` to that user
3. Displays confirmation of assignments

**Example output:**
```
🔧 Development Facility Migration

Found 5 facilities without ownership
Assigning all to: John Smith (abc-123-def)

✓ Successfully assigned 5 facilities:

   1. Acme Capital Fund III (facility-001)
   2. Beta Equity Partners (facility-002)
   3. Gamma Ventures LP (facility-003)
   4. Delta Growth Fund (facility-004)
   5. Epsilon Investment Fund (facility-005)

✅ Migration complete!
```

### Option 2: Interactive Migration (Recommended for Production)

Provides full control over facility assignments with interactive prompts.

**When to use:**
- Production environment
- Multi-tenant deployments
- When different facilities should belong to different GPs
- When you need audit trail and manual review

**Command:**
```bash
tsx server/migrations/assign-facility-ownership.ts
```

**Features:**
- Lists all unassigned facilities with details
- Shows all available GP users
- Two modes:
  - **Bulk assignment:** Assign all facilities to one GP
  - **Individual assignment:** Assign each facility to specific GPs

**Example interaction:**
```
╔══════════════════════════════════════════════════════════╗
║    Facility Ownership Migration Tool                    ║
║    Assign GP users to facilities for multi-tenant       ║
╚══════════════════════════════════════════════════════════╝

⚠️  Found 5 facilities without GP ownership:

1. Acme Capital Fund III
   ID: facility-001
   Principal: $50,000,000
   Status: active
   Origination: 2025-01-15

[... more facilities ...]

Available GP Users (3):

1. John Smith
   ID: user-abc-123
   Email: john.smith@example.com

2. Jane Doe
   ID: user-def-456
   Email: jane.doe@example.com

[... more users ...]

Migration Options:
1. Assign ALL facilities to a single GP (for development/testing)
2. Assign facilities individually (for production)
3. Exit without changes

Select an option (1-3):
```

### Option 3: SQL Migration (For Database Administrators)

Generates SQL commands for manual execution in database tools.

**When to use:**
- Need to review SQL before execution
- External database management tools
- Audit requirements for production changes
- Multi-step approval process

**Command:**
```bash
tsx server/migrations/assign-facility-ownership.ts --sql
```

**Example output:**
```
╔══════════════════════════════════════════════════════════╗
║    SQL Migration Commands                                ║
╚══════════════════════════════════════════════════════════╝

-- Copy and execute these SQL commands in your database:

-- Available GP Users:
-- John Smith: user-abc-123
-- Jane Doe: user-def-456

-- Facilities needing assignment:

-- Acme Capital Fund III ($50,000,000)
UPDATE facilities SET gp_user_id = '[GP_USER_ID_HERE]', updated_at = NOW() WHERE id = 'facility-001';

-- Beta Equity Partners ($75,000,000)
UPDATE facilities SET gp_user_id = '[GP_USER_ID_HERE]', updated_at = NOW() WHERE id = 'facility-002';

[... more facilities ...]

-- Or assign ALL facilities to a single GP:
UPDATE facilities SET gp_user_id = '[GP_USER_ID_HERE]', updated_at = NOW() WHERE gp_user_id IS NULL;
```

## Pre-Migration Checklist

Before running the migration:

1. **Verify GP users exist:**
   ```bash
   psql $DATABASE_URL -c "SELECT id, email, first_name, last_name FROM users WHERE role = 'gp';"
   ```

2. **Count unassigned facilities:**
   ```bash
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM facilities WHERE gp_user_id IS NULL;"
   ```

3. **Review facility details:**
   ```bash
   psql $DATABASE_URL -c "SELECT id, fund_name, principal_amount, status FROM facilities WHERE gp_user_id IS NULL;"
   ```

## Creating GP Users (If Needed)

If no GP users exist, create one first:

### Option A: Change existing user's role
```sql
UPDATE users SET role = 'gp' WHERE email = 'user@example.com';
```

### Option B: Use Replit Auth
1. Log in with the user account that should be a GP
2. Their account will be automatically created
3. Update their role to 'gp' using Option A above

## Post-Migration Verification

After running the migration, verify the assignments:

### Check all facilities have ownership
```bash
psql $DATABASE_URL -c "
SELECT 
  COUNT(*) as total_facilities,
  COUNT(gp_user_id) as assigned,
  COUNT(*) - COUNT(gp_user_id) as unassigned
FROM facilities;
"
```

Expected output:
```
 total_facilities | assigned | unassigned 
------------------+----------+------------
                5 |        5 |          0
```

### View facility ownership distribution
```bash
psql $DATABASE_URL -c "
SELECT 
  u.email,
  u.first_name,
  u.last_name,
  COUNT(f.id) as facility_count,
  SUM(f.principal_amount) as total_principal
FROM users u
LEFT JOIN facilities f ON f.gp_user_id = u.id
WHERE u.role = 'gp'
GROUP BY u.id, u.email, u.first_name, u.last_name;
"
```

### Test GP access
1. Log in as a GP user
2. Navigate to facilities page
3. Verify you can see your assigned facilities
4. Verify you CANNOT see facilities assigned to other GPs
5. Submit a test draw request to confirm access

## Rollback Procedure

If you need to undo the migration:

```sql
-- Remove all GP assignments
UPDATE facilities SET gp_user_id = NULL, updated_at = NOW();
```

⚠️ **Warning:** This will block all GP access to facilities until reassigned.

## Production Deployment Checklist

Before deploying to production with multi-tenant security:

- [ ] All facilities have `gpUserId` assigned (verify with post-migration checks)
- [ ] GP users can access their facilities successfully
- [ ] GP users CANNOT access other GPs' facilities (security test)
- [ ] Draw request functionality works end-to-end
- [ ] Cash flow access works correctly
- [ ] Covenant monitoring endpoints respond properly
- [ ] Legal document generation functions
- [ ] Operations/admin users can access ALL facilities

## Troubleshooting

### "No GP users found in the system!"

**Solution:** Create a GP user first using the steps in "Creating GP Users" section above.

### "All facilities already have ownership assigned!"

**Solution:** This is a success message. No migration needed.

### GP user cannot see any facilities after migration

**Possible causes:**
1. Facility assigned to different GP user
2. User role is not 'gp'
3. Frontend caching issue

**Debugging:**
```sql
-- Check user role
SELECT id, email, role FROM users WHERE email = 'user@example.com';

-- Check facility ownership
SELECT id, fund_name, gp_user_id FROM facilities WHERE gp_user_id = 'user-id-here';
```

### 403 Forbidden errors after migration

**Possible causes:**
1. Facility `gpUserId` is NULL
2. User trying to access another GP's facility
3. Backend server not restarted after migration

**Solution:**
1. Verify facility has `gpUserId` assigned
2. Restart the backend server
3. Check browser console for detailed error messages

## Support

For issues with the migration:
1. Check the troubleshooting section above
2. Review the migration script logs
3. Contact the operations team
4. Review `replit.md` for system architecture details

## Migration Script Locations

- **Interactive migration:** `server/migrations/assign-facility-ownership.ts`
- **Quick dev migration:** `server/migrations/dev-assign-facilities.ts`
- **This guide:** `FACILITY_OWNERSHIP_MIGRATION.md`
