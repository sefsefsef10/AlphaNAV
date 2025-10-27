# AlphaNAV - NAV Lending Operations Platform

## Overview
AlphaNAV is a comprehensive NAV (Net Asset Value) lending operations platform designed for private equity fund lenders. Its core purpose is to automate critical operational workflows such as underwriting, monitoring, reporting, and legal document generation. The platform aims to achieve significant operational efficiency gains and 100 basis points in operational alpha, primarily serving internal operations teams with future expansion to external users. Key capabilities include AI-powered data extraction, automated eligibility scoring, risk assessment, LTV calculation with stress testing, and legal document generation, targeting a 90% automation rate for core processes.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript (Vite).
- **UI**: Radix UI primitives, shadcn/ui components ("New York" style), Tailwind CSS, dark-mode-first.
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
- **Schema**: Comprehensive domain schema covering users, deals, facilities, documents, and notifications.

### Authentication & Authorization
- **Provider**: Replit Auth (OIDC).
- **Session Management**: PostgreSQL-backed sessions.
- **Roles**: operations, advisor, gp, admin, with multi-tenancy for GPs.

### UI/UX Decisions
- Dark mode default, professional typography (Inter, JetBrains Mono, `tabular-nums`).
- UI components (shadcn/ui, Radix UI) for accessibility, customizability, and enterprise aesthetics.

### Technical Implementations
- Monorepo structure, serverless-first database, component library approach with shadcn/ui.
- Job scheduler using `node-cron` for automated tasks.

### Feature Specifications
- **Marketing Website**: B2B SaaS marketing site with five pages, lead capture.
- **Notification System**: Real-time alerts.
- **GP Facility Management**: Draw requests, repayment tracking, document vault, messaging.
- **Global Search**: Cmd+K / Ctrl+K for entity search.
- **Data Export**: CSV export utility.
- **Help System & Onboarding**: Dialog-based, role-specific guides.
- **AI Integration**: Gemini AI for document data extraction (e.g., fundName, AUM), eligibility assessment, covenant breach risk analysis.
- **Automated Legal Document Generation**: Templates for Loan Agreements, Term Sheets, Compliance Reports.
- **Covenant Monitoring and Compliance Tracking**: Automated checks with notifications.
- **Workflow APIs**: Endpoints for draw requests, cash flow, portfolio analytics, and advisor functions.
- **Billing System**: Production-ready Stripe integration for subscriptions, usage tracking, and invoice management.
- **Analytics Dashboard**: Comprehensive portfolio analytics with ROI, stress testing (baseline, moderate, severe NAV decline), concentration analysis (sector, vintage, GP), and performance metrics (ROI, default rate, recovery rate).

### Automation Features (70% → 90% Target)
- **AI Accuracy Validation Framework**: Ground truth validation, accuracy scoring (Levenshtein distance, 95% threshold), confidence threshold enforcement, and a metrics dashboard.
- **10-Point Eligibility Scoring System**: Automated prospect scoring based on fund size, vintage, track record, diversification, and LTV potential, providing 'Strong', 'Review', or 'Decline' recommendations.
- **LTV Calculator with Stress Testing**: Calculates LTV under baseline, moderate (-20% NAV), and severe (-40% NAV) stress scenarios with automated recommendations and covenant monitoring.
- **Automated Risk Flags Detection**: Identifies risks across concentration, vintage, portfolio distress, covenant, and market, with a scoring system for overall risk assessment (High, Medium, Low).
- **Automation Impact**: Achieves significant time savings (3-5 hours per prospect intake, 30-60 min per underwriting, 1-2 hours per monitoring review) and the target 100 basis points operational alpha.

## External Dependencies

- **UI Component Libraries**: Radix UI, Recharts, cmdk, Lucide React, shadcn/ui.
- **Development Tools**: Vite, TypeScript.
- **Data & Validation**: Zod, React Hook Form, date-fns.
- **Styling & Design**: Tailwind CSS, PostCSS.
- **Database & ORM**: @neondatabase/serverless, Drizzle ORM.
- **AI Integration**: Gemini 2.0 Flash model, OpenAI GPT-4.
- **Security**: Helmet.js, express-rate-limit, connect-pg-simple.
- **Monitoring**: Sentry.
- **Document Parsing**: `pdf-parse`, `mammoth`.
- **Scheduling**: `node-cron`.
- **Payment Processing**: Stripe.
- **Email Service**: Resend (pending setup).

## Recent Bug Fixes & Technical Debt Resolution

### Critical Bug Fixes (October 2025)
1. **User Authentication Email Conflict (FIXED)**
   - **Issue**: When a user logged in with the same email but different OIDC ID, the system attempted to update the user's primary key, breaking referential integrity.
   - **Fix**: Modified `upsertUser` in `server/dbStorage.ts` to preserve the existing user ID when matching by email, updating only profile fields (firstName, lastName, profileImageUrl, role, advisorId).
   - **Impact**: Maintains referential integrity with related records (facilities, draws, documents) and prevents authentication failures.

2. **Analytics Page Runtime Errors (FIXED)**
   - **Issue**: Analytics page crashed with "Cannot read properties of undefined (reading 'toFixed')" when `paymentPerformance` or `riskMetrics` were undefined.
   - **Fix**: Added `safePortfolioData` wrapper in `client/src/pages/analytics.tsx` that provides default values for missing properties.
   - **Impact**: Analytics page loads gracefully even when portfolio data is incomplete or empty.

3. **API Response Structure Mismatch (FIXED)**
   - **Issue**: `/api/analytics/portfolio-summary` returned a different structure than the frontend `PortfolioSummary` interface expected, causing undefined errors.
   - **Fix**: Updated `server/routes.ts` to return correct field names (`totalCashFlows`, `paidCount`, `overdueCount`, `scheduledCount`) and added missing percentage fields (`overduePercentage`, `scheduledPercentage`).
   - **Impact**: Frontend and backend now fully aligned, eliminating runtime errors in analytics views.

### Recommended Future Improvements
- Add regression tests for email collision scenarios in user authentication
- Extend analytics integration tests to validate API response shapes
- Monitor production logs for auth edge cases (e.g., missing email from OIDC providers)

## Mock Data Replacement Progress (October 2025)

### Priority 0 Fix: Replace Mock Data with Real API Calls

**Completed (2/5 pages):**
1. ✅ **monitoring.tsx** - Fully connected to real APIs
   - Added 3 new monitoring API endpoints: GET /api/monitoring/covenants, GET /api/monitoring/health-scores, GET /api/monitoring/stats
   - Replaced all mock covenants, health scores, and alerts with real data from backend
   - Implemented mutations for acknowledging alerts and running manual covenant checks
   - All stats (compliant/warning/breach counts and percentages) now use real data

2. ✅ **dashboard.tsx** - Partially connected to real APIs
   - KPI cards (Total Portfolio, Active Deals, Avg Deal Size, Risk Alerts) now use real data from /api/analytics/portfolio-summary
   - Pipeline health (Lead Identification, Underwriting, Approved, Monitoring) now shows real counts from prospects and facilities
   - Recent deals table now uses real facility data
   - **REMAINING**: Portfolio chart still uses mock time-series data (only last point is real)

**Remaining Work (3/5 pages):**
3. ⏳ **deals.tsx** - Needs to fetch from /api/facilities and convert to deals format
4. ⏳ **deal-pipeline.tsx** - Needs to fetch from /api/deals filtered by stage  
5. ⏳ **origination.tsx** - Needs to fetch from /api/prospects

**Backend API Enhancements Needed:**
- Add time-series portfolio data endpoint for historical portfolio chart
- Add canonical stage and risk score fields to facilities API to avoid client-side synthesis
- Implement predictive breach model endpoint for monitoring predictions panel (currently empty)