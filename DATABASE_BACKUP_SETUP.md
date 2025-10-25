# Neon Database Backup & Recovery Setup Guide

## Overview
This guide explains how to configure automated backups and point-in-time recovery (PITR) for the AlphaNAV production database on Neon's PostgreSQL platform.

## Neon Database Information
- **Provider**: Neon (Serverless PostgreSQL)
- **Connection**: Via `@neondatabase/serverless` with WebSocket
- **Current Environment Variable**: `DATABASE_URL`

## Step 1: Understand Neon's Backup Features

### Free Tier Limitations
- **7-day history**: Point-in-time recovery up to 7 days back
- **Branch-based backups**: Manual branch creation for snapshots
- **No automated backups**: Must manually create branches

### Paid Tier Features (Pro Plan - $19/month)
- **30-day history**: Point-in-time recovery up to 30 days back
- **Branch protection**: Protected branches can't be accidentally deleted
- **Enhanced compute**: Better performance for production workloads
- **Higher limits**: More concurrent connections and data storage

## Step 2: Configure Point-in-Time Recovery (PITR)

Neon provides automatic PITR without additional configuration. All database changes are automatically captured in the WAL (Write-Ahead Log).

### How PITR Works on Neon:
1. Every write is captured in PostgreSQL's WAL
2. Neon stores WAL files for your history window (7 or 30 days)
3. You can restore to any point in time within that window
4. Restoration is done by creating a new branch at a specific timestamp

### Enable PITR (Verify Settings):
1. Go to https://console.neon.tech
2. Select your project
3. Navigate to **Settings** → **General**
4. Confirm **History retention** is enabled (default)
5. For production, upgrade to Pro plan for 30-day retention

## Step 3: Create Production Database Branch

### Why Create a Production Branch:
- **Branch protection**: Protects against accidental deletion
- **Isolation**: Separate development/staging from production
- **Rollback capability**: Easily create restore points

### Create Production Branch:
1. Go to Neon Console → Your Project
2. Click **Branches** in the sidebar
3. Click **Create Branch**
4. Configure:
   - **Branch name**: `production`
   - **Parent branch**: `main`
   - **From**: Latest (or specific timestamp)
5. Click **Create Branch**

### Update Production Environment:
Once the production branch is created, update the `DATABASE_URL` in production:
```
postgresql://[username]:[password]@[production-branch-host]/[database]?sslmode=require
```

Neon provides the full connection string in the branch details.

## Step 4: Backup Strategy ✅ PRODUCTION CONFIGURATION

### ⚠️ MANDATORY PRE-LAUNCH ACTIONS

**Before deploying to production, complete these steps:**

1. **Upgrade to Neon Pro Plan** ($19/month)
   - Required for 30-day PITR window
   - Go to: https://console.neon.tech → Billing → Upgrade to Pro
   - **Why**: Free tier only has 7-day history (insufficient for compliance)

2. **Enable Branch Protection**
   - Go to: Neon Console → Branches → production
   - Click "Protect Branch"
   - **Why**: Prevents accidental deletion of production data

3. **Set Up Automated Backup Schedule**
   ```
   Schedule: Daily at 2 AM UTC (low-traffic window)
   Retention: Keep 30 daily backups + 12 monthly backups
   ```

### Daily Automated Snapshots (REQUIRED)

**Option A: Using Neon CLI (Recommended)**
```bash
# Install Neon CLI
npm install -g neonctl

# Authenticate
neonctl auth

# Create daily backup (run via cron/GitHub Actions)
#!/bin/bash
BACKUP_NAME="backup-$(date +%Y-%m-%d)"
neonctl branches create --project-id YOUR_PROJECT_ID --name $BACKUP_NAME --parent production

# Delete backups older than 30 days
neonctl branches list --project-id YOUR_PROJECT_ID | grep "backup-" | # filter old ones
```

**Option B: Using Neon Console (Manual)**
1. Go to Neon Console → Branches
2. Click "Create Branch"
3. Parent: `production`
4. Name: `backup-YYYY-MM-DD`
5. Repeat daily at 2 AM UTC

### Pre-Deployment Snapshots (REQUIRED)
**Always create snapshot before deployment:**
```bash
# Before deploying
neonctl branches create --name "pre-deploy-$(date +%Y-%m-%d-%H%M)" --parent production

# Deploy changes
# If issues occur, restore from pre-deploy branch
```

### Weekly Full Snapshots (COMPLIANCE)
For financial services compliance:
```bash
# Every Sunday at 3 AM UTC
neonctl branches create --name "weekly-$(date +%Y-W%V)" --parent production
# Keep for 12 months minimum (regulatory requirement)
```

## Step 5: Recovery Procedures

### Scenario 1: Restore to Specific Point in Time

**Example**: Restore database to state from 2 hours ago

1. Go to Neon Console → Branches
2. Click **Create Branch**
3. Select **Parent branch**: `production`
4. Select **From**: Point in time
5. Enter timestamp: `2025-10-25 15:30:00 UTC`
6. Name: `restore-2025-10-25-1530`
7. Click **Create Branch**
8. Verify data in new branch
9. Update `DATABASE_URL` to point to restored branch
10. Restart application
11. Once verified, make this the new production branch

**Downtime**: 5-10 minutes for connection string update and app restart

### Scenario 2: Restore from Manual Snapshot

**Example**: Rollback to yesterday's backup branch

1. Go to Neon Console → Branches
2. Find branch: `backup-2025-10-24`
3. Create new branch from it: `production-restored`
4. Update `DATABASE_URL` to new branch
5. Restart application
6. Verify data integrity
7. Rename branch to `production` (archive old production branch)

**Downtime**: 5-10 minutes

### Scenario 3: Accidental Data Deletion

**Example**: Critical table was dropped 30 minutes ago

1. Immediately create restore branch from 35 minutes ago
2. Connect to both databases
3. Export affected tables from restore branch:
   ```sql
   pg_dump -h [restore-host] -U [user] -d [db] -t [table_name] > restore.sql
   ```
4. Import to production:
   ```sql
   psql -h [prod-host] -U [user] -d [db] -f restore.sql
   ```
5. Verify data
6. Delete restore branch

**Downtime**: None (surgical restore)

## Step 6: Backup Monitoring & Alerts

### What to Monitor:
- Branch creation success/failure
- PITR history availability (ensure 7 or 30-day retention)
- Database size (approaching plan limits)
- Connection pool exhaustion

### Set Up Alerts:
1. **Storage Alerts**:
   - Neon Console → Settings → Configure email alerts for 80% storage
   
2. **Branch Limit Alerts**:
   - Free tier: 10 branches max
   - Monitor branch count weekly

3. **Manual Monitoring Checklist** (Weekly):
   - [ ] Verify latest daily backup branch exists
   - [ ] Confirm PITR timestamp availability
   - [ ] Check database size vs. plan limits
   - [ ] Review and delete old backup branches (>30 days)

## Step 7: Disaster Recovery Drills

### Monthly Drill Procedure:
**Goal**: Verify backups work and team knows recovery process

1. **Create test restore** (first Sunday of each month):
   - Create branch from production (1 week old)
   - Name: `drill-YYYY-MM`
   - Connect to branch and verify data
   - Time the recovery process
   - Document any issues

2. **Metrics to track**:
   - Time to create branch: Target < 2 minutes
   - Time to verify data: Target < 10 minutes
   - Total recovery time: Target < 15 minutes
   - Data integrity: 100% match expected

3. **Document results**:
   - Record in incident log
   - Update recovery runbook if needed
   - Train team members on process

### Recovery Time Objectives (RTO):
- **Point-in-time restore**: 15 minutes
- **Branch restore**: 10 minutes
- **Surgical data recovery**: 30 minutes
- **Full disaster recovery**: 1 hour

### Recovery Point Objectives (RPO):
- **Maximum data loss**: 1 hour (PITR granularity)
- **Target data loss**: 0 minutes (immediate restoration from PITR)

## Step 8: Backup Automation (Optional)

### Automated Daily Snapshots via GitHub Actions:

Create `.github/workflows/daily-backup.yml`:

```yaml
name: Daily Database Backup

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily
  workflow_dispatch:  # Allow manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Create Neon Branch
        env:
          NEON_API_KEY: ${{ secrets.NEON_API_KEY }}
          PROJECT_ID: ${{ secrets.NEON_PROJECT_ID }}
        run: |
          BRANCH_NAME="backup-$(date +%Y-%m-%d)"
          curl -X POST "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches" \
            -H "Authorization: Bearer $NEON_API_KEY" \
            -H "Content-Type: application/json" \
            -d "{\"name\":\"$BRANCH_NAME\",\"parent_id\":\"production\"}"
          
      - name: Notify on failure
        if: failure()
        run: echo "Backup failed! Alert team."
```

### Required Secrets:
- `NEON_API_KEY`: Get from Neon Console → Account Settings → API Keys
- `NEON_PROJECT_ID`: Get from Neon Console → Project Settings

## Step 9: Production Deployment Checklist

Before going to production:

- [ ] Verify `DATABASE_URL` points to production branch
- [ ] Confirm PITR is enabled (7 or 30-day retention)
- [ ] Create initial `backup-[date]` branch
- [ ] Document connection string in secure location
- [ ] Set up weekly manual snapshot reminders
- [ ] Schedule first disaster recovery drill
- [ ] Configure storage alerts in Neon Console
- [ ] Test connection from production application
- [ ] Verify database migrations run successfully
- [ ] Create runbook for recovery procedures

## Step 10: Migration Considerations

### Drizzle ORM Migration Strategy:
AlphaNAV uses Drizzle ORM. For production database changes:

1. **Development**: Test schema changes locally
2. **Generate Migration**: `npm run db:generate`
3. **Review Migration**: Check generated SQL files
4. **Backup**: Create pre-migration branch
5. **Apply**: `npm run db:push` (or migration command)
6. **Verify**: Test application functionality
7. **Monitor**: Watch for errors in first hour

### Rollback Plan:
If migration fails:
1. Stop application
2. Restore from pre-migration branch
3. Update `DATABASE_URL`
4. Restart application
5. Fix migration issues in development
6. Retry with corrected migration

## Cost Optimization

### Free Tier Strategy:
- Use 7-day PITR
- Create 3-5 critical manual snapshots weekly
- Delete old snapshots after 14 days
- **Monthly cost**: $0

### Pro Plan Strategy ($19/month):
- 30-day PITR
- Daily automated snapshots
- Protected production branch
- Keep critical snapshots for 90 days
- **Monthly cost**: $19 + overages

### When to Upgrade:
Upgrade to Pro if:
- Revenue-generating application
- Compliance requires 30-day retention
- Need faster compute for production
- Require branch protection features

## Support & Resources

- **Neon Documentation**: https://neon.tech/docs
- **PITR Guide**: https://neon.tech/docs/introduction/point-in-time-restore
- **Branching Guide**: https://neon.tech/docs/introduction/branching
- **Neon Support**: support@neon.tech (Pro plan)
- **Community**: https://community.neon.tech

## Implementation Checklist

✅ **Verify PITR is enabled** (default on all Neon projects)
🔲 **Create production branch** (isolate production data)
🔲 **Create first backup branch** (establish baseline)
🔲 **Schedule monthly drill** (verify recovery works)
🔲 **Document recovery procedures** (update runbook)
🔲 **Train team on recovery** (ensure knowledge transfer)
🔲 **Consider Pro plan upgrade** (for production workloads)
