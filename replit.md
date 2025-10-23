# AlphaNAV - NAV Lending Operations Platform

## Overview

AlphaNAV is a comprehensive NAV (Net Asset Value) lending operations platform designed for private equity fund lenders. The platform automates key operational workflows including underwriting, monitoring, reporting, and legal document generation to achieve significant operational efficiency gains (targeting 100 basis points in operational alpha).

The application serves internal operations teams (underwriters, compliance officers, legal teams, investment committees) and will expand to external users (PE fund managers, limited partners) in later phases. Core functionality focuses on reducing manual effort in underwriting workflows by 90%+, enabling efficient quarterly monitoring and reporting, and supporting fundraising through high-quality metrics and automated report generation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component System**: Radix UI primitives with shadcn/ui components following the "New York" style variant. The design system is influenced by Carbon Design System (IBM) with modern financial SaaS aesthetics, prioritizing data density, professional reliability, and enterprise-grade table management.

**Styling**: Tailwind CSS with custom design tokens for a professional dark-mode-first interface. Color palette emphasizes trust and stability with professional blue as primary color, and semantic colors for financial states (success green for compliance, warning amber for attention, danger red for breaches).

**State Management**: TanStack React Query (v5) for server state management with custom query client configuration. No global client-side state management library is used - component-level state with React hooks.

**Routing**: Wouter for lightweight client-side routing with file-based page organization under `/client/src/pages/`.

**Key Design Principles**:
- Dark mode as default theme (light mode available)
- Data-intensive B2B financial operations focus
- Tabular numeric display with `tabular-nums` font variant
- Professional typography using Inter and JetBrains Mono fonts
- Component composition with Radix UI slot pattern

### Backend Architecture

**Runtime**: Node.js with Express.js server framework

**Language**: TypeScript with ES modules (`"type": "module"`)

**Development Setup**: 
- Development: `tsx` for TypeScript execution with hot reload via Vite middleware
- Production: Compiled with `esbuild` to ESM format with external packages

**API Design**: RESTful API structure with routes registered under `/api` prefix. Currently minimal implementation with routes defined in `server/routes.ts` and storage abstraction in `server/storage.ts`.

**Storage Layer**: Interface-based storage pattern (`IStorage`) with in-memory implementation (`MemStorage`). Designed for easy migration to persistent database storage while maintaining consistent API surface.

**Request Handling**:
- JSON body parsing with Express middleware
- URL-encoded form data support
- Request/response logging for API routes with performance tracking
- Centralized error handling with status code normalization

**Architectural Decision**: The backend uses a layered architecture separating routing, business logic, and data access. The storage interface allows switching between in-memory and database implementations without changing application logic.

### Data Storage

**Database**: PostgreSQL via Neon serverless (indicated by `@neondatabase/serverless` package)

**ORM**: Drizzle ORM with schema-first approach
- Schema definition in `shared/schema.ts` for type-safe sharing between client and server
- Drizzle Kit for migrations in `./migrations` directory
- Zod integration via `drizzle-zod` for runtime validation

**Connection Management**: Connection pooling with Neon's serverless adapter using WebSocket constructor for edge compatibility

**Current Schema**: Minimal user table with UUID primary keys, username/password authentication fields. Schema is extensible for NAV lending domain models (deals, covenants, funds, reports, etc.).

**Architectural Decision**: Database schema is centralized in `shared/` directory to enable type sharing between frontend and backend, ensuring type safety across the full stack. The serverless-first approach (Neon) provides auto-scaling and edge compatibility.

### Authentication & Authorization

**Current State**: Basic user schema exists but no authentication implementation is active. User table includes username/password fields suggesting planned credential-based authentication.

**Session Management**: `connect-pg-simple` package indicates PostgreSQL-backed session storage is configured or planned for Express sessions.

**Future Implementation**: Authentication will likely use session-based approach with PostgreSQL session store given the included dependencies.

### External Dependencies

**UI Component Libraries**:
- Radix UI (comprehensive primitive set for accessibility)
- Recharts for data visualization
- cmdk for command palette functionality
- Lucide React for iconography

**Development Tools**:
- Vite with React plugin for frontend bundling
- Replit-specific plugins for runtime error overlay, cartographer, and dev banner
- TypeScript with strict mode enabled

**Data & Validation**:
- Zod for schema validation
- React Hook Form with Zod resolvers for form management
- date-fns for date manipulation

**Styling & Design**:
- Tailwind CSS with PostCSS
- class-variance-authority for component variants
- clsx and tailwind-merge utilities

**Database & ORM**:
- @neondatabase/serverless for PostgreSQL connectivity
- Drizzle ORM for type-safe database operations
- ws (WebSocket) for Neon connection protocol

**Third-Party Integrations** (Planned):
- LinkedIn APIs for origination and fund identification
- CRM integrations (Folk mentioned in PRD)
- Document upload/processing capabilities (indicated by DocumentUpload component)

**Architectural Decisions**:
- Monorepo structure with shared types between client and server
- Module path aliases (@/, @shared/, @assets/) for clean imports
- Serverless-first database approach for scalability
- Component library approach with shadcn/ui for customizability while maintaining consistency

## Recent Changes

### October 23, 2025 - GP Facility Management Complete
**Status**: Task 9 completed with architect approval (13 of 20 tasks, 65% milestone)

**Major Features Implemented**:
1. **GP Facility Management** - All four features fully functional:
   - **Draw Requests**: Create, track, approve funding requests with workflow notifications
   - **Repayment Tracking**: Monitor cash flows and payment schedules with status indicators
   - **Document Vault**: Upload, list, download, delete facility documents with facilityId scoping
   - **Messaging System**: Thread-based communication with NAV IQ operations team

**Technical Highlights**:
- Fixed message queries to use query parameters: `queryKey: ['/api/messages?threadId=${threadId}']`
- Fixed document queries to use full endpoint path: `queryKey: ['/api/facilities/${facilityId}/documents']`
- Added `facilityId` field to `uploadedDocuments` schema for facility document scoping
- Implemented Zod validation (`insertMessageSchema.parse`) for message payloads before storage
- Cache invalidation properly scoped to thread-specific and facility-specific queries
- Created `/api/upload-facility-document` endpoint with facilityId validation
- Added `getDocumentsByFacility` storage method to IStorage interface and DatabaseStorage
- Pushed database schema changes with `npm run db:push --force`

**Key Learnings**:
- Query keys must match the actual endpoint URL when using default queryFn
- Cache invalidation must target the same queryKey format as queries
- Database schema changes require nullable fields when adding to existing tables
- Zod validation at API layer prevents invalid data from reaching storage layer

**Workflow Connections**:
- Draw request approval triggers notifications to GP users
- New messages trigger notifications to recipient (operations team or GP)
- Document uploads/deletions trigger cache invalidation for real-time UI updates
- All four features integrated into tabbed interface on GP Facility page