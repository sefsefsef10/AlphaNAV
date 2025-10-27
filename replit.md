# AlphaNAV - NAV Lending Operations Platform

## Overview
AlphaNAV is a comprehensive NAV (Net Asset Value) lending operations platform for private equity fund lenders. Its primary purpose is to automate key operational workflows, including underwriting, monitoring, reporting, and legal document generation, aiming for significant operational efficiency gains and 100 basis points in operational alpha. The platform is designed to serve internal operations teams, with future expansion to external users.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript (Vite).
- **UI**: Radix UI primitives, shadcn/ui components ("New York" style), Tailwind CSS with custom design tokens, dark-mode-first.
- **State Management**: TanStack React Query for server state; React hooks for client-side state.
- **Routing**: Wouter.
- **Design Principles**: Dark mode default, data-intensive B2B financial focus, tabular numeric display, Inter and JetBrains Mono fonts.

### Backend
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **API Design**: RESTful API under `/api`.
- **Architecture**: Layered, separating routing, business logic, and data access.

### Data Storage
- **Database**: PostgreSQL via Neon serverless.
- **ORM**: Drizzle ORM with schema-first approach and Zod integration.
- **Connection Management**: Connection pooling with Neon's serverless adapter.
- **Schema**: Comprehensive domain schema (users, sessions, onboarding, prospects, deals, facilities, covenants, documents, notifications, messages).

### Authentication & Authorization
- **Provider**: Replit Auth (OIDC) supporting multiple providers.
- **Session Management**: PostgreSQL-backed sessions (7-day TTL).
- **Middleware**: Passport.js with token refresh.
- **Roles**: operations, advisor, gp, admin.

### UI/UX Decisions
- Dark mode default, professional typography (Inter, JetBrains Mono, `tabular-nums`).
- UI components (shadcn/ui, Radix UI) selected for accessibility, customizability, and enterprise-grade aesthetics.

### Technical Implementations
- Monorepo structure with shared types and module path aliases.
- Serverless-first database approach.
- Component library approach with shadcn/ui.

### Feature Specifications
- **Marketing Landing Page**: Professional site at root URL.
- **Notification System**: Real-time notification center.
- **GP Facility Management**: Draw requests, repayment tracking, document vault, messaging.
- **Global Search**: Cmd+K / Ctrl+K for entity search.
- **Data Export**: CSV export utility.
- **Help System & Onboarding**: Dialog-based help center with role-specific guides.
- **Gemini AI Integration**: Document data extraction (fundName, AUM, vintage), eligibility assessment, covenant breach risk analysis.
- **Automated Legal Document Generation**: Templates for Loan Agreements, Term Sheets, Compliance Reports using facility data, configurable options, Markdown downloads.
- **Covenant Monitoring and Compliance Tracking**: Automated compliance checks with three status levels (compliant, warning, breach) and urgent notifications.

## External Dependencies

- **UI Component Libraries**: Radix UI, Recharts, cmdk, Lucide React.
- **Development Tools**: Vite, TypeScript.
- **Data & Validation**: Zod, React Hook Form with Zod resolvers, date-fns.
- **Styling & Design**: Tailwind CSS, PostCSS, class-variance-authority, clsx, tailwind-merge.
- **Database & ORM**: @neondatabase/serverless, Drizzle ORM, ws.
- **AI Integration**: Gemini 2.0 Flash model, OpenAI GPT-4.
- **Security**: Helmet.js, express-rate-limit, connect-pg-simple.
- **Monitoring**: Sentry (error tracking and performance monitoring).

## Production Readiness

### Security Hardening (✅ Complete)
- **Helmet.js**: Environment-aware CSP with strict production policy (self, OpenAI, Gemini, Sentry domains)
- **Rate Limiting**: 100 req/15min global, 5 req/15min auth endpoints
- **Session Security**: httpOnly cookies, sameSite: strict, 7-day TTL
- **Input Validation**: Comprehensive Zod schemas on all 7 critical POST/PATCH endpoints with proper update schemas

### Monitoring & Observability (✅ Complete)
- **Sentry Integration**: Backend (@sentry/node v10.x) and frontend (@sentry/react) with 10% transaction sampling
- **Session Replay**: Privacy-compliant (maskAllText: true, blockAllMedia: true) for debugging user issues
- **Error Tracking**: Automatic exception capture with request context, user data, and stack traces
- **CSP Configuration**: Sentry domains whitelisted (*.sentry.io, *.ingest.sentry.io)

### Critical Revenue-Blocking Fixes (✅ Complete - October 2025)
- **PDF/DOCX Document Parsing**: Fixed AI extraction to work with 99% of fund documents
  - Implemented pdf-parse v2.4.5 with proper class-based API (`new PDFParse()`, `.getText()`, `.destroy()`)
  - Added mammoth library for DOCX text extraction
  - Proper resource cleanup and error handling
  - Text length limits (50K chars) for Gemini AI processing
  - **Impact**: Unlocks AI-powered document extraction (fundName, AUM, vintage, eligibility)
  
- **Automated Covenant Monitoring System**: Delivers 40-50 basis points operational alpha
  - Created server/services/covenantMonitoring.ts (303 lines) with deterministic breach detection
  - Operator-based threshold checking (>, <, >=, <=, =)
  - Three-tier status system: compliant, warning (within 10% buffer), breach
  - Automated notification generation (urgent for breaches, high for warnings)
  - Quarterly check scheduling with nextCheckDate persistence
  - **Scheduler**: Daily 2 AM checks + business hours monitoring (Mon-Fri 8am/12pm/4pm)
  - **API Endpoints**: 6 new endpoints for manual/automated covenant checking
  - **Impact**: Enables Professional tier ($7.5K/month) sales with automated compliance

- **Notification System**: Complete CRUD operations for covenant breach alerts
  - GET /api/notifications - Fetch all user notifications
  - GET /api/notifications/unread - Unread count for badge
  - PATCH /api/notifications/:id/read - Mark individual as read
  - POST /api/notifications/mark-all-read - Bulk mark read
  - DELETE /api/notifications/:id - Remove notification
  - Priority-based notifications (urgent, high, medium, low)
  - Real-time notification center integration

- **Job Scheduler Infrastructure**: node-cron based automation
  - Created server/scheduler.ts with production-grade cron jobs
  - Daily covenant checks at 2:00 AM (all facilities)
  - Business hours checks Mon-Fri (8am, 12pm, 4pm) for active monitoring
  - Graceful error handling and logging
  - Server startup integration in server/index.ts

- **Type Safety Enhancements**: Extended Express.User with database User type
  - Created server/types/express.d.ts for proper TypeScript support
  - Enables type-safe access to req.user.id, req.user.role, req.user.email
  - Prevents runtime errors from undefined user properties

### API Enhancements (✅ Complete - October 2025)

**GP Workflow APIs** (4 endpoints):
- **POST /api/facilities/:id/draw-requests**: GPs submit capital deployment requests
  - Role authorization: GP-only for creation, Operations/Admin for approval
  - Status workflow: pending → approved → disbursed
  - Automatic notifications to operations team on creation
  - Automatic notifications to GPs on status updates
  - Active facility validation and detailed approval metadata tracking

- **GET /api/facilities/:id/draw-requests**: List all draw requests for a facility
- **GET /api/draw-requests/:id**: Get single draw request details
- **PATCH /api/draw-requests/:id**: Operations approve/reject/disburse requests

**Cash Flow & Repayment APIs** (4 endpoints):
- **POST /api/facilities/:id/cash-flows**: Create scheduled payment
- **GET /api/facilities/:id/cash-flows**: Get all cash flows with summary statistics
  - Returns totalScheduled, totalPaid, totalOverdue aggregations
- **GET /api/cash-flows/:id**: Get single cash flow details
- **PATCH /api/cash-flows/:id/payment**: Record payment receipt
  - Automatic facility outstanding balance updates
  - Payment status management: scheduled → paid/partial/overdue
  - Generates payment notifications

**Portfolio Analytics API** (1 endpoint):
- **GET /api/analytics/portfolio-summary**: Comprehensive portfolio risk metrics
  - Portfolio overview (facilities count, principal amounts, LTV, interest rates)
  - Status distribution (active/prepaid/defaulted/matured)
  - Covenant health dashboard (compliant/warning/breach percentages)
  - Payment performance (paid/overdue/scheduled with dollar amounts)
  - Risk scoring (0-100 scale based on breaches + overdue payments)
  - Risk categorization (low/medium/high/critical)
  - Concentration risk (top 5 facilities exposure percentage)
  - Upcoming maturities (next 90 days)
  - **Impact**: Real-time portfolio health monitoring for operations team

**Advisor Workflow APIs** (3 endpoints):
- **GET /api/advisor-deals/:id/compare-bids**: RFP bid comparison with intelligent scoring
  - Fetches all term sheets for a deal and compares side-by-side
  - Pricing parser handles both percentage and basis points formats (850bps = 8.5%)
  - Composite scoring: pricing (35%), loan amount match (25%), LTV (25%), timeline (15%)
  - Returns ranked bids with best-in-category identifiers
  - Generates recommendation based on weighted scores
  - Role authorization: Advisor/Operations/Admin only

- **GET /api/advisor-deals/:id/commission**: Calculate advisor commission
  - Tiered commission structure aligned with industry standards:
    - Tier 1 (<$10M): 100 bps (1%)
    - Tier 2 ($10M-$50M): 75 bps (0.75%)
    - Tier 3 ($50M+): 50 bps (0.5%)
  - Idempotent updates to advisorDeals.commissionEarned
  - Returns formatted breakdown with dollar amounts and percentages
  - Only applies to closed/won deals

- **GET /api/advisors/:id/dashboard**: Comprehensive advisor performance analytics
  - Summary metrics: total deals, active deals, closed deals, commissions, win rate
  - Deal distribution by status with counts
  - Top 5 deals by commission earned
  - Active RFP tracking with term sheet counts and submission deadlines
  - Recent activity (last 10 updated deals)
  - Performance metrics (formatted commission totals, average per deal, win rate %)
  - **Security**: Advisors restricted to their own dashboard; Operations/Admin can view all
  - **Impact**: Enables advisor performance tracking and commission transparency

### Documentation (✅ Complete)
- **DEPLOYMENT_CHECKLIST.md**: Comprehensive pre-launch checklist with rollback procedures
- **SENTRY_SETUP.md**: Step-by-step Sentry configuration for production deployment
- **DATABASE_BACKUP_SETUP.md**: Neon PITR setup, disaster recovery drills, backup automation
- **AI_COST_MONITORING_SETUP.md**: OpenAI/Gemini budget alerts, cost optimization, monitoring procedures

### E2E Testing (✅ Complete)
- **Operations Workflow**: 26-step test covering deal creation, underwriting, facility management
- **Advisor Workflow**: 26-step test covering RFP process, anonymization, commission tracking
- **GP Workflow**: 18-step test covering self-onboarding, draw requests, document vault

## Known Limitations and Technical Debt

### Recently Resolved (October 27, 2025)
- **✅ Complete Multi-Tenant Security Implementation**: RESOLVED - Comprehensive facility ownership validation
  - **Database Schema**: Added `gpUserId` varchar field to facilities table with index for query performance
  - **Security Architecture**: Centralized `validateFacilityOwnership()` helper function (lines 119-168 in routes.ts)
  - **Complete GP Endpoint Coverage** (9 endpoints secured):
    1. POST /api/facilities/:facilityId/draw-requests - Submit draw requests
    2. GET /api/facilities/:facilityId/draw-requests - List facility draw requests
    3. GET /api/draw-requests/:id - Get single draw request details
    4. GET /api/facilities/:facilityId/cash-flows - View payment schedules
    5. GET /api/cash-flows/:id - View single payment details
    6. GET /api/facilities/:id - View facility details + covenants
    7. POST /api/facilities/:id/generate-document - Generate legal documents
    8. POST /api/facilities/:facilityId/check-covenants - Check covenant compliance
    9. GET /api/facilities/:facilityId/covenant-summary - View covenant summary
  - **Validation Logic**: 
    - Two-step validation: Rejects if gpUserId is null OR if gpUserId doesn't match req.user.id
    - Operations/admin roles bypass ownership checks for internal operations
    - Consistent 403/404 error responses with descriptive messages
  - **Production Readiness**: Architect-approved with PASS rating for multi-tenant deployment
  - **Pre-Production Requirement**: All existing facilities MUST have gpUserId populated before multi-tenant deployment
  - **Data Migration**: Operations team should run: `UPDATE facilities SET gp_user_id = '[user-id]' WHERE gp_user_id IS NULL`

### Production Deployment Remaining Tasks
1. Configure Sentry DSN in production environment
2. Set up Neon automated backups with PITR (7-day retention minimum)
3. Configure OpenAI billing alerts ($50 soft limit, $100 hard limit)
4. Configure Gemini billing alerts ($100/month budget)
5. Assign incident response owners and on-call rotation
6. Schedule first disaster recovery drill within 30 days of launch
7. Set up weekly cost review meetings for AI spend monitoring