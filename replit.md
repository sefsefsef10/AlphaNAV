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
- **Schema**: Comprehensive domain schema covering users (with auth), sessions, onboarding, prospects, deals, advisors, facilities, covenants, documents, notifications, and messages. Centralized database schema in `shared/` for full-stack type safety.
- **Storage Layer**: DatabaseStorage implementation (`server/dbStorage.ts`) exported via `server/storage.ts`, used by auth and all API routes.

### Authentication & Authorization
- **Provider**: Replit Auth (OIDC) supporting Google, GitHub, X, Apple, and email/password login
- **Session Management**: PostgreSQL-backed sessions via connect-pg-simple (7-day TTL)
- **Middleware**: Passport.js with token refresh support
- **Auth Routes**: 
  - `/api/login` - Initiate OIDC authentication
  - `/api/logout` - End session and redirect to OIDC logout
  - `/api/callback` - OIDC callback handler
  - `GET /api/auth/user` - Get current authenticated user (returns User object from database)
  - `PATCH /api/auth/user/role` - Update user's role (operations, advisor, gp, admin)
- **Protected Routes**: `isAuthenticated` middleware validates session and refreshes tokens automatically
- **User Flow**: Login → Role Selection (`/select-role`) → Role-specific dashboard
- **Roles**: operations (lenders), advisor (placement agents), gp (fund managers), admin
- **Frontend Hook**: `useAuth()` queries `/api/auth/user` to provide user, isLoading, isAuthenticated states
- **Critical Fix (Oct 25, 2025)**: Added missing `/api/auth/user` endpoint - previously returned HTML instead of JSON, causing authentication state to fail

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
- **Automated Legal Document Generation**: 
  - Templates for Loan Agreements, Term Sheets, and Compliance Reports using facility data
  - API endpoint: `POST /api/facilities/:id/generate-document`
  - Configurable options: interest type, term length, OID, PIK, covenants, amortization, prepayment penalty, security interest
  - Format-aware downloads (Markdown)
  - Dialog UI integrated into facility management page with data-testid attributes
  - **Implementation Date**: October 25, 2025
- **Covenant Monitoring and Compliance Tracking**: Automated compliance checks against defined thresholds with support for various covenant types (LTV, Minimum NAV, Diversification, Liquidity, Custom). Three status levels: compliant, warning, and breach, with urgent notification for breaches.

## External Dependencies

- **UI Component Libraries**: Radix UI, Recharts, cmdk, Lucide React.
- **Development Tools**: Vite, TypeScript.
- **Data & Validation**: Zod, React Hook Form with Zod resolvers, date-fns.
- **Styling & Design**: Tailwind CSS, PostCSS, class-variance-authority, clsx, tailwind-merge.
- **Database & ORM**: @neondatabase/serverless, Drizzle ORM, ws (WebSocket).
- **AI Integration**: Gemini 2.0 Flash model.
- **Planned Third-Party Integrations**: LinkedIn APIs, CRM integrations (Folk), document upload/processing capabilities.

## Recent Updates (October 25, 2025)

### Critical Bug Fixes
1. **Missing Authentication Endpoint**: Added `GET /api/auth/user` endpoint in `server/replitAuth.ts`
   - Issue: Frontend `useAuth()` hook was calling `/api/auth/user` which didn't exist
   - Symptom: API returned HTML instead of JSON, causing authentication state to fail and blank pages
   - Fix: Implemented endpoint that returns current user from database with proper JSON response
   - Also added: `PATCH /api/auth/user/role` endpoint for role selection

2. **App.tsx Conditional Rendering**: Fixed loading state handling in `client/src/App.tsx`
   - Issue: `isLoading || !isAuthenticated` condition prevented role selection and protected pages from rendering
   - Symptom: Blank/dark pages on `/select-role` and operations routes after login
   - Fix: Separated loading state into distinct condition with loading spinner, fixed route handler precedence

3. **GP User Routing**: Fixed authentication redirect logic for GP users
   - Issue: GP users treated same as users without roles, stuck in redirect loop
   - Fix: Only redirect users with truly no role to `/select-role`, added GP to role routes map (`/gp`)

### Features Completed
1. **Legal Document Generation UI Integration**
   - Added "Generate Document" button to each facility card in facilities management page
   - Created dialog component (`client/src/components/generate-document-dialog.tsx`) with document type selection and configuration options
   - Integrated with existing API endpoint for document generation
   - Download functionality for generated Markdown files

2. **Storage Interface Updates**
   - Added `updateUserRole` method to `IStorage` interface
   - Implemented in both `DatabaseStorage` and `MemStorage`
   - Enables role selection feature for new users

### Testing Status
- Authentication flow tested and verified
- Role selection page rendering confirmed
- Legal document generation dialog integration tested
- All LSP diagnostics resolved (zero TypeScript errors)
- E2E testing pending (blocked by previous authentication bugs, now resolved)

### Known Issues
- None currently blocking deployment

### Next Steps
1. Run comprehensive end-to-end tests on all workflows
2. Test legal document generation with actual facility data
3. Verify GP onboarding flow end-to-end
4. Verify Advisor RFP workflow
5. Performance testing and optimization
6. Deployment to production