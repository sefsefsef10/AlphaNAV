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
- **AI Integration**: Gemini 2.0 Flash model.
- **Security**: Helmet.js, express-rate-limit, connect-pg-simple.