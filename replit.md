# AlphaNAV - NAV Lending Operations Platform

## Overview
AlphaNAV is a comprehensive NAV (Net Asset Value) lending operations platform for private equity fund lenders. Its core purpose is to automate critical operational workflows such as underwriting, monitoring, reporting, and legal document generation, targeting a 90% automation rate. The platform aims for significant operational efficiency gains and 100 basis points in operational alpha, initially for internal teams with future expansion to external users. Key capabilities include AI-powered data extraction, automated eligibility scoring, risk assessment, LTV calculation with stress testing, and legal document generation. The project also includes robust security features like Multi-Factor Authentication and a production-ready subscription system with tiered pricing and feature gates.

## Recent Implementations (October 2025)

### Phase 1B: Advanced Analytics Dashboard (Complete)
- **Analytics Service**: Created comprehensive analytics service with platform metrics and efficiency trends calculations
- **API Endpoints**: 
  - `/api/analytics/platform-metrics` - Returns KPI cards (active facilities, covenants monitored, time saved, cost savings) and activity breakdowns
  - `/api/analytics/efficiency-trends` - Returns daily time series data for efficiency trends visualization
- **Frontend Dashboard**: Multi-tab analytics page featuring:
  - Activity Breakdown: Pie chart showing distribution across Document Processing, Covenant Monitoring, Risk Analysis, and Reporting workflows
  - Efficiency Trends: Line chart tracking daily time savings and automation efficiency percentages
  - Workflow Comparison: Bar chart comparing automation levels across different workflow types
- **UX Features**: Loading states, error handling with explicit error messages, numeric data validation for chart rendering

### Phase 1C: Pipeline Board (Complete)
- **Kanban UI**: Drag-and-drop deal pipeline board with 7 stages (Lead → Evaluation → Due Diligence → Underwriting → Documentation → Closing → Won/Lost)
- **Pipeline API**: RESTful endpoints with full CRUD operations:
  - `GET /api/pipeline/deals` - Fetch all deals for current user (multi-tenant scoped)
  - `POST /api/pipeline/deals` - Create new deal with userId stamping
  - `PATCH /api/pipeline/deals/:id/move` - Move deal between stages with ownership verification
- **Database Schema**: Extended `deals` table with pipeline-specific fields (userId, priority, advisorName, gpName, notes)
- **Security**: Multi-tenant data isolation enforced at query level - all endpoints filter by userId, preventing cross-tenant data exposure
- **UX Features**: Toast notifications on success/error, deal creation dialog with priority selection, visual priority indicators

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

### Authentication & Authorization
- **Provider**: Replit Auth (OIDC).
- **Session Management**: PostgreSQL-backed sessions.
- **Roles**: operations, advisor, gp, admin, with multi-tenancy for GPs.
- **Security**: Multi-Factor Authentication (MFA) with TOTP and backup codes, AES-256-GCM encryption for secrets, session binding, rate limiting, and re-authentication for sensitive operations.

### UI/UX Decisions
- Dark mode default, professional typography (Inter, JetBrains Mono, `tabular-nums`).
- UI components (shadcn/ui, Radix UI) for accessibility, customizability, and enterprise aesthetics.

### Technical Implementations
- Monorepo structure, serverless-first database, component library approach with shadcn/ui.
- Job scheduler using `node-cron` for automated tasks.
- OAuth2 server infrastructure for public API access with client credentials flow, including client management and scope-based authorization.
- Versioned REST API (`/api/v1/public/*`) with OAuth2 protection.
- Production-ready subscription system with feature gates, automated upgrade prompts, and role-based access control.
- Fund Administrator Integration system for syncing NAV data from multiple providers.

### Feature Specifications
- **Core Platform Features**: Marketing Website, Notification System, GP Facility Management, Global Search, Data Export, Help System & Onboarding.
- **AI Integration**: Gemini AI for document data extraction, eligibility assessment, covenant breach risk analysis.
- **Automation**: Automated Legal Document Generation, Covenant Monitoring and Compliance Tracking.
- **Workflow APIs**: Endpoints for draw requests, cash flow, portfolio analytics, and advisor functions.
- **Billing System**: Production-ready Stripe integration.
- **Analytics Dashboard**: Comprehensive portfolio analytics with ROI, stress testing, concentration analysis, and performance metrics.
- **Automation Features**: AI Accuracy Validation Framework, 10-Point Eligibility Scoring System, LTV Calculator with Stress Testing, Automated Risk Flags Detection.
- **Advanced Features**: Batch Document Processing, Portfolio Company Extraction, Credit Agreement Parsing, Predictive Breach ML Model (heuristic-based), Slack/SMS Integration, Market Intelligence Dashboard, Lender Directory, Public API with OAuth2, Fund Administrator Integrations, SOC 2 Prep.

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
- **Email Service**: Resend.
- **Messaging/Notifications**: Twilio, Slack webhooks.
- **Fund Administrators**: SS&C Intralinks, Alter Domus, Apex Fund Services.