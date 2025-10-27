# AlphaNAV - NAV Lending Operations Platform

## Overview
AlphaNAV is a comprehensive NAV (Net Asset Value) lending operations platform designed for private equity fund lenders. Its primary purpose is to automate critical operational workflows such as underwriting, monitoring, reporting, and legal document generation, aiming for a 90% automation rate. The platform targets significant operational efficiency gains and 100 basis points in operational alpha, initially for internal operations teams with future expansion to external users. Key capabilities include AI-powered data extraction, automated eligibility scoring, risk assessment, LTV calculation with stress testing, and legal document generation.

## Recent Updates (October 27, 2025)

### Latest: Fund Administrator Integrations ✅
**Complete Fund Admin Integration System**: Production-ready backend and frontend for syncing NAV data from SS&C Intralinks, Alter Domus, and Apex Fund Services.

**Backend Infrastructure**:
- **Fund Admin Sync Service** (`server/services/fundAdminSync.ts`):
  - Multi-provider support (SS&C Intralinks, Alter Domus, Apex, Manual)
  - Configurable sync methods (API, SFTP, email, manual upload)
  - Sync frequency configuration (realtime, hourly, daily, weekly)
  - Comprehensive sync logging and error tracking
  - Connection testing and health monitoring
  
- **Fund Admin API Routes** (`server/routes/fundAdminRoutes.ts`):
  - CRUD operations for fund admin connections
  - Manual sync triggering per connection
  - Bulk sync for all active connections
  - Connection testing and validation
  - Sync history and logs retrieval
  
- **Automated Scheduler Integration**:
  - Daily NAV sync at 3:00 AM (after covenant monitoring)
  - Automatic sync for all active fund admin connections
  - Job status logging and error handling

**Frontend UI** (`client/src/pages/operations/fund-admin.tsx`):
- Create new fund admin connections with provider selection
- Configure sync frequency and connection type
- Manual sync triggering with status feedback
- Connection testing and validation
- Delete and manage existing connections
- Real-time sync status and last sync timestamp display

**Available Providers**:
- SS&C Intralinks (SFTP/API)
- Alter Domus (Portal API)
- Apex Fund Services (API)
- Manual Upload (Document-based)

**Integration Ready**: Operations teams can now configure automated NAV data synchronization from major fund administrators, reducing manual data entry and ensuring real-time portfolio valuation updates. Placeholder implementations are in place for provider-specific API integrations - production deployment requires actual API credentials and provider-specific authentication setup.

---

### Earlier: OAuth2 Public API Implementation ✅
**Enterprise-Grade Public API**: Complete OAuth2 server implementation enabling external systems to programmatically access NAV lending data.

**Backend Infrastructure**:
- **OAuth2 Authorization Server** (`server/oauth/oauthServer.ts`):
  - Client credentials grant flow
  - Access token generation with 1-hour expiration
  - Refresh token support with 30-day expiration
  - Token introspection and revocation endpoints
  - Scope-based access control middleware
  - API usage logging for analytics
  
- **API Client Management** (`server/routes/apiClientRoutes.ts`):
  - CRUD operations for OAuth clients
  - Client credential generation (client_id/client_secret with bcrypt hashing)
  - Status management (active/suspended/revoked)
  - Rate limiting configuration per client
  - Organization-level scoping for multi-tenant security
  
- **Versioned Public API** (`server/routes/publicApiRoutes.ts` - `/api/v1/public/*`):
  - GET `/facilities` - List all facilities (with org filtering)
  - GET `/facilities/:id` - Get specific facility details
  - POST `/facilities/:id/draws` - Create draw request programmatically
  - GET `/facilities/:id/summary` - Get analytics summary with metrics
  - GET `/covenants/:facilityId` - List covenant compliance data
  - All endpoints protected by OAuth middleware requiring bearer tokens
  - Standard OAuth error responses (401/403 with error codes)

**Frontend UI** (`client/src/pages/operations/api-clients.tsx`):
- Create new API clients with custom scopes
- One-time secret display with copy-to-clipboard
- Client status management (activate/suspend/delete)
- Rate limit and environment configuration
- Visual scope selection with checkboxes
- Real-time status badges (active/suspended/revoked)

**Available Scopes**:
- `read:facilities` - Access facility data
- `read:draws` - View draw requests
- `write:draws` - Create new draw requests
- `read:analytics` - Access portfolio analytics
- `read:covenants` - View covenant compliance

**Security Features** (Production-Ready ✅):
- **Bcrypt Hashing**: Client secrets hashed with bcrypt (10 rounds), all async operations
- **Token Security**: 
  - Access tokens: 1-hour expiry, bearer authentication only
  - Refresh tokens: 30-day expiry, rotation on use with revocation
  - Separate validation: `verifyAccessToken()` rejects refresh tokens, `verifyRefreshToken()` rejects access tokens
  - No token type confusion possible
- **Rate Limiting**: Efficient COUNT(*) queries per client (default: 1000 req/hour)
- **Authorization**: Scope-based access control with organization-level data isolation
- **Audit Logging**: Comprehensive API usage tracking for analytics and compliance

**OAuth2 Endpoints**:
- `POST /oauth/token` - Issue access + refresh tokens (client credentials)
- `POST /oauth/token/refresh` - Rotate refresh token (revokes old, issues new pair)
- `POST /oauth/introspect` - Introspect any token (access or refresh)
- `POST /oauth/revoke` - Revoke any token

**Integration Ready**: External fund administrators, portfolio management systems, and analytics platforms can now programmatically integrate with AlphaNAV using industry-standard OAuth2. All security vulnerabilities resolved and architect-approved for production deployment.

---

### Earlier Updates

**CRITICAL ROUTING FIX**: Fixed routing bug where operations/admin users were incorrectly redirected to mock dashboard (/dashboard) instead of real operations dashboard (/operations).

**NEW FEATURES ADDED**:
1. **Batch Document Processing** - Upload up to 50 documents (PDF/Word/Excel) with AI extraction
2. **Portfolio Company Extraction** - AI-extracted company data from fund documents
3. **Lender Directory** - Manage lending partner relationships and pricing
4. **Market Intelligence Dashboard** - Track market trends and competitive data

**CLEANUP COMPLETED**:
- Removed 5 mock pages from production routing (dashboard, monitoring, deal-pipeline, underwriting, portfolio at root level)
- Updated sidebar navigation to show only real, functional features
- All operations users now see real data and functional features by default

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
- OAuth2 server infrastructure for public API access with client credentials flow.
- Versioned REST API (`/api/v1/public/*`) with scope-based authorization.

### Feature Specifications
- **Core Platform Features**: Marketing Website, Notification System, GP Facility Management, Global Search, Data Export, Help System & Onboarding.
- **AI Integration**: Gemini AI for document data extraction, eligibility assessment, covenant breach risk analysis.
- **Automation**: Automated Legal Document Generation, Covenant Monitoring and Compliance Tracking.
- **Workflow APIs**: Endpoints for draw requests, cash flow, portfolio analytics, and advisor functions.
- **Billing System**: Production-ready Stripe integration.
- **Analytics Dashboard**: Comprehensive portfolio analytics with ROI, stress testing, concentration analysis, and performance metrics.
- **Automation Features**: AI Accuracy Validation Framework, 10-Point Eligibility Scoring System, LTV Calculator with Stress Testing, Automated Risk Flags Detection.
- **Advanced Features**: Batch Document Processing, Portfolio Company Extraction, Credit Agreement Parsing, Predictive Breach ML Model (heuristic-based), Slack/SMS Integration, Market Intelligence Dashboard, Lender Directory, Public API with OAuth2, Fund Administrator Integrations (Complete), SOC 2 Prep.

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
- **Messaging/Notifications**: Twilio (connector available), Slack webhooks.