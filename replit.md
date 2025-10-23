# AlphaNAV - NAV Lending Operations Platform

## Overview
AlphaNAV is a comprehensive NAV (Net Asset Value) lending operations platform for private equity fund lenders. Its primary purpose is to automate key operational workflows, including underwriting, monitoring, reporting, and legal document generation, aiming for significant operational efficiency gains (100 basis points in operational alpha). The platform is designed to serve internal operations teams (underwriters, compliance officers, legal teams, investment committees) initially, with future expansion to external users (PE fund managers, limited partners). Key capabilities include reducing manual effort in underwriting by 90%+, enabling efficient quarterly monitoring, and supporting fundraising through automated report generation.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript (Vite build tool).
- **UI Component System**: Radix UI primitives with shadcn/ui components ("New York" style variant), inspired by Carbon Design System for data density and professional aesthetics.
- **Styling**: Tailwind CSS with custom design tokens, dark-mode-first interface, professional blue as primary, semantic colors for financial states.
- **State Management**: TanStack React Query (v5) for server state; component-level state with React hooks for client-side.
- **Routing**: Wouter for lightweight client-side routing.
- **Design Principles**: Dark mode default, data-intensive B2B financial focus, tabular numeric display, Inter and JetBrains Mono fonts, component composition with Radix UI slot pattern.

### Backend
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **API Design**: RESTful API structure under `/api` prefix.
- **Storage Layer**: Interface-based `IStorage` (currently in-memory `MemStorage`), designed for future migration to persistent databases.
- **Request Handling**: JSON and URL-encoded body parsing, request/response logging, centralized error handling.
- **Architecture**: Layered architecture separating routing, business logic, and data access.

### Data Storage
- **Database**: PostgreSQL via Neon serverless.
- **ORM**: Drizzle ORM with a schema-first approach.
    - Schema defined in `shared/schema.ts` for type-safe sharing.
    - Drizzle Kit for migrations.
    - Zod integration via `drizzle-zod` for runtime validation.
- **Connection Management**: Connection pooling with Neon's serverless adapter using WebSocket.
- **Schema**: Minimal user table, extensible for NAV lending domain models.
- **Architecture**: Centralized database schema in `shared/` for full-stack type safety; serverless-first approach for scalability.

### Authentication & Authorization
- **Current State**: Basic user schema exists, no active authentication implementation.
- **Session Management**: `connect-pg-simple` indicates planned PostgreSQL-backed session storage for Express.
- **Future**: Likely session-based authentication with PostgreSQL session store.

### UI/UX Decisions
- Dark mode as default, professional typography (Inter, JetBrains Mono), `tabular-nums` font variant for data.
- UI components (shadcn/ui, Radix UI) selected for accessibility, customizability, and enterprise-grade aesthetics.

### Technical Implementations
- Monorepo structure with shared types.
- Module path aliases (`@/`, `@shared/`, `@assets/`).
- Serverless-first database approach for scalability.
- Component library approach with shadcn/ui for consistent UI.

### Feature Specifications
- **Notification System**: Real-time notification center (bell icon, dropdown, priority coding, mark/delete actions, auto-refresh), user preferences page (channel toggles, type filters, delivery preferences).
- **GP Facility Management**: Draw requests (create, track, approve), repayment tracking, document vault (upload, list, download, delete), messaging system.
- **Global Search**: Cmd+K / Ctrl+K shortcut, real-time search across entities (GP deals, prospects, facilities, advisors), type-specific icons, click-to-navigate.
- **Data Export**: CSV export utility (generic `arrayToCSV`, `downloadCSV`), dashboard export buttons (Prospects, Deals, Facilities) with comprehensive column mappings, timestamped filenames.
- **Help System & Onboarding**: Dialog-based help center with tabbed navigation (Operations, Advisors, GP Users, FAQ), role-specific guides, prominent help button.

## External Dependencies

- **UI Component Libraries**: Radix UI, Recharts, cmdk, Lucide React.
- **Development Tools**: Vite, Replit-specific plugins, TypeScript.
- **Data & Validation**: Zod, React Hook Form with Zod resolvers, date-fns.
- **Styling & Design**: Tailwind CSS, PostCSS, class-variance-authority, clsx, tailwind-merge.
- **Database & ORM**: @neondatabase/serverless, Drizzle ORM, ws (WebSocket).
- **Planned Third-Party Integrations**: LinkedIn APIs, CRM integrations (Folk), document upload/processing capabilities.