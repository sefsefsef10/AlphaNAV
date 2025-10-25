# AlphaNAV Production Deployment Runbook

**Last Updated**: October 25, 2025  
**Platform Version**: MVP 1.0  
**Status**: Ready for Production Launch

---

## 🚀 Pre-Launch Checklist (Complete Before Deployment)

### Step 1: Environment Configuration (30 minutes)

**Required Environment Variables:**
```bash
# Set these in Replit Secrets before deployment

# 1. Database (Already configured)
DATABASE_URL=postgresql://[NEON_CONNECTION_STRING]

# 2. Sessions
SESSION_SECRET=[Generate 256-bit random string]
# Generate with: openssl rand -base64 32

# 3. Authentication
REPL_ID=[Your Replit app ID]
REPLIT_DOMAINS=[Your production domain(s)]
ISSUER_URL=https://replit.com/oidc

# 4. AI Services
GEMINI_API_KEY=[Your Google AI API key]
OPENAI_API_KEY=[Optional - not used in MVP]

# 5. Monitoring
SENTRY_DSN=[Your Sentry DSN for production]

# 6. CORS Whitelist (CRITICAL)
ALLOWED_ORIGINS=https://your-app.replit.app,https://custom-domain.com
# Comma-separated list of allowed origins

# 7. Object Storage
PRIVATE_OBJECT_DIR=[Path to private storage]
PUBLIC_OBJECT_SEARCH_PATHS=[Path to public assets]
DEFAULT_OBJECT_STORAGE_BUCKET_ID=[Bucket ID]

# 8. Runtime
NODE_ENV=production
```

### Step 2: Database Preparation (2 hours)

**A. Upgrade Neon to Pro Plan**
1. Go to https://console.neon.tech
2. Navigate to Billing → Upgrade to Pro ($19/month)
3. Confirm 30-day PITR is enabled

**B. Create Production Branch**
```bash
# Using Neon CLI
neonctl branches create --name production --parent main

# Update DATABASE_URL to production branch connection string
```

**C. Enable Branch Protection**
1. Neon Console → Branches → production
2. Click "Protect Branch"
3. Confirm protection is active

**D. Initial Production Backup**
```bash
# Create first production snapshot
neonctl branches create --name "production-launch-$(date +%Y-%m-%d)" --parent production
```

**E. Set Up Automated Backups**
- Configure GitHub Actions or cron job for daily backups
- See DATABASE_BACKUP_SETUP.md for full details

### Step 3: Sentry Configuration (30 minutes)

**A. Create Production Sentry Project**
1. Go to https://sentry.io
2. Create new project: "AlphaNAV Production"
3. Copy DSN (starts with `https://...@sentry.io/...`)
4. Add to Replit Secrets as `SENTRY_DSN`

**B. Configure Alerts**
1. Sentry → Alerts → Create Alert Rule
2. Set up:
   - Error rate > 10 errors/hour
   - Response time > 2 seconds (P95)
   - Failed API requests > 5%
3. Alert destination: Email + Slack (recommended)

**C. Verify Sentry Integration**
```bash
# After deployment, trigger test error
curl https://your-app.replit.app/api/test-sentry-error
# Check Sentry dashboard for error event
```

### Step 4: AI Budget Alerts (30 minutes)

**A. Google Gemini Billing Alerts**
1. Go to https://console.cloud.google.com
2. Navigation → Billing → Budgets & Alerts
3. Create budget:
   - Name: "Gemini API Monthly Budget"
   - Amount: $50/month (soft limit)
   - Alert thresholds: 50%, 75%, 90%, 100%
   - Email notifications to: your-email@example.com

**B. OpenAI Billing Alerts** (if enabled)
1. Go to https://platform.openai.com/account/billing
2. Set up billing limits:
   - Soft limit: $50/month
   - Hard limit: $100/month
3. Email notifications enabled

**C. Monitor AI Usage**
- Weekly: Review Gemini API usage
- Monthly: Review costs vs budget
- See AI_COST_MONITORING_SETUP.md for details

### Step 5: Security Verification (30 minutes)

**A. Verify Security Headers**
```bash
# Test with curl
curl -I https://your-app.replit.app

# Should see:
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# X-Content-Type-Options: nosniff
# Content-Security-Policy: [should be present]
```

**B. Test Rate Limiting**
```bash
# Test global rate limit (should block after 100 requests)
for i in {1..110}; do curl https://your-app.replit.app/api/prospects; done

# Should see 429 Too Many Requests after request 101
```

**C. Test CORS Protection**
```bash
# From unauthorized domain, should fail
curl -H "Origin: https://evil-site.com" https://your-app.replit.app/api/prospects

# Should see: 403 CORS not allowed from this origin
```

**D. Verify Authentication**
```bash
# Without auth, should fail
curl https://your-app.replit.app/api/prospects

# Should see: 401 Unauthorized
```

---

## 🚢 Deployment Steps (Go Live)

### Step 1: Deploy to Replit (15 minutes)

**A. Pre-Deployment Snapshot**
```bash
# Create snapshot before deployment
neonctl branches create --name "pre-deploy-$(date +%Y-%m-%d-%H%M)" --parent production
```

**B. Deploy via Replit**
1. Go to Replit → Deployments tab
2. Click "Deploy"
3. Wait for build to complete (~5 minutes)
4. Verify deployment URL is live

**C. Update ALLOWED_ORIGINS**
```bash
# Add production domain to whitelist
ALLOWED_ORIGINS=https://alphanav.replit.app,https://your-custom-domain.com
```

### Step 2: Smoke Tests (15 minutes)

**Run these tests immediately after deployment:**

**A. Health Check**
```bash
curl https://your-app.replit.app/api/health

# Should return: {"status":"ok","timestamp":...}
```

**B. Authentication Flow**
1. Visit https://your-app.replit.app
2. Click "Login with Replit"
3. Authorize app
4. Verify redirect to dashboard
5. Check user data loads correctly

**C. Critical Workflows**
1. **Operations**: Upload prospect document, verify AI extraction
2. **Advisor**: Create RFP deal, verify dashboard loads
3. **GP**: Create draw request, verify document vault

**D. Error Monitoring**
1. Check Sentry dashboard
2. Verify errors are being captured
3. Check PII is scrubbed from events

### Step 3: Database Verification (10 minutes)

```sql
-- Connect to production database
psql $DATABASE_URL

-- Verify tables exist
\dt

-- Check user count
SELECT COUNT(*) FROM users;

-- Check session storage
SELECT COUNT(*) FROM sessions;

-- Exit
\q
```

### Step 4: Performance Baseline (15 minutes)

**A. Response Time Baseline**
```bash
# Test API response times
curl -w "@curl-format.txt" https://your-app.replit.app/api/prospects

# Create curl-format.txt:
time_namelookup:  %{time_namelookup}s\n
time_connect:  %{time_connect}s\n
time_appconnect:  %{time_appconnect}s\n
time_pretransfer:  %{time_pretransfer}s\n
time_redirect:  %{time_redirect}s\n
time_starttransfer:  %{time_starttransfer}s\n
time_total:  %{time_total}s\n

# Target: < 1 second total
```

**B. Database Connection Pool**
- Monitor Neon dashboard for connection count
- Target: < 10 connections at rest
- Alert if > 50 connections

---

## 📊 Post-Launch Monitoring (First 48 Hours)

### Hour 1-4: Critical Monitoring

**Every 30 minutes, check:**
- [ ] Sentry error count (< 10 errors/hour)
- [ ] API response time (< 1 second P95)
- [ ] Database connections (< 20)
- [ ] Memory usage (< 80%)
- [ ] AI API errors (0 expected)

### Hour 4-24: Active Monitoring

**Every 2 hours, check:**
- [ ] New user signups
- [ ] Error rate trends
- [ ] Performance degradation
- [ ] AI cost accumulation

### Day 2-7: Ongoing Monitoring

**Daily checks:**
- [ ] Sentry dashboard review
- [ ] Database backup verification
- [ ] AI cost review (Gemini usage)
- [ ] User feedback/support tickets

---

## 🚨 Incident Response Procedures

### Severity 1: Production Down (Critical)

**Symptoms:** App completely unavailable, 500 errors, database unreachable

**Response (5-minute window):**
1. Check Replit deployment status
2. Check Neon database status: https://neon.tech/status
3. Check Sentry for error patterns
4. If database corruption: Restore from latest backup
5. If deployment issue: Rollback to previous deployment
6. Notify users via status page

**Rollback Procedure:**
```bash
# Restore database to 1 hour ago
neonctl branches create --name "emergency-restore" --parent production --timestamp "1 hour ago"

# Update DATABASE_URL to restored branch
# Restart Replit deployment
```

### Severity 2: Degraded Performance

**Symptoms:** Slow response times, intermittent errors, high error rate

**Response (15-minute window):**
1. Check Sentry performance dashboard
2. Identify slow queries in Neon query stats
3. Check rate limiting logs
4. Scale Neon compute if needed
5. Optimize problematic queries

### Severity 3: Non-Critical Issues

**Symptoms:** Minor bugs, cosmetic issues, feature requests

**Response (24-hour window):**
1. Log issue in issue tracker
2. Triage priority
3. Schedule fix in next sprint

---

## 📈 Success Metrics (Week 1)

**Targets:**
- Uptime: > 99.5% (< 36 minutes downtime)
- Error rate: < 0.1% of requests
- Response time (P95): < 1 second
- AI cost: < $10 (Gemini only)
- User signups: Track baseline
- Support tickets: < 5 critical issues

**Review Cadence:**
- Daily: Morning standup (10 min)
- Weekly: Full metrics review (30 min)
- Monthly: Performance optimization planning

---

## 📞 Emergency Contacts

**On-Call Rotation:**
- Primary: [Your name] - [Your phone/email]
- Secondary: [Backup contact]
- Database: Neon Support (support@neon.tech)
- Monitoring: Sentry Support (support@sentry.io)

**Escalation Path:**
1. Primary on-call (respond within 15 min)
2. Secondary on-call (if no response in 30 min)
3. External consultant (if issue persists > 1 hour)

---

## ✅ Launch Checklist Summary

**Before pressing Deploy:**
- [ ] All environment variables set
- [ ] Neon Pro Plan activated
- [ ] Production branch created and protected
- [ ] Sentry DSN configured
- [ ] ALLOWED_ORIGINS whitelist set
- [ ] AI billing alerts configured
- [ ] Pre-deployment backup created
- [ ] Team notified of launch time

**Immediately after Deploy:**
- [ ] Health check passes
- [ ] Authentication flow works
- [ ] Critical workflows tested
- [ ] Sentry receiving events
- [ ] Database accessible
- [ ] Performance baseline captured

**First 24 Hours:**
- [ ] No critical errors in Sentry
- [ ] Response times within target
- [ ] Database backups running
- [ ] User feedback collected
- [ ] Team debrief scheduled

---

**Deployment Date**: _____________  
**Deployed By**: _____________  
**Status**: ☐ Success ☐ Rollback Required ☐ Issues Noted

**Next Review**: 24 hours post-launch
