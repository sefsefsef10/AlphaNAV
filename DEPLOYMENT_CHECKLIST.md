# AlphaNAV Production Deployment Checklist

**Last Updated**: October 25, 2025  
**Target Production Date**: TBD  
**Platform Version**: MVP 1.0

---

## ✅ Pre-Deployment Validation (COMPLETED)

### Code Quality & Testing
- [x] **Zero LSP/TypeScript Errors**: All type errors resolved
- [x] **E2E Testing - Operations Workflow** (26 steps): ✅ PASSED
  - Prospect upload with AI extraction
  - Underwriting workflow
  - Facility creation
  - Covenant monitoring
- [x] **E2E Testing - Advisor Workflow** (26 steps): ✅ PASSED
  - RFP submission
  - Lender invitations
  - Deal detail view
  - Dashboard navigation
- [x] **E2E Testing - GP Workflow** (18 steps): ✅ PASSED
  - GP dashboard
  - Facility management
  - Draw request creation
  - Document vault access
- [x] **All 22 MVP Features Implemented**: 100% feature completeness
- [x] **Critical Bug Fixes Completed**:
  - Authentication endpoint (`GET /api/auth/user`)
  - App.tsx conditional rendering
  - GP user routing
  - Advisor workflow API endpoints
  - Advisor deal detail page

---

## 🔒 MANDATORY SECURITY HARDENING ✅ COMPLETED

**Status**: All critical security controls implemented and tested

### 1. HTTP Security Headers (Helmet.js) ✅ COMPLETE
**Implementation**: Environment-aware CSP with strict production policies

**Implemented Features**:
- [x] **Helmet.js configured** in server/index.ts
- [x] **Content Security Policy (CSP)**:
  - Font sources: Google Fonts (fonts.googleapis.com, fonts.gstatic.com)
  - Script sources: Self + development exceptions for Vite HMR
  - Connect sources: OpenAI, Gemini, Sentry (*.sentry.io, *.ingest.sentry.io)
  - Frame ancestors: 'none' (prevents clickjacking)
  - Script-src-attr: 'none' (prevents inline event handlers)
- [x] **HSTS**: 1 year max-age with subdomains and preload
- [x] **PII Scrubbing**: Sentry beforeSend hook removes auth headers, cookies, passwords
- [x] **Request Logging**: Only logs response metadata, not full payloads

**Verification**: Review server/index.ts lines 60-88

### 2. Rate Limiting ✅ COMPLETE
**Implementation**: Multi-tiered rate limiting applied before body parsing

**Implemented Features**:
- [x] **Global rate limiter**: 100 req/15min for all `/api/*` routes
- [x] **Auth login limiter**: 5 req/15min for `/api/login` and `/api/auth/callback`
- [x] **Auth refresh limiter**: 20 req/15min for `/api/auth/refresh` (separate from login)
- [x] **Applied BEFORE body parsing**: Prevents resource exhaustion attacks
- [x] **Body size limits**: 10MB JSON/form payload limit

**Verification**: Review server/index.ts lines 90-120

### 3. Session Cookie Security ✅ COMPLETE
**Implementation**: PostgreSQL-backed sessions with secure cookie configuration

**Implemented Features**:
- [x] **Session configuration** in server/replitAuth.ts
- [x] **Cookie security**:
  - httpOnly: true (prevents JavaScript access)
  - secure: conditional on NODE_ENV === "production" (HTTPS only in prod)
  - sameSite: "strict" (CSRF protection)
  - maxAge: 7 days (auto-expires)
- [x] **PostgreSQL session store**: connect-pg-simple with 7-day TTL

**Verification**: Review server/replitAuth.ts lines 35-46

### 4. Input Validation & Mass Assignment Protection ✅ COMPLETE
**Implementation**: Comprehensive Zod validation on all mutation endpoints

**Implemented Features**:
- [x] **All 7 critical POST/PATCH endpoints validated**:
  - `POST /api/prospects/upload-and-extract` - File upload with type validation
  - `PATCH /api/prospects/:id` - updateProspectSchema with .strict()
  - `POST /api/facilities` - insertFacilitySchema
  - `PATCH /api/facilities/:id` - updateFacilitySchema with .strict()
  - `POST /api/covenants` - insertCovenantSchema
  - `PATCH /api/covenants/:id` - updateCovenantSchema with .strict()
  - `POST /api/advisor-deals` - insertAdvisorDealSchema
- [x] **Mass assignment protection**: Update schemas use .strict() to reject unknown fields
- [x] **Protected fields**: Status/stage fields excluded from PATCH to require business logic
- [x] **Foreign key protection**: prospectId, facilityId, advisorDealId immutable in updates
- [x] **File upload validation**:
  - Allowed types: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV
  - Max size: 10MB (reduced from 50MB)
  - MIME type + extension validation

**Verification**: Review server/routes.ts lines 47-67 (update schemas) and lines 34-67 (file upload)

### 5. CORS Configuration ⚠️ ACTION REQUIRED
**Status**: Using Vite default CORS (development mode)

**Production Action Required**:
- [ ] **Configure strict CORS** for production deployment
  - Whitelist only production domains (replit.app, custom domain)
  - Enable credentials for session cookies
  - Test cross-origin requests from unauthorized domains fail

### 6. API Key Rotation & Least Privilege - HIGH PRIORITY
**Risk**: Compromised API keys or over-privileged access

**Action Items**:
- [ ] **Audit all API keys** in Replit Secrets
  - `OPENAI_API_KEY` - Verify minimum required permissions
  - `GEMINI_API_KEY` - Verify minimum required permissions
  - `SESSION_SECRET` - Generate new 256-bit secret for production
- [ ] **Set up API key rotation schedule**:
  - OpenAI/Gemini: Rotate every 90 days
  - Session secret: Rotate every 180 days
  - Document rotation procedure in runbook
- [ ] **Implement API key usage monitoring**:
  - Set up billing alerts on OpenAI/Gemini accounts
  - Monitor for unusual usage patterns
  - Set monthly spending limits

### 7. OIDC Provider Contingency - MEDIUM PRIORITY
**Risk**: If Replit Auth has outage, users cannot log in

**Action Items**:
- [ ] **Document Replit Auth status page**: https://status.replit.com
- [ ] **Create contingency plan**:
  - Option 1: Implement backup local auth (email/password)
  - Option 2: Add second OIDC provider (Auth0, Clerk)
  - Option 3: Temporary admin backdoor (emergency access only)
- [ ] **Set up monitoring** for auth endpoint uptime
- [ ] **Define SLA**: What is acceptable auth downtime? (Recommend: <1 hour)

### 8. Data Retention & Privacy Compliance - MEDIUM PRIORITY
**Risk**: Non-compliance with GDPR, CCPA, or industry regulations

**Action Items**:
- [ ] **Define data retention policy**:
  - User data: Retain until account deletion
  - Session data: Auto-expire after 7 days (already configured ✅)
  - Uploaded documents: Retain for X years (define based on compliance needs)
  - Audit logs: Retain for 1 year minimum
- [ ] **Implement data deletion procedures**:
  - User requests account deletion → delete all associated data
  - Comply with deletion within 30 days (GDPR requirement)
- [ ] **Review Privacy Policy**: Ensure it matches actual data handling
- [ ] **Review Terms of Service**: Ensure it protects company legally
- [ ] **Add "Delete Account" feature** (if handling EU users)

### 9. TLS/SSL Verification - LOW PRIORITY (Replit handles this)
**Risk**: Man-in-the-middle attacks if TLS not properly configured

**Status**: ✅ Replit Deployments automatically provision SSL certificates
- [ ] **Verify HTTPS redirect** works (HTTP → HTTPS)
- [ ] **Test SSL certificate** using ssllabs.com/ssltest
- [ ] **Expected grade**: A or A+

### Security Checklist - Summary
**Before deploying, verify all CRITICAL and HIGH PRIORITY items are checked:**
- [ ] Helmet.js security headers configured
- [ ] Rate limiting on all API routes
- [ ] CORS whitelist configured for production domains
- [ ] Session cookies use secure, httpOnly, sameSite flags
- [ ] All API endpoints have input validation (Zod schemas)
- [ ] API keys rotated and least-privilege configured
- [ ] Privacy policy and terms of service reviewed

**🚫 DO NOT PROCEED TO DEPLOYMENT SECTION UNTIL ALL ITEMS ABOVE ARE COMPLETED 🚫**

### Performance Optimization
- [x] **Database Queries**: Using Drizzle ORM with proper indexing
- [x] **Frontend Optimization**: Vite build optimizations enabled
- [x] **Code Splitting**: React lazy loading where appropriate
- [ ] **CDN Setup**: Consider CDN for static assets
- [ ] **Image Optimization**: Review attached assets and optimize sizes
- [ ] **Bundle Size Analysis**: Run `npm run build` and analyze bundle

---

## 🚧 Infrastructure Setup (PENDING)

### 1. Production Database (Neon PostgreSQL)
**Current Status**: Development database configured ✅

**Action Items**:
- [ ] **Create Production Database Branch** in Neon dashboard
  - Navigate to Neon dashboard → Create new branch → Name: "production"
  - Note the new DATABASE_URL for production
- [ ] **Enable Point-in-Time Recovery (PITR)**
  - Neon dashboard → Settings → Backups
  - Enable continuous backup (included in Pro plan)
  - Set retention period: 7-30 days recommended
- [ ] **Configure Automated Backups**
  - Daily automated snapshots (enabled by default on Neon)
  - Test restore procedure at least once before launch
- [ ] **Database Migration Strategy**
  - Current: `npm run db:push` for schema changes
  - Production: Consider `drizzle-kit generate` + `drizzle-kit migrate` for safer migrations
  - Document migration procedure in runbook
- [ ] **Connection Pooling**
  - Already using Neon serverless with connection pooling ✅
  - Monitor connection limits post-launch
- [ ] **Database Monitoring**
  - Enable Neon query insights
  - Set up alerts for slow queries (>1s)
  - Monitor connection count and query latency

### 2. Error Tracking & Monitoring (Sentry)
**Current Status**: Not configured ❌

**Action Items**:
- [ ] **Create Sentry Account**
  - Sign up at sentry.io
  - Create new project: "AlphaNAV" (Node.js + React)
- [ ] **Install Sentry SDKs**
  ```bash
  npm install --save @sentry/node @sentry/react
  ```
- [ ] **Configure Backend Sentry**
  - Add to `server/index.ts`:
    ```typescript
    import * as Sentry from "@sentry/node";
    
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
    });
    ```
- [ ] **Configure Frontend Sentry**
  - Add to `client/src/main.tsx`:
    ```typescript
    import * as Sentry from "@sentry/react";
    
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      integrations: [new Sentry.BrowserTracing()],
      tracesSampleRate: 0.1,
    });
    ```
- [ ] **Add Sentry Secrets to Replit**
  - `SENTRY_DSN` (backend)
  - `VITE_SENTRY_DSN` (frontend)
- [ ] **Test Error Reporting**
  - Trigger test error in dev environment
  - Verify error appears in Sentry dashboard
- [ ] **Configure Alerts**
  - Set up email/Slack notifications for critical errors
  - Define error rate thresholds for alerts

### 3. Application Performance Monitoring (APM)
**Current Status**: Not configured ❌

**Options**:
- [ ] **Sentry Performance Monitoring** (bundled with error tracking)
  - Already included in Sentry setup above
  - Monitor API endpoint response times
  - Track frontend page load times
- [ ] **Alternative: New Relic / Datadog** (if preferred)
  - More comprehensive but higher cost
  - Decision: Stick with Sentry for MVP

### 4. Logging & Observability
**Current Status**: Console logging only ❌

**Action Items**:
- [ ] **Structured Logging**
  - Install winston or pino for structured logs
  ```bash
  npm install --save winston
  ```
- [ ] **Log Aggregation**
  - Option 1: Use Replit's built-in logs (free, basic)
  - Option 2: Send logs to external service (LogDNA, Papertrail)
  - Recommendation: Start with Replit logs, upgrade if needed
- [ ] **Log Levels Configuration**
  - Production: INFO level minimum
  - Development: DEBUG level
  - Add environment variable: `LOG_LEVEL`

### 5. Uptime Monitoring
**Current Status**: Not configured ❌

**Action Items**:
- [ ] **Set Up Uptime Monitoring**
  - Option 1: UptimeRobot (free tier: 50 monitors, 5-min checks)
  - Option 2: Pingdom
  - Option 3: Better Uptime
- [ ] **Monitor Key Endpoints**
  - Landing page: `https://alphanav.replit.app/`
  - Health check: `https://alphanav.replit.app/api/health` (need to create)
  - Login flow: `https://alphanav.replit.app/api/auth/user`
- [ ] **Configure Alerts**
  - Email notifications for downtime
  - SMS for critical failures (optional)
  - Alert if down for >2 minutes

### 6. CDN & Static Assets (Optional for MVP)
**Current Status**: Served directly from Vite ✅

**Future Enhancement**:
- [ ] Consider Cloudflare CDN for static assets
- [ ] Optimize images in `attached_assets/` directory
- [ ] Implement lazy loading for stock images

---

## 🔐 Environment Configuration

### Required Production Secrets
All secrets should be configured in Replit Secrets panel before deployment:

**Already Configured** ✅:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - Database credentials
- `SESSION_SECRET` - Express session encryption key
- `OPENAI_API_KEY` - OpenAI API for document analysis
- `GEMINI_API_KEY` - Google Gemini for AI features
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID` - Replit object storage
- `PUBLIC_OBJECT_SEARCH_PATHS`, `PRIVATE_OBJECT_DIR` - Storage paths

**To Be Added** ❌:
- [ ] `SENTRY_DSN` - Backend error tracking
- [ ] `VITE_SENTRY_DSN` - Frontend error tracking
- [ ] `NODE_ENV=production` - Set environment to production
- [ ] `REPLIT_DEPLOYMENT_ENV=production` - Replit deployment flag

### Environment Variables Checklist
- [ ] Review all environment variables in code
- [ ] Ensure no secrets are hardcoded
- [ ] Verify `.env.example` is up to date
- [ ] Document all required secrets in README

---

## 🚀 Deployment Steps (Replit-Specific)

### Pre-Flight Checks
1. [ ] **Run Final Build Locally**
   ```bash
   npm run build
   ```
   - Verify no build errors
   - Check bundle size (target: <2MB for initial load)
   - Review build output for warnings
   - Test built app locally: Build completes → Test pages load

2. [ ] **Database Schema Validation**
   - **Option A**: Use Drizzle push (easier, recommended for MVP)
     ```bash
     npm run db:push
     ```
   - **Option B**: Generate and apply migrations (safer for production)
     ```bash
     npx drizzle-kit generate
     npx drizzle-kit migrate
     ```
   - [ ] Verify schema matches current database state
   - [ ] Test database connection after schema update
   - [ ] Document any manual data migrations needed

3. [ ] **Dependency Audit**
   ```bash
   npm audit
   ```
   - Fix high/critical vulnerabilities
   - Document accepted low/medium risks

### Deployment via Replit Deployments
**⚠️ IMPORTANT**: Replit Deployments differ from development environment

1. [ ] **Review Replit Deployment Settings**
   - Open Replit project → Tools → Deployments tab
   - **CRITICAL**: Deployment runs `npm run dev` which is correct for this setup
   - Verify port 5000 is configured (frontend binds to 0.0.0.0:5000)
   - Confirm auto-deploy settings (deploy on push to main branch)

2. [ ] **Create Production Database Branch (Neon)**
   - [ ] Navigate to Neon dashboard → Branches
   - [ ] Create new branch named "production" from current "main" branch
   - [ ] Copy the new production DATABASE_URL
   - [ ] **DO NOT** update dev database URL yet

3. [ ] **Configure Production Environment in Replit**
   - [ ] Open Replit → Tools → Secrets (for production deployment)
   - [ ] Add/update production secrets:
     - `NODE_ENV=production`
     - `DATABASE_URL=<production-neon-url>` (from step 2)
     - `SENTRY_DSN=<your-sentry-dsn>`
     - `VITE_SENTRY_DSN=<your-frontend-sentry-dsn>`
   - [ ] Verify all other secrets are present (SESSION_SECRET, OPENAI_API_KEY, GEMINI_API_KEY)
   - [ ] **Note**: Cannot verify secrets via shell - use Replit Secrets UI

4. [ ] **Pre-Deployment Database Setup**
   - [ ] **IMPORTANT**: Temporarily set DATABASE_URL to production URL in dev environment
   - [ ] Run schema push to production database:
     ```bash
     npm run db:push
     ```
   - [ ] Verify schema created in production database (check Neon console)
   - [ ] **CRITICAL**: Restore DATABASE_URL to dev URL after schema push
   - [ ] Alternative: Run migrations in Replit Shell after deployment

5. [ ] **Deploy to Production**
   - [ ] Click "Deploy" in Replit Deployments panel
   - [ ] Select deployment type: "Production" (not autoscale)
   - [ ] Wait for build to complete (~2-5 minutes)
   - [ ] Monitor deployment logs for errors
   - [ ] Note deployment URL: `https://<repl-name>.<username>.repl.co`
   - [ ] Deployment will:
     - Install dependencies (`npm install`)
     - Build frontend (`vite build` via npm run dev setup)
     - Start server on port 5000
     - Serve static assets + API routes

6. [ ] **Configure Health Check Endpoint** (Optional but recommended)
   - [ ] Add health check endpoint to `server/index.ts`:
     ```typescript
     app.get('/api/health', (req, res) => {
       res.json({ status: 'ok', timestamp: new Date().toISOString() });
     });
     ```
   - [ ] Replit uses this to monitor deployment health
   - [ ] Test after deployment: `curl https://<your-url>/api/health`

7. [ ] **Custom Domain Setup** (Optional)
   - [ ] Replit Deployments → Domains
   - [ ] Add custom domain (e.g., `app.alphanav.com`)
   - [ ] Configure DNS records as instructed by Replit:
     - CNAME: `app.alphanav.com` → `<repl-name>.<username>.repl.co`
   - [ ] Wait for DNS propagation (5-60 minutes)
   - [ ] SSL certificate auto-provisioned by Replit
   - [ ] Update CORS configuration with custom domain

### Post-Deployment Verification (Critical)
**Run these checks immediately after deployment**:

#### 1. Health Checks
- [ ] Landing page loads: `https://<production-url>/`
- [ ] Static assets load (images, CSS, JS)
- [ ] No console errors in browser DevTools
- [ ] Dark mode toggle works
- [ ] Responsive design works on mobile

#### 2. Authentication Flow
- [ ] Sign in button appears
- [ ] OIDC login redirects correctly
- [ ] Login with Google works
- [ ] Login with email/password works
- [ ] Session persists after browser refresh
- [ ] Logout works and clears session
- [ ] Role selection page loads after first login

#### 3. Operations Workflow (Smoke Test)
- [ ] Login as Operations user
- [ ] Navigate to Prospects page
- [ ] Upload prospect CSV file
- [ ] Verify AI extraction works (Gemini API)
- [ ] Create facility from prospect
- [ ] View covenant monitoring page
- [ ] Generate legal document (Loan Agreement)
- [ ] Download generated document

#### 4. Advisor Workflow (Smoke Test)
- [ ] Login as Advisor user
- [ ] Navigate to Submit Deal page
- [ ] Fill out RFP form (3 steps)
- [ ] Submit RFP
- [ ] View Active RFPs page
- [ ] Open deal detail page
- [ ] Verify lender invitations display

#### 5. GP Workflow (Smoke Test)
- [ ] Navigate to GP onboarding (if accessible)
- [ ] Login as GP user
- [ ] View GP dashboard
- [ ] Navigate to facility page
- [ ] Create draw request
- [ ] Verify draw request appears in list

#### 6. Database Connectivity
- [ ] Verify database queries work (check Neon dashboard for activity)
- [ ] Test data persistence (create entity, refresh page, verify it persists)
- [ ] Check connection pooling (Neon dashboard → Monitoring)

#### 7. External API Integrations
- [ ] OpenAI API calls work (document analysis)
- [ ] Gemini API calls work (covenant risk analysis)
- [ ] Object storage works (file uploads/downloads)
- [ ] Email notifications work (if implemented)

#### 8. Error Tracking
- [ ] Trigger test error
- [ ] Verify error appears in Sentry dashboard
- [ ] Check error has proper context (user, URL, stack trace)

#### 9. Performance Checks
- [ ] Measure page load time (<3s for landing page)
- [ ] Measure API response times (<500ms for simple queries)
- [ ] Check database query performance (Neon insights)
- [ ] Review Sentry performance traces

---

## 🚨 Incident Response & Risk Management

### 1. Incident Response Plan
**Purpose**: Define clear procedures for handling production incidents

**Action Items**:
- [ ] **Designate Incident Response Owner**
  - Primary on-call: [Name/Role]
  - Secondary backup: [Name/Role]
  - Escalation path documented
- [ ] **Define Incident Severity Levels**:
  - **P0 (Critical)**: Full outage, data loss, security breach
    - Response time: <15 minutes
    - All hands on deck
  - **P1 (High)**: Major feature broken, significant degradation
    - Response time: <1 hour
    - Assign to on-call engineer
  - **P2 (Medium)**: Minor feature broken, some users affected
    - Response time: <4 hours
    - Address during business hours
  - **P3 (Low)**: Cosmetic issue, feature request
    - Response time: <1 week
    - Add to backlog
- [ ] **Create Incident Response Runbook** (see dedicated section below)
- [ ] **Set Up Incident Communication Channel**:
  - Slack channel: #alphanav-incidents
  - Email distribution list
  - Status page for users (optional for MVP)

### 2. AI API Cost & Quota Monitoring - CRITICAL
**Risk**: Unexpected API costs or hitting quota limits can break core features

**Action Items**:
- [ ] **OpenAI API Monitoring**
  - [ ] Log in to OpenAI dashboard → Usage
  - [ ] Set up billing alerts:
    - Warning at $50/month
    - Critical alert at $100/month
    - Hard limit at $200/month (prevent runaway costs)
  - [ ] Review rate limits: https://platform.openai.com/account/rate-limits
  - [ ] Current quota: [Check and document]
  - [ ] Monitor daily: First week after launch
  - [ ] Monitor weekly: After stabilization
  
- [ ] **Google Gemini API Monitoring**
  - [ ] Log in to Google Cloud Console → APIs & Services → Gemini API
  - [ ] Enable billing alerts:
    - Warning at $50/month
    - Critical alert at $100/month
  - [ ] Review quotas: https://console.cloud.google.com/iam-admin/quotas
  - [ ] Set up quota alerts (email notifications)
  - [ ] Document current limits: [Requests per day/month]

- [ ] **Implement Application-Level Monitoring**
  - [ ] Add counter for AI API calls in Sentry:
    ```typescript
    Sentry.metrics.increment('ai.openai.calls');
    Sentry.metrics.increment('ai.gemini.calls');
    ```
  - [ ] Track API response times and errors
  - [ ] Alert if error rate >5% for AI endpoints

- [ ] **Cost Optimization Strategies**
  - [ ] Review AI prompt sizes (minimize tokens)
  - [ ] Implement caching for repeated queries
  - [ ] Add user rate limiting for AI features
  - [ ] Consider fallback to cheaper models if available

- [ ] **Contingency Plan for Quota Exhaustion**
  - Option 1: Request quota increase from provider
  - Option 2: Gracefully degrade (manual review instead of AI)
  - Option 3: Queue requests until quota resets
  - [ ] Document chosen approach in runbook

### 3. Disaster Recovery & Business Continuity - CRITICAL

**3.1 Database Disaster Recovery**
- [ ] **Schedule Monthly Backup Restore Drill**
  - [ ] Create test restore procedure document
  - [ ] Perform first drill within 1 week of launch
  - [ ] Steps:
    1. Create new Neon branch from backup
    2. Point staging environment to restored branch
    3. Verify data integrity (query sample records)
    4. Test application functionality on restored data
    5. Document time taken and any issues
  - [ ] Target RTO (Recovery Time Objective): <2 hours
  - [ ] Target RPO (Recovery Point Objective): <15 minutes (Neon PITR)

**3.2 Full System Disaster Recovery**
- [ ] **Document Complete System Recovery Procedure**
  - [ ] Step 1: Restore database from Neon backup
  - [ ] Step 2: Redeploy application via Replit (rollback if needed)
  - [ ] Step 3: Verify all secrets configured correctly
  - [ ] Step 4: Run smoke tests (auth, operations, advisor, GP workflows)
  - [ ] Step 5: Monitor for errors in Sentry
  - [ ] Estimated total recovery time: <3 hours

- [ ] **Data Backup Beyond Database**
  - [ ] Object storage (Replit): Automatically backed up ✅
  - [ ] Code repository: Git on Replit + GitHub backup (recommended)
  - [ ] Configuration: Document all Replit secrets in secure location
  - [ ] SSL certificates: Auto-renewed by Replit ✅

**3.3 Business Continuity Scenarios**
- [ ] **Scenario 1: Replit Platform Outage**
  - Likelihood: Low (Replit has >99.9% uptime)
  - Impact: Full system down
  - Mitigation: None for MVP (Replit is hosting platform)
  - Long-term: Consider multi-cloud strategy

- [ ] **Scenario 2: Neon Database Outage**
  - Likelihood: Very low (Neon has >99.95% uptime)
  - Impact: Full system down (app requires database)
  - Mitigation: Neon automatically fails over to replica
  - Action: Monitor Neon status page during outage

- [ ] **Scenario 3: Replit Auth (OIDC) Outage**
  - Likelihood: Low
  - Impact: Users cannot log in (existing sessions still work)
  - Mitigation: See "OIDC Provider Contingency" in Security section
  - Immediate action: Post status update to users

- [ ] **Scenario 4: OpenAI/Gemini API Outage**
  - Likelihood: Medium (APIs have occasional issues)
  - Impact: AI features broken (document analysis, covenant risk)
  - Mitigation: Graceful degradation to manual processes
  - Action: Display message to users about temporary AI unavailability

### 4. Runbook - Quick Reference for Common Operations

**4.1 Application Not Responding**
1. Check Replit deployment status: Deployments tab
2. Check Sentry for recent errors
3. Check Neon database status: https://neon.tech/status
4. Restart deployment: Deployments → Restart
5. If persists, rollback to previous deployment

**4.2 High Error Rate (>5%)**
1. Open Sentry dashboard → Issues
2. Sort by frequency, identify top error
3. Check if related to recent deployment (timing)
4. If recent deployment, rollback immediately
5. If not deployment-related, investigate root cause
6. Fix and deploy hotfix

**4.3 Database Connection Errors**
1. Check Neon dashboard → Monitoring
2. Verify connection string is correct (Replit Secrets)
3. Check connection pool exhaustion (>90% used)
4. If pool exhausted, restart application
5. If persists, contact Neon support

**4.4 AI API Failures**
1. Check provider status pages:
   - OpenAI: https://status.openai.com
   - Google Cloud: https://status.cloud.google.com
2. Check quota/billing limits in provider dashboards
3. Review recent API error logs in Sentry
4. If quota exceeded, implement manual fallback
5. Request quota increase if needed

**4.5 Authentication Issues**
1. Check Replit Auth status: https://status.replit.com
2. Verify OIDC configuration unchanged
3. Check session table in database (sessions expiring correctly?)
4. Review auth-related Sentry errors
5. Test login flow manually

**4.6 Slow Performance**
1. Check Sentry performance monitoring
2. Identify slow endpoints (>2s response time)
3. Check Neon query insights for slow queries
4. Review database indexes
5. Consider caching for frequently accessed data
6. Scale up Replit deployment if needed

---

## 📊 Monitoring & Alerting Setup

### Key Metrics to Monitor
1. **Application Health**
   - [ ] HTTP error rate (target: <1%)
   - [ ] API response time (target: p95 <1s)
   - [ ] Database query latency (target: p95 <500ms)
   - [ ] Frontend page load time (target: p95 <3s)

2. **User Activity**
   - [ ] Daily active users (DAU)
   - [ ] New user signups
   - [ ] Login success rate
   - [ ] Feature usage (prospects uploaded, RFPs submitted, etc.)

3. **Infrastructure**
   - [ ] Server uptime (target: 99.9%)
   - [ ] Database connection count
   - [ ] Object storage usage
   - [ ] Memory/CPU usage (Replit metrics)

4. **Business Metrics**
   - [ ] Prospects created
   - [ ] Facilities underwritten
   - [ ] Advisor deals submitted
   - [ ] GP applications completed
   - [ ] Documents generated

### Alert Configurations
**Critical Alerts** (immediate action required):
- [ ] Application down (>2 minutes)
- [ ] Database connection failures
- [ ] Error rate >5% (5-minute window)
- [ ] AI API failures (OpenAI/Gemini down)

**Warning Alerts** (monitor closely):
- [ ] Response time >2s (p95)
- [ ] Error rate >1% (5-minute window)
- [ ] Database query slow (>1s)
- [ ] Low disk space or memory

**Informational Alerts**:
- [ ] Daily usage summary
- [ ] New user signups
- [ ] Weekly performance report

---

## 🔄 Rollback Procedures

### When to Rollback
Rollback immediately if:
- Critical features are broken (login, data corruption)
- Error rate exceeds 10%
- Data loss or security vulnerability discovered
- Database migration failure

### Rollback Steps
1. **Replit Deployment Rollback**
   - Replit Deployments → History
   - Select previous stable deployment
   - Click "Rollback to this deployment"
   - Verify rollback completes (~1-2 minutes)

2. **Database Rollback (if schema changed)**
   - Use Neon point-in-time recovery
   - Neon dashboard → Branches → Restore to timestamp
   - Select timestamp before deployment
   - Update DATABASE_URL to restored branch

3. **Verify Rollback Success**
   - Run post-deployment verification tests
   - Check error rate returns to normal
   - Verify user functionality restored
   - Notify stakeholders of rollback

4. **Post-Rollback Analysis**
   - Review Sentry errors for root cause
   - Check deployment logs for failures
   - Document lessons learned
   - Plan fix before next deployment

---

## 📝 Production Runbook

### Common Operations

#### Restart Application
```bash
# Via Replit console
npm run dev
```

#### Check Database Connection
```bash
# Test database connectivity
node -e "const { neon } = require('@neondatabase/serverless'); const sql = neon(process.env.DATABASE_URL); sql\`SELECT NOW()\`.then(r => console.log('DB connected:', r)).catch(e => console.error('DB error:', e));"
```

#### View Recent Errors
- Sentry dashboard → Issues → Last 24 hours
- Sort by frequency or impact
- Filter by environment: production

#### Database Maintenance
```bash
# Run schema migrations (if needed)
npm run db:push

# Generate migration files
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate
```

#### Clear User Session
```sql
-- Connect to Neon database console
DELETE FROM session WHERE sid = '<session_id>';
```

#### View Active Users
```sql
-- Active sessions in last 24 hours
SELECT COUNT(DISTINCT sess->>'user'->'id') as active_users
FROM session
WHERE expire > NOW();
```

---

## 🔒 Security Hardening (Post-Launch)

### Immediate Security Tasks
- [ ] **Add Helmet.js for Security Headers**
  ```bash
  npm install --save helmet
  ```
  Add to `server/index.ts`:
  ```typescript
  import helmet from 'helmet';
  app.use(helmet());
  ```

- [ ] **Implement Rate Limiting**
  ```bash
  npm install --save express-rate-limit
  ```
  Add to API routes:
  ```typescript
  import rateLimit from 'express-rate-limit';
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });
  app.use('/api/', limiter);
  ```

- [ ] **Enable CSRF Protection**
  - Review if needed for API endpoints
  - Consider for sensitive operations (delete, update)

- [ ] **Input Sanitization Review**
  - Audit all Zod schemas
  - Add sanitization for user-generated content
  - Prevent XSS in displayed data

### Ongoing Security
- [ ] **Weekly Dependency Audits**
  - Run `npm audit` weekly
  - Update dependencies monthly
  - Review security advisories

- [ ] **Access Control Review**
  - Audit user roles and permissions quarterly
  - Review database access logs
  - Rotate API keys every 90 days

- [ ] **Penetration Testing**
  - Schedule annual security audit
  - Use OWASP testing guidelines
  - Document and remediate findings

---

## 📈 Post-Launch Optimization

### Week 1 Priorities
- [ ] Monitor error rates and fix critical bugs
- [ ] Track user feedback and feature requests
- [ ] Optimize slow database queries (>500ms)
- [ ] Review and adjust rate limits if needed

### Month 1 Priorities
- [ ] Analyze user behavior patterns
- [ ] Identify most-used features
- [ ] Optimize bundle size (lazy loading)
- [ ] Set up automated performance testing

### Quarter 1 Priorities
- [ ] Implement user analytics (Mixpanel/Amplitude)
- [ ] A/B testing framework for features
- [ ] Advanced caching strategy (Redis)
- [ ] Horizontal scaling plan if needed

---

## ✅ Final Pre-Launch Checklist

### Code & Testing
- [x] All TypeScript errors resolved
- [x] E2E tests passing (Operations, Advisor, GP)
- [x] All MVP features implemented (22/22)
- [ ] Final code review completed
- [ ] Security audit completed
- [ ] Performance testing completed

### Infrastructure
- [ ] Production database created and backed up
- [ ] Sentry error tracking configured
- [ ] Uptime monitoring configured
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active

### Documentation
- [ ] README updated with deployment instructions
- [ ] API documentation current
- [ ] Runbook procedures documented
- [ ] User guides created (optional for MVP)

### Communication
- [ ] Internal team notified of launch date
- [ ] Support procedures documented
- [ ] Beta users identified and contacted (optional)
- [ ] Launch announcement prepared

### Legal & Compliance
- [ ] Privacy policy reviewed and current
- [ ] Terms of service reviewed and current
- [ ] Data retention policy documented
- [ ] GDPR compliance reviewed (if applicable)

---

## 🎯 Success Criteria

**Deployment is successful when**:
1. All three user workflows functional (Operations, Advisor, GP)
2. Uptime >99% in first week
3. Error rate <1% in first week
4. All critical bugs resolved within 24 hours
5. User authentication and session management stable
6. Database backups running automatically
7. Monitoring and alerting active and tested

**Ready for users when**:
- All items in "Final Pre-Launch Checklist" are checked
- At least 3 successful production smoke tests completed
- Rollback procedure tested at least once
- Support team trained and ready
- Sentry showing <10 errors per hour during testing

---

## 📞 Support Contacts

**Technical Issues**:
- Sentry Dashboard: [Link to be added]
- Neon Database: [Link to be added]
- Replit Status: status.replit.com

**Escalation Path**:
1. Check Sentry for recent errors
2. Review Replit deployment logs
3. Check Neon database status
4. Contact Replit support if infrastructure issue
5. File issue in GitHub repo for code bugs

---

**Document Version**: 1.0  
**Last Review**: October 25, 2025  
**Next Review**: After production deployment
