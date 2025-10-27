# AlphaNAV - NAV Lending Operations Platform

## Overview
AlphaNAV is a comprehensive NAV (Net Asset Value) lending operations platform designed for private equity fund lenders. Its primary purpose is to automate critical operational workflows such as underwriting, monitoring, reporting, and legal document generation, aiming for a 90% automation rate. The platform targets significant operational efficiency gains and 100 basis points in operational alpha, initially for internal operations teams with future expansion to external users. Key capabilities include AI-powered data extraction, automated eligibility scoring, risk assessment, LTV calculation with stress testing, and legal document generation.

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
- **Core Platform Features**: Marketing Website, Notification System, GP Facility Management, Global Search, Data Export, Help System & Onboarding.
- **AI Integration**: Gemini AI for document data extraction, eligibility assessment, covenant breach risk analysis.
- **Automation**: Automated Legal Document Generation, Covenant Monitoring and Compliance Tracking.
- **Workflow APIs**: Endpoints for draw requests, cash flow, portfolio analytics, and advisor functions.
- **Billing System**: Production-ready Stripe integration.
- **Analytics Dashboard**: Comprehensive portfolio analytics with ROI, stress testing, concentration analysis, and performance metrics.
- **Automation Features**: AI Accuracy Validation Framework, 10-Point Eligibility Scoring System, LTV Calculator with Stress Testing, Automated Risk Flags Detection.
- **Advanced Features**: Batch Document Processing, Portfolio Company Extraction, Credit Agreement Parsing, Predictive Breach ML Model (heuristic-based), Slack/SMS Integration, Market Intelligence Dashboard, Lender Directory, Public API with OAuth, Fund Admin Integrations, SOC 2 Prep.

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