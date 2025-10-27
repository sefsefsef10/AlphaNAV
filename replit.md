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
- **Multi-tenancy**: Implemented comprehensive facility ownership validation, ensuring GPs can only access their own facilities, with Operations/Admin roles bypassing these checks.

### UI/UX Decisions
- Dark mode default, professional typography (Inter, JetBrains Mono, `tabular-nums`).
- UI components (shadcn/ui, Radix UI) selected for accessibility, customizability, and enterprise-grade aesthetics.

### Technical Implementations
- Monorepo structure with shared types and module path aliases.
- Serverless-first database approach.
- Component library approach with shadcn/ui.
- Job scheduler infrastructure using `node-cron` for automated tasks like covenant checks.

### Testing Infrastructure
- **HTTP Integration Tests**: 28 automated tests across 9 test groups (100% pass rate)
  - Multi-tenant isolation (GPs access only own facilities)
  - Authorization enforcement (draw requests, cash flows, documents, covenants)
  - Operations/Admin bypass validation
  - Portfolio analytics access control
  - Edge case handling (404, 401 responses)
- **Test Authentication**: Production-safe bypass (NODE_ENV=test only) with header injection
- **Test Fixtures**: 5 deterministic test facilities (facility-1 through facility-5) with GP ownership
- **CI/CD Automation**: GitHub Actions workflow for automated test execution on push/PR
- **Documentation**: Comprehensive TESTING_PLAN.md with extension guide and roadmap
- **Test Expansion Roadmap**: Phase 1 (50+ tests), Phase 2 (70+ tests), Phase 3 (100+ tests)

### Feature Specifications
- **Marketing Website**: Professional B2B SaaS marketing site with five pages (Home, Solutions, Pricing, Security, Contact) under `/marketing/*` namespace, accessible without authentication. Contact form with lead capture (POST /api/leads public endpoint with Zod validation, global rate limiting). Leads stored in PostgreSQL with comprehensive schema (email/status/created_at indexes). Operations/Admin can view all leads via authenticated GET endpoint.
- **Marketing Landing Page**: Professional site at root URL.
- **Notification System**: Real-time notification center with CRUD operations for alerts.
- **GP Facility Management**: Draw requests, repayment tracking, document vault, messaging.
- **Global Search**: Cmd+K / Ctrl+K for entity search.
- **Data Export**: CSV export utility.
- **Help System & Onboarding**: Dialog-based help center with role-specific guides.
- **AI Integration**: Gemini AI for document data extraction (fundName, AUM, vintage), eligibility assessment, covenant breach risk analysis.
- **Automated Legal Document Generation**: Templates for Loan Agreements, Term Sheets, Compliance Reports using facility data, configurable options, Markdown downloads.
- **Covenant Monitoring and Compliance Tracking**: Automated compliance checks with three status levels (compliant, warning, breach) and urgent notifications, including automated scheduling.
- **GP Workflow APIs**: Endpoints for submitting draw requests, listing requests, and operations approvals.
- **Cash Flow & Repayment APIs**: Endpoints for creating scheduled payments, listing cash flows, and recording payment receipts.
- **Portfolio Analytics API**: Comprehensive portfolio risk metrics, status distribution, covenant health dashboard, payment performance, and risk scoring.
- **Advisor Workflow APIs**: RFP bid comparison with intelligent scoring, advisor commission calculation, and advisor performance analytics dashboard.
- **Billing System**: Production-ready Stripe integration with subscription management (Starter/Professional/Enterprise tiers), usage tracking, invoice management, webhook handling, and transaction rollback logic for data consistency.
- **Analytics Dashboard**: Comprehensive portfolio analytics page with operational alpha and ROI calculations (90% automation assumption, basis points formula), visual charts for covenant health and payment performance, zero-AUM guards, transparent assumption disclosure, and complete CSV export including status distribution and all payment states for compliance reporting.
- **Email Notifications**: Resend selected for transactional emails (setup deferred for later implementation).

## External Dependencies

- **UI Component Libraries**: Radix UI, Recharts, cmdk, Lucide React, shadcn/ui.
- **Development Tools**: Vite, TypeScript.
- **Data & Validation**: Zod, React Hook Form with Zod resolvers, date-fns.
- **Styling & Design**: Tailwind CSS, PostCSS, class-variance-authority, clsx, tailwind-merge.
- **Database & ORM**: @neondatabase/serverless, Drizzle ORM, ws.
- **AI Integration**: Gemini 2.0 Flash model, OpenAI GPT-4.
- **Security**: Helmet.js, express-rate-limit, connect-pg-simple.
- **Monitoring**: Sentry (error tracking and performance monitoring).
- **Document Parsing**: `pdf-parse`, `mammoth` (for DOCX).
- **Scheduling**: `node-cron`.
- **Payment Processing**: Stripe (subscription billing, invoices, webhooks).
- **Email Service**: Resend (transactional emails - setup pending).