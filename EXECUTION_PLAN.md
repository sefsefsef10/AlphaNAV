# AlphaNAV Phase 2A Execution Plan
## AI-Powered Underwriting MVP
*Sprint Start: October 28, 2025*

---

## Mission: Deliver 45-Minute Underwriting vs. 40-60 Hours Manual

**Target Outcome**: NAV Lender can receive RFP documents, run AI extraction, score eligibility, calculate LTV, and generate term sheet in **under 1 hour** (vs. 2-3 days manually).

**Success Metrics**:
- ✅ AI extracts 47+ data points with 95%+ accuracy
- ✅ Eligibility scoring produces 10-point assessment in <30 seconds
- ✅ LTV calculator shows stress test scenarios (-20%, -40%)
- ✅ Auto-generated 8-page term sheet with editable fields
- ✅ Full workflow E2E tested: Upload → Extract → Score → Calculate → Generate

---

## Phase 2A Architecture Overview

### Data Flow
```
Placement Agent → Upload Documents (PPM, Financials, Fund Agreement)
                ↓
         Document Processing Queue
                ↓
         Gemini AI Extraction (47+ data points)
                ↓
         Extraction Results + Confidence Scores
                ↓
         Manual Review & Corrections (if needed)
                ↓
         10-Point Eligibility Scoring
                ↓
         LTV Calculator + Stress Testing
                ↓
         Term Sheet Generation (8-page PDF)
                ↓
         Share with Placement Agent (secure link)
```

### Database Schema Extensions

**New Tables**:
1. `underwriting_sessions` - Track full underwriting workflow
2. `extraction_data` - Store AI-extracted fund data
3. `eligibility_scores` - Store 10-point scoring results
4. `ltv_calculations` - Store LTV scenarios and stress tests
5. `term_sheets` - Generated term sheets with versions

**Extended Tables**:
- `prospects` - Add underwriting session link
- `uploaded_documents` - Add extraction status
- `deals` - Add term sheet link

### Tech Stack Decisions

**AI/ML**:
- ✅ Gemini 2.0 Flash (already integrated) for document extraction
- ✅ Custom heuristic rules for eligibility scoring (ML v2 later)
- ✅ Mathematical models for LTV stress testing

**Document Processing**:
- ✅ `pdf-parse` for PDF text extraction
- ✅ `mammoth` for Word doc conversion
- ✅ Object storage for large files (already setup)

**PDF Generation**:
- ✅ Install `pdfkit` or `puppeteer` for term sheet PDFs
- ✅ Use HTML templates → PDF conversion

---

## Sprint 1: Foundation (Days 1-5)

### Day 1: Data Model & Schema ✅ TODAY
**Tasks**:
- [x] Define underwriting data model
- [ ] Create database migration for new tables
- [ ] Update existing tables with foreign keys
- [ ] Run migration and verify schema

**Deliverable**: Database supports full underwriting workflow

### Day 2-3: Document Upload & AI Extraction
**Tasks**:
- [ ] Build upload API endpoint (`POST /api/underwriting/upload`)
- [ ] Implement file validation (PDF, Excel, Word, max 50MB)
- [ ] Create document processing queue
- [ ] Build Gemini extraction service for fund data
- [ ] Define extraction prompt template (47 data points)
- [ ] Store extraction results with confidence scores

**Deliverable**: Upload 8 documents → AI extracts 47 data points → Shows confidence scores

### Day 4: Eligibility Scoring
**Tasks**:
- [ ] Define 10-point scoring algorithm:
  - Track Record (0-10): GP prior fund performance
  - Diversification (0-10): Portfolio company spread
  - Liquidity (0-10): Cash reserves assessment
  - Portfolio Quality (0-10): Company performance metrics
  - Vintage (0-10): Fund age analysis
  - Fund Size (0-10): AUM appropriateness
  - Sector Risk (0-10): Industry concentration
  - Geographic Risk (0-10): Regional exposure
  - GP Experience (0-10): Management team tenure
  - Structure Risk (0-10): Fund structure complexity
- [ ] Implement scoring service (`POST /api/underwriting/:id/score`)
- [ ] Generate risk flags based on low scores
- [ ] Store scoring results

**Deliverable**: Extracted data → 10-point score with risk flags

### Day 5: LTV Calculator
**Tasks**:
- [ ] Build LTV calculation engine
- [ ] Implement stress testing scenarios:
  - Baseline: Current NAV, 0% stress
  - Conservative: -10% NAV stress
  - Moderate Downturn: -20% NAV stress
  - Severe Recession: -40% NAV stress
- [ ] Calculate maximum facility size (15% LTV target)
- [ ] Generate pricing recommendations (SOFR + spread)
- [ ] Store calculation results

**Deliverable**: Fund data → LTV scenarios → Max facility size + pricing

---

## Sprint 2: UI & Term Sheet Generation (Days 6-10)

### Day 6-7: Upload & Extraction UI
**Tasks**:
- [ ] Create new page: `/operations/underwriting` (or `/underwriting/new`)
- [ ] Build drag-and-drop document upload interface
- [ ] Show upload progress with real-time status
- [ ] Display extraction results in structured table
- [ ] Add confidence score indicators (High 98%, Medium 94%, Low 87%)
- [ ] Enable manual correction for low-confidence fields
- [ ] Auto-save corrections (triggers model retraining flag)

**Deliverable**: User uploads docs → Sees extraction results → Corrects errors

### Day 8: Eligibility Scoring UI
**Tasks**:
- [ ] Build scoring dashboard showing 10-point breakdown
- [ ] Visualize scores with progress bars/radial charts
- [ ] Display risk flags prominently
- [ ] Show recommendation (Recommended/Review/Decline)
- [ ] Add notes field for underwriter comments

**Deliverable**: Visual 10-point assessment with risk analysis

### Day 9: LTV Calculator UI
**Tasks**:
- [ ] Create interactive calculator with sliders
- [ ] Facility size slider → real-time LTV update
- [ ] Show stress test table (Baseline, -10%, -20%, -40%)
- [ ] Visualize breach probability (color-coded risk map)
- [ ] Display pricing recommendation with market comparison
- [ ] Add benchmark comparison ("Conservative vs. portfolio avg 14.2%")

**Deliverable**: Interactive calculator with stress testing visualization

### Day 10: Term Sheet Generation
**Tasks**:
- [ ] Install PDF generation library (`pdfkit` or `puppeteer`)
- [ ] Create 8-page term sheet HTML template:
  - Page 1: Cover page (Borrower, Lender, Date)
  - Page 2: Transaction summary (Commitment, Pricing, Structure)
  - Page 3-4: Covenants (LTV, Min NAV, Diversification, Liquidity)
  - Page 5: Draw conditions & procedures
  - Page 6: Repayment terms & interest calculation
  - Page 7: Events of default & remedies
  - Page 8: Signatures & exhibits
- [ ] Auto-populate template with underwriting data
- [ ] Generate PDF endpoint (`POST /api/underwriting/:id/generate-term-sheet`)
- [ ] Store generated term sheet in database
- [ ] Create secure sharing link

**Deliverable**: Click "Generate Term Sheet" → 8-page PDF downloads

---

## Sprint 3: Integration & Testing (Days 11-15)

### Day 11-12: Pipeline Integration
**Tasks**:
- [ ] Connect underwriting to pipeline board
- [ ] Auto-create deal when underwriting session starts
- [ ] Update deal stage as underwriting progresses:
  - Uploaded → "Underwriting"
  - Extracted → "Underwriting"
  - Scored → "Underwriting"
  - Term Sheet Generated → "Documentation"
- [ ] Link term sheet to deal for tracking
- [ ] Add underwriting metrics to deal card (score, LTV, pricing)

**Deliverable**: Underwriting sessions appear in pipeline Kanban

### Day 13: Secure Sharing & Collaboration
**Tasks**:
- [ ] Build secure share link generation (`/share/term-sheet/:token`)
- [ ] Track term sheet views (audit trail)
- [ ] Add expiration dates to share links (7-day default)
- [ ] Email notification when term sheet shared
- [ ] Enable placement agent to download PDF without login

**Deliverable**: Share term sheet via secure link, track views

### Day 14: E2E Testing
**Tasks**:
- [ ] Create test scenario:
  - Upload 8 sample documents (PPM, financials, fund agreement, portfolio list, etc.)
  - Verify AI extraction completes in <5 minutes
  - Check 47 data points extracted with confidence scores
  - Run eligibility scoring (verify 10-point breakdown)
  - Calculate LTV scenarios (verify stress testing)
  - Generate term sheet (verify 8-page PDF)
  - Share term sheet via secure link (verify access)
- [ ] Run playwright E2E test for full workflow
- [ ] Measure total time (target: <45 minutes)
- [ ] Fix any bugs or UX issues

**Deliverable**: Full workflow tested and working

### Day 15: Documentation & Handoff
**Tasks**:
- [ ] Update replit.md with Phase 2A implementation details
- [ ] Create user guide for underwriting workflow
- [ ] Document API endpoints (Swagger/OpenAPI)
- [ ] Record demo video (5 minutes showing 45-min underwriting)
- [ ] Architect review of entire Phase 2A implementation

**Deliverable**: Phase 2A complete and documented

---

## Technical Implementation Details

### Database Schema (Detailed)

```typescript
// New table: underwriting_sessions
export const underwritingSessions = pgTable("underwriting_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Who initiated underwriting
  prospectId: varchar("prospect_id"), // Link to prospect if exists
  dealId: varchar("deal_id"), // Link to pipeline deal
  fundName: text("fund_name").notNull(),
  status: text("status").notNull().default("uploading"), // uploading, extracting, extracted, scoring, scored, calculating, calculated, generating, completed
  currentStep: integer("current_step").notNull().default(1), // 1-5 (upload, extract, score, calculate, generate)
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// New table: extraction_data
export const extractionData = pgTable("extraction_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  // Fund Details (10 fields)
  fundName: text("fund_name"),
  fundAum: integer("fund_aum"), // in dollars
  vintage: integer("vintage"), // year
  gpEntity: text("gp_entity"),
  gpFirmName: text("gp_firm_name"),
  fundStructure: text("fund_structure"), // LP/GP split
  strategy: text("strategy"),
  geography: text("geography"),
  fundType: text("fund_type"), // buyout, growth, venture, etc.
  fundStatus: text("fund_status"), // active, closed, liquidating
  
  // Portfolio (15 fields)
  portfolioCompanyCount: integer("portfolio_company_count"),
  portfolioCompanies: jsonb("portfolio_companies"), // [{name, sector, ebitda, debt}]
  sectorDistribution: jsonb("sector_distribution"), // {healthcare: 30%, tech: 25%}
  largestHoldingPercent: numeric("largest_holding_percent", { precision: 5, scale: 2 }),
  topThreeConcentration: numeric("top_three_concentration", { precision: 5, scale: 2 }),
  
  // Financial Metrics (12 fields)
  currentNav: integer("current_nav"),
  unrealizedValue: integer("unrealized_value"),
  realizedValue: integer("realized_value"),
  grossIrr: numeric("gross_irr", { precision: 5, scale: 2 }),
  netIrr: numeric("net_irr", { precision: 5, scale: 2 }),
  moic: numeric("moic", { precision: 5, scale: 2 }),
  dpi: numeric("dpi", { precision: 5, scale: 2 }),
  rvpi: numeric("rvpi", { precision: 5, scale: 2 }),
  cashReserves: integer("cash_reserves"),
  totalDebt: integer("total_debt"),
  capitalCommitted: integer("capital_committed"),
  capitalCalled: integer("capital_called"),
  
  // GP Track Record (10 fields)
  priorFundCount: integer("prior_fund_count"),
  priorFundAum: integer("prior_fund_aum"),
  priorFundAvgIrr: numeric("prior_fund_avg_irr", { precision: 5, scale: 2 }),
  priorFundAvgMoic: numeric("prior_fund_avg_moic", { precision: 5, scale: 2 }),
  yearsOfExperience: integer("years_of_experience"),
  teamSize: integer("team_size"),
  
  // Extraction Metadata
  extractionConfidence: integer("extraction_confidence"), // 0-100 overall score
  lowConfidenceFields: jsonb("low_confidence_fields"), // [{field: "moic", confidence: 87}]
  extractedAt: timestamp("extracted_at").notNull().defaultNow(),
  extractedBy: text("extracted_by").notNull().default("gemini-2.0-flash"),
});

// New table: eligibility_scores
export const eligibilityScores = pgTable("eligibility_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  // 10-Point Scoring Breakdown
  trackRecordScore: integer("track_record_score"), // 0-10
  diversificationScore: integer("diversification_score"), // 0-10
  liquidityScore: integer("liquidity_score"), // 0-10
  portfolioQualityScore: integer("portfolio_quality_score"), // 0-10
  vintageScore: integer("vintage_score"), // 0-10
  fundSizeScore: integer("fund_size_score"), // 0-10
  sectorRiskScore: integer("sector_risk_score"), // 0-10
  geographicRiskScore: integer("geographic_risk_score"), // 0-10
  gpExperienceScore: integer("gp_experience_score"), // 0-10
  structureRiskScore: integer("structure_risk_score"), // 0-10
  
  // Overall Assessment
  totalScore: integer("total_score"), // 0-100
  recommendation: text("recommendation"), // recommended, review_required, decline
  riskFlags: jsonb("risk_flags"), // [{type: "vintage_concern", severity: "medium", message: "..."}]
  underwriterNotes: text("underwriter_notes"),
  
  scoredAt: timestamp("scored_at").notNull().defaultNow(),
  scoredBy: varchar("scored_by").notNull(), // userId
});

// New table: ltv_calculations
export const ltvCalculations = pgTable("ltv_calculations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  
  // Input Parameters
  fundNav: integer("fund_nav").notNull(),
  targetLtv: numeric("target_ltv", { precision: 5, scale: 2 }).notNull().default("15.00"), // 15%
  maxLtv: numeric("max_ltv", { precision: 5, scale: 2 }).notNull().default("18.00"), // 18% covenant
  requestedFacilitySize: integer("requested_facility_size"),
  
  // Baseline Calculation
  maxFacilitySize: integer("max_facility_size"), // NAV * targetLtv
  recommendedFacilitySize: integer("recommended_facility_size"),
  baselineLtv: numeric("baseline_ltv", { precision: 5, scale: 2 }),
  
  // Stress Testing Scenarios
  scenarios: jsonb("scenarios"), // [{name: "-20% Downturn", navStress: -20, newNav: 158400000, newLtv: 15.8}]
  breachProbability: numeric("breach_probability", { precision: 5, scale: 2 }), // % chance of LTV breach
  
  // Pricing Recommendation
  recommendedSofr: integer("recommended_sofr"), // basis points (e.g., 600 = SOFR + 600 bps)
  marketMedianPricing: integer("market_median_pricing"),
  pricingRationale: text("pricing_rationale"),
  
  calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
});

// New table: term_sheets
export const termSheets = pgTable("term_sheets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  dealId: varchar("deal_id"),
  
  // Term Sheet Content
  borrowerName: text("borrower_name").notNull(),
  commitmentAmount: integer("commitment_amount").notNull(),
  pricingSpread: integer("pricing_spread").notNull(), // SOFR + X bps
  covenantLtv: numeric("covenant_ltv", { precision: 5, scale: 2 }),
  covenantMinNav: integer("covenant_min_nav"),
  covenantDiversification: numeric("covenant_diversification", { precision: 5, scale: 2 }),
  covenantLiquidity: integer("covenant_liquidity"),
  
  // Document Management
  pdfUrl: text("pdf_url"), // Storage URL for generated PDF
  shareToken: varchar("share_token"), // For secure sharing
  shareExpiresAt: timestamp("share_expires_at"),
  viewCount: integer("view_count").default(0),
  
  // Versioning
  version: integer("version").notNull().default(1),
  editedFields: jsonb("edited_fields"), // Track manual edits
  
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  generatedBy: varchar("generated_by").notNull(), // userId
});
```

### API Endpoints

```typescript
// Upload documents
POST /api/underwriting/sessions
Body: { fundName, userId }
Response: { sessionId, uploadUrl }

POST /api/underwriting/:sessionId/documents
Body: FormData with files
Response: { documentIds: [], status: "uploading" }

// AI Extraction
POST /api/underwriting/:sessionId/extract
Response: { extractionId, status: "extracting" }

GET /api/underwriting/:sessionId/extraction
Response: { extractionData, confidence, lowConfidenceFields }

PATCH /api/underwriting/:sessionId/extraction
Body: { field: "moic", value: 1.4 }
Response: { updated: true }

// Eligibility Scoring
POST /api/underwriting/:sessionId/score
Response: { scoreId, totalScore, breakdown, riskFlags, recommendation }

// LTV Calculation
POST /api/underwriting/:sessionId/calculate-ltv
Body: { requestedFacilitySize }
Response: { calculationId, scenarios, maxSize, recommendedSize, pricing }

// Term Sheet Generation
POST /api/underwriting/:sessionId/generate-term-sheet
Response: { termSheetId, pdfUrl, downloadUrl }

GET /api/underwriting/:sessionId/term-sheet/:id
Response: PDF download or JSON data

// Secure Sharing
POST /api/underwriting/:sessionId/term-sheet/:id/share
Body: { expiresInDays: 7 }
Response: { shareUrl, expiresAt }

GET /share/term-sheet/:token
Response: HTML page with PDF viewer (public access)
```

---

## Success Criteria (Phase 2A Complete)

✅ **Functional Requirements**:
- [ ] Upload 8 documents → AI extracts 47 data points in <5 minutes
- [ ] Extraction confidence scores displayed (High/Medium/Low)
- [ ] Manual correction interface for low-confidence fields
- [ ] 10-point eligibility scoring with risk flags
- [ ] Interactive LTV calculator with stress testing
- [ ] Auto-generated 8-page term sheet PDF
- [ ] Secure share links with view tracking
- [ ] Pipeline integration (deals auto-created)

✅ **Performance Targets**:
- [ ] Total workflow time: <45 minutes (vs. 40-60 hours manual)
- [ ] AI extraction accuracy: >95% on clean documents
- [ ] Calculation speed: LTV scenarios in <2 seconds
- [ ] PDF generation: <5 seconds for 8-page term sheet

✅ **UX Requirements**:
- [ ] Progress indicators at each step
- [ ] Real-time status updates during extraction
- [ ] Clear error messages with recovery paths
- [ ] Mobile-responsive design
- [ ] Dark mode support (already exists)

✅ **Security & Compliance**:
- [ ] Multi-tenant data isolation (userId filtering)
- [ ] Audit trail for all actions
- [ ] Secure file storage (encrypted at rest)
- [ ] Share link expiration (7-day default)
- [ ] View tracking for compliance

---

## Next Steps After Phase 2A

1. **Phase 2B: Covenant Monitoring - Full Stack** (6-8 weeks)
   - Fund administrator API integrations (SS&C, Alter Domus, Apex)
   - Automated covenant calculations
   - Breach prediction models
   - Compliance reporting

2. **Phase 2C: Portfolio Analytics - Enhanced** (4-5 weeks)
   - Risk concentration heat maps
   - Stress testing scenarios
   - LP report generation

3. **Phase 3: GP Portal** (8-10 weeks)
   - GP registration & onboarding
   - Draw request workflow
   - Compliance certificate generation
   - Document vault

---

*Sprint Starts: Today (October 28, 2025)*  
*Target Completion: November 15, 2025 (15 working days)*  
*Demo Ready: November 20, 2025*
