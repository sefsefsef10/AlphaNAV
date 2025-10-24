# AlphaNAV - NAV Lending Operations Platform

## Overview
AlphaNAV is a comprehensive NAV (Net Asset Value) lending operations platform for private equity fund lenders. Its primary purpose is to automate key operational workflows, including underwriting, monitoring, reporting, and legal document generation, aiming for significant operational efficiency gains. The platform is designed to serve internal operations teams initially, with future expansion to external users. Key capabilities include reducing manual effort in underwriting, enabling efficient quarterly monitoring, and supporting fundraising through automated report generation. The business vision is to achieve 100 basis points in operational alpha for private equity fund lenders.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript (Vite build tool).
- **UI Component System**: Radix UI primitives with shadcn/ui components ("New York" style variant), inspired by Carbon Design System.
- **Styling**: Tailwind CSS with custom design tokens, dark-mode-first interface, professional blue as primary, semantic colors for financial states.
- **State Management**: TanStack React Query for server state; React hooks for client-side state.
- **Routing**: Wouter for lightweight client-side routing.
- **Design Principles**: Dark mode default, data-intensive B2B financial focus, tabular numeric display, Inter and JetBrains Mono fonts, component composition.

### Backend
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **API Design**: RESTful API structure under `/api` prefix.
- **Storage Layer**: Interface-based `IStorage` designed for future migration to persistent databases.
- **Request Handling**: JSON and URL-encoded body parsing, request/response logging, centralized error handling.
- **Architecture**: Layered architecture separating routing, business logic, and data access.

### Data Storage
- **Database**: PostgreSQL via Neon serverless.
- **ORM**: Drizzle ORM with a schema-first approach for type-safe sharing and migrations. Zod integration via `drizzle-zod` for runtime validation.
- **Connection Management**: Connection pooling with Neon's serverless adapter using WebSocket.
- **Schema**: Minimal user table, extensible for NAV lending domain models. Centralized database schema in `shared/` for full-stack type safety.

### Authentication & Authorization
- **Current State**: Basic user schema exists, with planned PostgreSQL-backed session storage for Express.
- **Future**: Likely session-based authentication with PostgreSQL session store.

### UI/UX Decisions
- Dark mode as default, professional typography (Inter, JetBrains Mono), `tabular-nums` font variant for data.
- UI components (shadcn/ui, Radix UI) selected for accessibility, customizability, and enterprise-grade aesthetics.

### Technical Implementations
- Monorepo structure with shared types and module path aliases.
- Serverless-first database approach for scalability.
- Component library approach with shadcn/ui for consistent UI.

### Feature Specifications
- **Marketing Landing Page**: Professional marketing site at root URL (`/`) with sections for value propositions, features, AI capabilities, pricing, and contact form.
- **Notification System**: Real-time notification center with user preferences.
- **GP Facility Management**: Draw requests, repayment tracking, document vault, messaging system.
- **Global Search**: Cmd+K / Ctrl+K shortcut for real-time search across entities.
- **Data Export**: CSV export utility for dashboards.
- **Help System & Onboarding**: Dialog-based help center with role-specific guides.
- **Gemini AI Integration**: Document extraction from fund data (e.g., fundName, AUM, vintage) with eligibility assessment and confidence scoring. Covenant breach risk analysis providing probability, risk level, and recommendations.
- **Automated Legal Document Generation**: Templates for Loan Agreements, Term Sheets, and Compliance Reports using facility data, with conditional sections and format-aware downloads.
- **Covenant Monitoring and Compliance Tracking**: Automated compliance checks against defined thresholds with support for various covenant types (LTV, Minimum NAV, Diversification, Liquidity, Custom). Three status levels: compliant, warning, and breach, with urgent notification for breaches.

## External Dependencies

- **UI Component Libraries**: Radix UI, Recharts, cmdk, Lucide React.
- **Development Tools**: Vite, TypeScript.
- **Data & Validation**: Zod, React Hook Form with Zod resolvers, date-fns.
- **Styling & Design**: Tailwind CSS, PostCSS, class-variance-authority, clsx, tailwind-merge.
- **Database & ORM**: @neondatabase/serverless, Drizzle ORM, ws (WebSocket).
- **AI Integration**: Gemini 2.0 Flash model.
- **Planned Third-Party Integrations**: LinkedIn APIs, CRM integrations (Folk), document upload/processing capabilities.