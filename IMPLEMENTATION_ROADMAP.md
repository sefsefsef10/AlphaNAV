# AlphaNAV Implementation Roadmap
## From 15% Complete to Full Vision: 100 BPS Operational Alpha Platform

**Document Version:** 1.0  
**Last Updated:** October 25, 2025  
**Timeline:** 12 months (Weeks 1-52)  
**Current Status:** Phase 1 Complete (Foundation & Authentication)  
**Next Phase:** Phase 2A - MVP Features (Weeks 1-8)

---

## Executive Summary

AlphaNAV has completed its foundational infrastructure (Phase 1) and is positioned to build revenue-generating features. This roadmap transforms the platform from 15% complete to a fully functional NAV lending operations system delivering 100 basis points operational alpha through 90% workflow automation.

**Key Milestones:**
- **Week 8:** MVP Launch (AI extraction + basic underwriting)
- **Week 16:** Professional Tier Features Complete (covenant monitoring + legal automation)
- **Week 24:** Two-Sided Marketplace Active (advisor + GP portals)
- **Week 36:** Enterprise Features Complete (analytics + API)
- **Week 48:** SOC 2 Certified, ready for strategic exit

---

## Current State Assessment

### ✅ Completed (Phase 1: Weeks -24 to 0)
- Core technical infrastructure (React/TypeScript, Node.js/Express, PostgreSQL)
- Authentication system (Replit Auth with multi-provider support)
- Role-based access control (Operations, Advisor, GP, Admin)
- Marketing website with pricing, features, legal pages
- Mobile-responsive design (375px to 1920px+)
- Database schema for all major entities

### ❌ Critical Gaps
- **Zero revenue-generating features**
- **Zero operational alpha delivered** (0 of 100 bps)
- **No AI capabilities** despite marketing claims
- **No covenant monitoring** automation
- **No legal document** generation
- **No advisor or GP workflows**
- **No portfolio analytics**

### 🎯 Goal
Build all missing features in 48 weeks to achieve:
- $3-5M ARR
- 25-40 paying customers
- 100+ bps operational alpha delivered
- SOC 2 Type II certified
- $40-60M exit valuation

---

## Phase 2A: MVP Launch (Weeks 1-8)
**Goal:** Build sellable product worth $2,500/month Starter tier  
**Revenue Target:** 3-5 pilot customers, $90K-$150K ARR  
**Operational Alpha Delivered:** 40-50 basis points

### Week 1-2: AI Document Extraction Foundation
**Business Impact:** Core differentiator, enables all downstream features

#### Implementation Tasks
1. **Document Upload Interface** (3 days)
   - Build drag-and-drop upload component using react-dropzone
   - Support PDF, DOCX, XLSX formats (50MB max)
   - Add upload progress indicators and error handling
   - Store documents in object storage with metadata in database
   - Files: `client/src/components/DocumentUpload.tsx`, `client/src/pages/prospects/upload.tsx`

2. **Gemini API Integration** (4 days)
   - Configure Gemini 2.0 Flash API client (already have API key)
   - Build prompt templates for fund document extraction
   - Extract: fund name, AUM, vintage year, GP name, GP track record, portfolio company count, fund structure
   - Implement confidence scoring (High >98%, Medium 90-97%, Low <90%)
   - Add human-in-the-loop workflow for low-confidence extractions
   - Files: `server/services/aiExtraction.ts`, `shared/schema.ts` (add extraction_results table)

3. **Extraction Results Display** (3 days)
   - Build results view showing extracted fields with confidence badges
   - Add edit capability for user corrections
   - Implement "Accept" workflow to create prospect from extraction
   - Store user corrections to retrain models (future)
   - Files: `client/src/pages/prospects/extraction-results.tsx`, `client/src/components/ExtractionCard.tsx`

**Success Metrics:**
- ✅ Upload and extract 10 test documents with >95% accuracy
- ✅ End-to-end flow: Upload → Extract → Review → Save prospect
- ✅ Confidence scoring working correctly

### Week 3-4: Operations Dashboard & Underwriting
**Business Impact:** Makes AI extraction actionable, completes underwriting workflow

#### Implementation Tasks
1. **Prospects List View** (2 days)
   - Build prospects table with sorting, filtering, search
   - Show fund name, AUM, vintage, stage, last activity
   - Add quick actions (view, edit, delete, convert to facility)
   - Implement pagination for 100+ prospects
   - Files: `client/src/pages/operations/prospects.tsx`, API route: `server/routes.ts` (GET /api/prospects)

2. **Prospect Detail Page** (3 days)
   - Display all AI-extracted data in organized sections
   - Show extraction confidence scores
   - Add notes/comments section for team collaboration
   - Implement activity timeline (document uploaded, data extracted, edited, etc.)
   - Files: `client/src/pages/operations/prospect-detail.tsx`

3. **Manual LTV Calculator** (2 days)
   - Build calculator: Facility Amount / Fund NAV = LTV %
   - Add stress testing scenarios (-20%, -40% NAV decline)
   - Show LTV positioning (target: 5-15% for growth-focused)
   - Color-code risk levels (green <10%, yellow 10-15%, red >15%)
   - Files: `client/src/components/LTVCalculator.tsx`

4. **Eligibility Assessment Checklist** (3 days)
   - Build 10-point assessment framework:
     - GP track record (3 points)
     - Fund diversification (2 points)
     - Portfolio company quality (2 points)
     - Vintage year appropriateness (1 point)
     - Liquidity profile (2 points)
   - Calculate total score with recommendation (>7 = Eligible, 4-7 = Review, <4 = Decline)
   - Allow manual override with reason
   - Files: `client/src/components/EligibilityAssessment.tsx`

**Success Metrics:**
- ✅ View, edit, and manage 50+ prospects
- ✅ Complete underwriting assessment in <10 minutes (vs 40-60 hours manual)
- ✅ LTV calculator matches manual spreadsheet calculations

### Week 5-6: Facility Management System
**Business Impact:** Foundation for covenant monitoring and portfolio analytics

#### Implementation Tasks
1. **Create Facility from Prospect** (2 days)
   - Build conversion workflow: Prospect → Facility
   - Collect facility terms: amount, pricing, maturity date, structure (revolving/term)
   - Set initial draw amount and calculate remaining capacity
   - Generate facility ID and store in database
   - Files: `client/src/pages/operations/create-facility.tsx`, API: POST /api/facilities

2. **Facility Detail View** (3 days)
   - Display facility overview (amount, drawn, remaining, LTV, maturity)
   - Show linked fund information (from prospect)
   - Add covenant summary section (populated in next phase)
   - Include document vault section (initially empty)
   - Files: `client/src/pages/operations/facility-detail.tsx`

3. **Draw & Repayment Tracking** (3 days)
   - Build draw request form (amount, purpose, requested date)
   - Implement approval workflow (auto-approve for now, manual in Phase 3)
   - Add repayment logging (amount, date, type: scheduled/prepayment)
   - Calculate and update remaining capacity
   - Show transaction history table
   - Files: `client/src/components/DrawRepaymentHistory.tsx`, API: POST /api/facilities/:id/draws, POST /api/facilities/:id/repayments

4. **Facilities Dashboard** (2 days)
   - Build list view showing all active facilities
   - Display key metrics: total committed ($), total drawn ($), weighted avg LTV (%)
   - Add filters by status, fund, vintage, GP
   - Show quick stats cards at top (# facilities, total exposure, avg facility size)
   - Files: `client/src/pages/operations/facilities.tsx`

**Success Metrics:**
- ✅ Convert prospect to facility in <5 minutes
- ✅ Track draws and repayments accurately
- ✅ Dashboard shows real-time portfolio metrics

### Week 7-8: Basic Covenant Monitoring + MVP Testing
**Business Impact:** Delivers first measurable operational alpha (25-35 bps)

#### Implementation Tasks
1. **Covenant Entry & Configuration** (3 days)
   - Support 4 covenant types:
     - LTV (Loan-to-Value): threshold % (e.g., 15%)
     - Minimum NAV: absolute $ amount
     - Diversification: max % in single portfolio company (e.g., 25%)
     - Liquidity: minimum cash reserves $ or %
   - Build covenant entry form on facility detail page
   - Allow multiple covenants per facility
   - Store threshold values and check frequency (quarterly default)
   - Files: `client/src/components/CovenantConfig.tsx`, shared/schema.ts (covenants table)

2. **Covenant Status Dashboard** (3 days)
   - Calculate current covenant values (LTV from draws, NAV from fund data)
   - Implement 3-tier status:
     - Compliant (green): >10% cushion from threshold
     - Warning (yellow): Within 10% of threshold
     - Breach (red): Exceeded threshold
   - Build covenant status table on facility detail
   - Add portfolio-wide covenant dashboard showing all breaches/warnings
   - Files: `client/src/pages/operations/covenant-dashboard.tsx`, `server/services/covenantMonitoring.ts`

3. **Breach Alert System** (2 days)
   - Implement email notifications for covenant breaches
   - Send daily digest of warnings to operations team
   - Allow users to configure alert preferences (email, frequency)
   - Log all alerts sent for audit trail
   - Files: `server/services/emailService.ts`, add notifications table to schema

4. **MVP Testing & Pilot Launch** (2 days)
   - End-to-end testing of all MVP features
   - Create demo data (10 prospects, 5 facilities, 20 covenants)
   - Write user documentation and quick start guide
   - Prepare pilot customer onboarding materials
   - Conduct internal demo and gather feedback
   - Files: `QUICK_START.md`, `USER_GUIDE.md`

**Success Metrics:**
- ✅ Covenant monitoring working across 20+ test facilities
- ✅ Breach alerts triggering correctly
- ✅ MVP can be demoed in 15-minute customer call
- ✅ Ready to onboard first 3-5 pilot customers

**Week 8 Milestone: MVP LAUNCH**
- **Features:** AI extraction, underwriting dashboard, facility management, basic covenant monitoring
- **Customer Value:** 40-50 bps operational alpha (underwriting automation + quarterly monitoring)
- **Pricing:** Starter tier $2,500/month
- **Target:** 3-5 pilot customers at 50% discount ($1,250/month)
- **ARR:** $45K-$75K pilot revenue

---

## Phase 2B: Professional Tier (Weeks 9-16)
**Goal:** Build features for $7,500/month Professional tier  
**Revenue Target:** 8-12 customers, $500K-$750K ARR  
**Operational Alpha Delivered:** 85-95 basis points (approaching full 100 bps)

### Week 9-10: Advanced AI Features
**Business Impact:** Increases extraction accuracy to 98%+, enables batch processing

#### Implementation Tasks
1. **Batch Document Processing** (2 days)
   - Allow upload of multiple documents (10-20 at once)
   - Process in parallel using async queues
   - Show batch processing status dashboard
   - Notify when batch complete
   - Files: `server/services/batchProcessor.ts`, use Bull queue or similar

2. **Portfolio Company Extraction** (3 days)
   - Extend Gemini prompts to extract individual portfolio companies
   - Extract: company name, sector, investment date, cost basis, current value
   - Build portfolio company table linked to prospects/facilities
   - Calculate diversification metrics automatically
   - Files: Add portfolio_companies table to schema, `server/services/portfolioExtraction.ts`

3. **Credit Agreement Parsing** (3 days)
   - Build specialized prompts for legal documents
   - Extract covenant clauses, cross-default provisions, DSCR requirements
   - Highlight key terms and risk factors
   - Compare extracted covenants to database config
   - Files: `server/services/legalDocumentParser.ts`

4. **Extraction Quality Improvements** (2 days)
   - Implement retry logic for failed extractions
   - Add fallback to GPT-4 for complex documents
   - Build extraction accuracy dashboard (user corrections tracking)
   - Add feedback loop to improve prompts
   - Files: `server/services/extractionQuality.ts`

**Success Metrics:**
- ✅ 98%+ extraction accuracy on test corpus (100 documents)
- ✅ Batch process 20 documents in <5 minutes
- ✅ Portfolio company extraction matches manual review

### Week 11-12: Real-Time Covenant Monitoring
**Business Impact:** Moves from quarterly to real-time monitoring, predictive breach alerts

#### Implementation Tasks
1. **Automated Quarterly Checks** (2 days)
   - Build scheduled job (cron) to check all covenants quarterly
   - Auto-fetch NAV data from fund administrator feeds (mock for now)
   - Recalculate LTV, diversification, liquidity metrics
   - Update covenant status in database
   - Send batch alert for any new breaches/warnings
   - Files: `server/jobs/quarterlyCovenantCheck.ts`

2. **Real-Time Monitoring Dashboard** (3 days)
   - Build live dashboard showing covenant status across portfolio
   - Add filters: by facility, by covenant type, by status
   - Show trend charts (covenant values over time)
   - Implement "Days to Breach" metric (projected breach date)
   - Files: `client/src/pages/operations/covenant-monitoring.tsx`

3. **Breach Prediction ML Model** (3 days)
   - Build simple linear regression model predicting LTV trajectory
   - Input features: current LTV, draw rate, NAV volatility, market conditions
   - Predict 30-day and 90-day breach probability (%)
   - Show predictions on covenant dashboard with confidence intervals
   - Files: `server/ml/breachPrediction.ts`, train on historical data

4. **Advanced Alerting** (2 days)
   - Add Slack integration for instant breach notifications
   - Implement escalation rules (email → Slack → SMS for critical breaches)
   - Allow custom alert thresholds per user
   - Build alert history and audit log
   - Files: `server/services/slackNotifications.ts`

**Success Metrics:**
- ✅ Quarterly checks run automatically without manual intervention
- ✅ Breach prediction accuracy >70% (30-day horizon)
- ✅ Real-time dashboard loads <2 seconds with 50+ facilities

### Week 13-14: Legal Document Automation
**Business Impact:** Delivers 20-30 bps operational alpha, high customer satisfaction

#### Implementation Tasks
1. **Template System** (3 days)
   - Create database schema for document templates
   - Build 3 initial templates:
     - Loan Agreement (25-page NAV facility agreement)
     - Term Sheet (3-page summary of proposed terms)
     - Compliance Certificate (quarterly covenant compliance report)
   - Use Handlebars or similar for variable substitution
   - Store templates with version control
   - Files: Add document_templates table, `server/services/templateEngine.ts`

2. **Variable Substitution Engine** (2 days)
   - Map database fields to template variables:
     - {{borrower_name}}, {{facility_amount}}, {{maturity_date}}, {{ltv_threshold}}, etc.
   - Build auto-population from facility data
   - Handle date formatting, currency formatting, legal language
   - Allow manual override of any variable
   - Files: `server/services/documentGenerator.ts`

3. **Conditional Logic** (2 days)
   - Implement template conditionals:
     - IF revolving_facility THEN include draw provisions
     - IF secured THEN include collateral schedule
     - IF cross_default THEN include cross-default clause
   - Build UI to configure conditional sections
   - Test with various facility structures
   - Files: Extend template engine with conditionals

4. **PDF/DOCX Export** (3 days)
   - Integrate libraries: pdfkit for PDF, docx for Word
   - Build export API endpoint: GET /api/facilities/:id/documents/:type/export
   - Apply legal formatting (headers, footers, page numbers, signature blocks)
   - Add watermark for draft vs. final versions
   - Store generated documents in vault
   - Files: `server/services/documentExport.ts`

**Success Metrics:**
- ✅ Generate loan agreement in <30 seconds (vs 15-20 hours manual)
- ✅ Documents match legal review quality (test with 5 attorneys)
- ✅ Export to both PDF and DOCX working correctly

### Week 15-16: Deal Pipeline Management + Testing
**Business Impact:** Makes platform daily-use tool, critical for retention

#### Implementation Tasks
1. **Kanban Board UI** (3 days)
   - Build drag-and-drop pipeline:
     - Stages: Prospect → Underwriting → Term Sheet → Due Diligence → Closed → Active
   - Use react-beautiful-dnd or similar
   - Show deal count and total $ value per stage
   - Add filters by assigned user, fund type, vintage
   - Files: `client/src/pages/operations/pipeline.tsx`, `client/src/components/PipelineBoard.tsx`

2. **Stage Transitions** (2 days)
   - Implement drag-and-drop to move deals between stages
   - Add required fields per stage (e.g., Term Sheet stage requires uploaded term sheet)
   - Log all stage changes with timestamp and user
   - Show average days in each stage
   - Files: API: PATCH /api/deals/:id/stage

3. **Activity Tracking** (2 days)
   - Build activity log: calls, emails, meetings, notes
   - Add quick actions on deal cards (log call, add note, set reminder)
   - Implement reminder notifications (email 24 hours before)
   - Show activity timeline on deal detail page
   - Files: Add activities table, `client/src/components/ActivityLog.tsx`

4. **Conversion Analytics** (2 days)
   - Build funnel visualization showing conversion rates per stage
   - Calculate metrics: win rate, average deal cycle time, conversion velocity
   - Show trending (improving/declining conversion rates)
   - Add filters by time period, deal size, fund type
   - Files: `client/src/pages/operations/analytics.tsx`

5. **Professional Tier Testing** (1 day)
   - End-to-end testing of all Phase 2B features
   - Performance testing with 100+ deals, 50+ facilities
   - User acceptance testing with pilot customers
   - Document Professional tier features in upgrade guide
   - Files: Update `USER_GUIDE.md`

**Success Metrics:**
- ✅ Pipeline board manages 100+ deals without performance issues
- ✅ Activity tracking captures all user interactions
- ✅ Analytics dashboard provides actionable insights

**Week 16 Milestone: PROFESSIONAL TIER LAUNCH**
- **Features:** All MVP + advanced AI + real-time monitoring + legal automation + pipeline management
- **Customer Value:** 85-95 bps operational alpha
- **Pricing:** Professional tier $7,500/month
- **Target:** Convert 3-5 pilot customers to paid, add 5-7 new Professional customers
- **ARR:** $500K-$750K

---

## Phase 3A: Two-Sided Marketplace (Weeks 17-24)
**Goal:** Enable advisor and GP workflows to create marketplace dynamics  
**Revenue Target:** 15-20 customers, $1.2M-$1.5M ARR  
**Strategic Value:** Differentiation vs 73 Strings, network effects

### Week 17-18: Advisor RFP Portal Foundation
**Business Impact:** Opens new revenue channel (advisors), creates liquidity

#### Implementation Tasks
1. **Fund Anonymization Workflow** (3 days)
   - Build "Create Anonymous RFP" form
   - Mask fund identity while providing data:
     - Show: AUM range ($100-200M), vintage (2018-2020), sector focus, portfolio company count range
     - Hide: Fund name, GP name, specific companies
   - Generate anonymous fund ID (e.g., "Fund_ANX2024_001")
   - Store mapping between real fund and anonymous ID
   - Files: `client/src/pages/advisor/create-rfp.tsx`, add rfp_processes table

2. **Multi-Lender Bidding System** (3 days)
   - Allow advisor to invite 5-8 lenders to RFP
   - Send email invitations with RFP link and deadline
   - Build lender bid submission form (proposed terms, LTV, pricing, covenants)
   - Track bid status (invited, viewed, submitted, declined)
   - Files: `client/src/pages/advisor/rfp-detail.tsx`, add rfp_bids table

3. **Bid Comparison View** (2 days)
   - Build side-by-side comparison table:
     - Columns: Lender, LTV %, Pricing (SOFR + spread), Covenants, Terms
   - Highlight best terms (lowest pricing, highest LTV, fewest covenants)
   - Allow advisor to shortlist 2-3 bids
   - Export comparison to PDF for fund presentation
   - Files: `client/src/components/BidComparison.tsx`

4. **Commission Calculator** (2 days)
   - Calculate advisor fee: Facility Amount × Basis Points (50-75 bps)
   - Show commission breakdown if multiple advisors involved
   - Track commission status (pending, invoiced, paid)
   - Generate commission invoice PDF
   - Files: `client/src/components/CommissionCalculator.tsx`, add commissions table

**Success Metrics:**
- ✅ Create and run RFP with 3+ lenders in <1 hour
- ✅ Fund anonymization prevents lender identification
- ✅ Bid comparison provides clear decision support

### Week 19-20: Market Intelligence + Advisor Features
**Business Impact:** Provides advisors with pricing power and negotiation data

#### Implementation Tasks
1. **Market Data Aggregation** (3 days)
   - Aggregate anonymized data across all RFPs:
     - Median LTV by fund AUM segment
     - Median pricing (SOFR + spread) by vintage year
     - Common covenant thresholds
   - Build market intelligence dashboard
   - Show trending (LTV ratios tightening/loosening over time)
   - Files: `client/src/pages/advisor/market-intelligence.tsx`, `server/services/marketData.ts`

2. **Advisor Commission Tracking** (2 days)
   - Build advisor dashboard showing all deals and commission pipeline
   - Track: Prospective ($), Term Sheet ($), Closed ($)
   - Calculate total commissions earned (YTD, all-time)
   - Show commission by fund, by lender, by deal size
   - Files: `client/src/pages/advisor/commissions.tsx`

3. **Multi-Deal Management** (2 days)
   - Allow advisors to manage 10-20 concurrent RFPs
   - Build advisor pipeline view (similar to operations pipeline)
   - Add deadline tracking and overdue alerts
   - Show win rate and average commission per deal
   - Files: `client/src/pages/advisor/my-rfps.tsx`

4. **Lender Network** (3 days)
   - Build lender directory for advisors to browse
   - Show lender profile: typical LTV range, sectors, fund size preferences
   - Track lender responsiveness (% of RFPs responded to, avg response time)
   - Allow advisors to save "favorite" lenders for quick invites
   - Files: `client/src/pages/advisor/lender-network.tsx`, add lender_profiles table

**Success Metrics:**
- ✅ Market intelligence dashboard shows real-time benchmarks
- ✅ Advisors can track $5M+ commission pipeline
- ✅ Lender network has 20+ active lenders

### Week 21-22: GP Self-Service Portal Foundation
**Business Impact:** Reduces GP friction, enables direct lender-fund connections

#### Implementation Tasks
1. **Digital Onboarding Workflow** (4 days)
   - Build guided onboarding wizard (5 steps):
     - Step 1: Fund information (name, AUM, vintage, GP)
     - Step 2: Document upload (PPM, fund financials, portfolio list)
     - Step 3: Financing needs (amount seeking, purpose, timeline)
     - Step 4: Review AI-extracted data
     - Step 5: Submit to lenders
   - Save progress between steps
   - Send onboarding completion email to lenders
   - Files: `client/src/pages/gp/onboarding.tsx`, add gp_onboarding table

2. **GP Dashboard** (2 days)
   - Show GP's active facilities
   - Display available capacity, next payment due, covenant status
   - Add quick actions (request draw, view documents, message lender)
   - Show facility health score (green/yellow/red)
   - Files: `client/src/pages/gp/dashboard.tsx`

3. **Document Vault Access** (2 days)
   - Build GP view of facility documents
   - Show: loan agreement, compliance certificates, amendments, draw notices
   - Implement expiring access links (valid for 48 hours)
   - Log all document access for security audit
   - Files: `client/src/pages/gp/documents.tsx`

4. **Secure Messaging Beta** (2 days)
   - Build simple message thread between GP and lender
   - Store messages in database (not E2E encrypted in MVP, upgrade later)
   - Add file attachments to messages
   - Email notifications for new messages
   - Files: Add messages table, `client/src/components/MessageThread.tsx`

**Success Metrics:**
- ✅ GP can complete onboarding in <20 minutes
- ✅ Document vault provides secure, audited access
- ✅ Messaging enables direct GP-lender communication

### Week 23-24: Draw Request System + Marketplace Testing
**Business Impact:** Automates facility administration, reduces draw processing time 92%

#### Implementation Tasks
1. **Draw Request Interface** (3 days)
   - Build draw request form for GPs:
     - Amount requested
     - Purpose (capital call coverage, bridge financing, distributions)
     - Requested funding date
   - Auto-check remaining capacity (block if insufficient)
   - Calculate post-draw LTV and check covenant compliance
   - Submit to lender for approval
   - Files: `client/src/pages/gp/request-draw.tsx`, add draw_requests table

2. **Lender Approval Workflow** (2 days)
   - Notify lender of new draw request (email + in-app)
   - Build lender approval interface showing:
     - Request details, purpose, amount
     - Current facility status, remaining capacity
     - Post-draw covenant status (will any breach?)
   - Allow approve/decline with reason
   - Auto-update facility drawn balance on approval
   - Files: `client/src/pages/operations/draw-approvals.tsx`

3. **Repayment Tracking for GPs** (2 days)
   - Build GP view of repayment schedule
   - Show: upcoming payments (date, amount), past payments, outstanding balance
   - Calculate amortization schedule for term facilities
   - Send payment reminders (7 days before due date)
   - Files: `client/src/pages/gp/repayments.tsx`

4. **Two-Sided Marketplace Testing** (3 days)
   - End-to-end testing: GP onboards → Advisor creates RFP → Lenders bid → Deal closes → GP requests draws
   - Test with 3 real scenarios (fund types, deal structures)
   - User acceptance testing with advisor and GP beta users
   - Document two-sided marketplace workflows
   - Performance testing with 50+ concurrent users
   - Files: `MARKETPLACE_GUIDE.md`

**Success Metrics:**
- ✅ Draw request processed in <4 hours (vs 2 days manual)
- ✅ Marketplace connects 5+ advisors, 10+ lenders, 15+ GPs
- ✅ Network effects visible (lenders referring advisors, advisors bringing GPs)

**Week 24 Milestone: TWO-SIDED MARKETPLACE LAUNCH**
- **Features:** All Professional tier + advisor RFP portal + GP self-service + draw/repayment automation
- **Customer Value:** Marketplace liquidity, network effects
- **Pricing:** Professional tier $7,500/month (existing), Advisor tier $5,000/month, GP tier $3,000/month
- **Target:** 8-10 lenders, 5-7 advisors, 10-15 GPs
- **ARR:** $1.2M-$1.5M

---

## Phase 3B: Enterprise Features (Weeks 25-36)
**Goal:** Build features for Enterprise tier and strategic partnerships  
**Revenue Target:** 25-35 customers, $2.5M-$3.5M ARR  
**Strategic Value:** API enables fund admin integrations, white-label for large lenders

### Week 25-27: Portfolio Analytics Dashboard
**Business Impact:** Enterprise upsell, LP reporting automation

#### Implementation Tasks
1. **Real-Time Portfolio Overview** (3 days)
   - Build executive dashboard showing:
     - Total committed capital across all facilities ($)
     - Total drawn ($), total remaining capacity ($)
     - Weighted average LTV (%)
     - Number of facilities (active, pending, breached)
   - Add time-series charts (portfolio growth over time)
   - Show facility count by stage, by vintage, by sector
   - Files: `client/src/pages/operations/portfolio-overview.tsx`

2. **Risk Concentration Heat Maps** (4 days)
   - Build interactive heat maps:
     - Exposure by fund vintage year (identify vintage concentration)
     - Exposure by sector (tech, healthcare, industrials, etc.)
     - Exposure by GP (top 10 GPs by $ exposure)
     - Geographic concentration (if applicable)
   - Use recharts or D3.js for visualizations
   - Add drill-down capability (click sector → see facilities)
   - Files: `client/src/components/ConcentrationHeatMap.tsx`

3. **Performance Metrics** (3 days)
   - Calculate and display:
     - Portfolio ROI (interest income / deployed capital)
     - Default rate (# defaulted / total facilities)
     - Recovery rate ($ recovered / $ defaulted)
     - Average facility yield (weighted by $ size)
   - Compare to benchmarks (industry averages)
   - Show trending (improving/declining performance)
   - Files: `client/src/pages/operations/performance.tsx`

4. **Scenario Analysis & Stress Testing** (5 days)
   - Build stress testing engine:
     - Scenario 1: Market downturn (-20% NAV across portfolio)
     - Scenario 2: Recession (-40% NAV)
     - Scenario 3: Sector-specific stress (e.g., tech down 50%)
   - Calculate impact on:
     - LTV ratios (how many facilities breach?)
     - Expected losses ($ at risk)
     - Portfolio value at risk (VaR)
   - Show waterfall charts of covenant breaches under stress
   - Files: `client/src/pages/operations/stress-testing.tsx`, `server/services/stressTest.ts`

5. **CSV Export & Reporting** (2 days)
   - Build export functionality for all dashboards
   - Export formats: CSV, Excel, PDF
   - Allow custom date ranges and filters
   - Include logo and branding for LP presentation
   - Schedule automated weekly/monthly reports via email
   - Files: `server/services/reportExport.ts`

**Success Metrics:**
- ✅ Portfolio overview loads <3 seconds with 100+ facilities
- ✅ Stress testing accurately predicts breach scenarios
- ✅ Export generates LP-ready reports

### Week 28-30: Public API Development
**Business Impact:** Enables fund admin integrations, critical for Enterprise tier

#### Implementation Tasks
1. **API Design & Documentation** (3 days)
   - Design RESTful API covering all platform functionality:
     - Prospects: GET, POST, PUT, DELETE
     - Facilities: GET, POST, PUT, PATCH
     - Covenants: GET, POST monitoring data
     - Documents: GET, POST uploads
     - RFPs: GET, POST bids (advisor endpoints)
   - Use OpenAPI 3.0 spec
   - Build Swagger/Redoc documentation site
   - Files: `server/api/v1/`, `openapi.yaml`

2. **OAuth 2.0 Authentication** (3 days)
   - Implement OAuth 2.0 server for third-party apps
   - Support authorization_code and client_credentials flows
   - Generate API keys and secrets
   - Build API key management UI (create, rotate, revoke)
   - Rate limiting (1000 requests/hour per key)
   - Files: `server/auth/oauth.ts`, `client/src/pages/settings/api-keys.tsx`

3. **Webhook System** (3 days)
   - Build webhook infrastructure for real-time events:
     - covenant.breached
     - facility.draw_requested
     - facility.draw_approved
     - rfp.bid_submitted
     - document.uploaded
   - Allow users to configure webhook endpoints
   - Implement retry logic (3 attempts with exponential backoff)
   - Log all webhook deliveries
   - Files: `server/services/webhooks.ts`, add webhook_subscriptions table

4. **API Testing & Client SDKs** (3 days)
   - Comprehensive API testing (Postman collection)
   - Build client SDKs:
     - JavaScript/TypeScript SDK (npm package)
     - Python SDK (PyPI package)
   - Write API integration guides
   - Create sample apps demonstrating API usage
   - Files: `packages/alphanav-sdk-js/`, `packages/alphanav-sdk-python/`, `API_GUIDE.md`

**Success Metrics:**
- ✅ API documentation complete and published
- ✅ OAuth 2.0 authentication working correctly
- ✅ Webhooks deliver events reliably (<1% failure rate)
- ✅ SDK enables 3rd party integration in <1 hour

### Week 31-33: Fund Administrator Integrations
**Business Impact:** Automates NAV data feeds, eliminates manual data entry

#### Implementation Tasks
1. **Integration Architecture** (2 days)
   - Design integration framework supporting multiple fund admins
   - Build plugin system for different admin APIs
   - Implement data mapping between admin formats and AlphaNAV schema
   - Add credential management (encrypted storage of API keys)
   - Files: `server/integrations/`, `server/integrations/base.ts`

2. **SS&C Integration** (4 days)
   - Build SS&C Geneva API connector
   - Fetch quarterly NAV data for all portfolio companies
   - Map SS&C fields to AlphaNAV portfolio_companies table
   - Auto-update facility LTV ratios on NAV receipt
   - Handle errors and data quality issues
   - Files: `server/integrations/ssc.ts`

3. **Alter Domus Integration** (3 days)
   - Build Alter Domus API connector (similar to SS&C)
   - Support both automated feeds and manual file upload
   - Parse Alter Domus Excel reports
   - Files: `server/integrations/alterDomus.ts`

4. **Apex Group Integration** (3 days)
   - Build Apex API connector
   - Support SFTP file transfer for legacy systems
   - Parse Apex CSV/Excel formats
   - Files: `server/integrations/apex.ts`

5. **Integration Management UI** (2 days)
   - Build integrations settings page
   - Show connected integrations, status, last sync time
   - Allow users to add/remove integrations
   - Display sync logs and error messages
   - Manual trigger for sync (vs automatic quarterly)
   - Files: `client/src/pages/settings/integrations.tsx`

**Success Metrics:**
- ✅ SS&C integration auto-updates NAV data for 20+ facilities
- ✅ Sync completes in <10 minutes for 50 facilities
- ✅ Error rate <5% on production data

### Week 34-36: Accounting Integration + White-Label
**Business Impact:** Completes Enterprise tier, enables strategic partnerships

#### Implementation Tasks
1. **QuickBooks Integration** (3 days)
   - Integrate QuickBooks API for billing and revenue recognition
   - Auto-create invoices for subscription fees
   - Record facility fees, draw fees, commission payments
   - Sync payment status
   - Files: `server/integrations/quickbooks.ts`

2. **Xero Integration** (2 days)
   - Build Xero API connector (similar to QuickBooks)
   - Support multi-currency if needed
   - Files: `server/integrations/xero.ts`

3. **White-Label Platform** (5 days)
   - Build multi-tenant architecture supporting custom branding:
     - Logo upload and display
     - Custom color scheme (primary, secondary, accent)
     - Custom domain (e.g., nav.17capital.com)
   - Create tenant management admin panel
   - Isolate tenant data (row-level security)
   - Support SSO for enterprise tenants
   - Files: Add tenants table, `server/middleware/tenancy.ts`, `client/src/pages/admin/tenants.tsx`

4. **Enterprise Configuration** (2 days)
   - Build advanced settings for Enterprise customers:
     - Custom covenant types
     - Custom document templates
     - Custom workflow stages
     - Custom role permissions
   - Allow export/import of configurations
   - Files: `client/src/pages/settings/enterprise.tsx`

5. **Enterprise Testing** (3 days)
   - End-to-end testing of all Enterprise features
   - White-label deployment test (separate subdomain)
   - API integration test with mock fund admin
   - Load testing (1000+ facilities, 100+ concurrent users)
   - Document Enterprise tier in sales materials
   - Files: `ENTERPRISE_GUIDE.md`

**Success Metrics:**
- ✅ White-label deployment working on custom domain
- ✅ Accounting integrations sync transactions accurately
- ✅ Platform handles 1000+ facilities without performance degradation

**Week 36 Milestone: ENTERPRISE FEATURES COMPLETE**
- **Features:** All Professional tier + portfolio analytics + API + integrations + white-label
- **Customer Value:** Full operational stack, ready for large lenders ($1B+ portfolios)
- **Pricing:** Enterprise tier custom ($15K-$30K/month depending on facility count)
- **Target:** 3-5 Enterprise customers, 20+ Professional customers, 10+ Advisors/GPs
- **ARR:** $2.5M-$3.5M

---

## Phase 4: Growth & Compliance (Weeks 37-48)
**Goal:** Achieve SOC 2 certification, build viral growth engine, prepare for exit  
**Revenue Target:** 35-50 customers, $4M-$5.5M ARR  
**Strategic Value:** SOC 2 removes sales objections, viral tool generates 10K+ leads

### Week 37-40: SOC 2 Type II Preparation
**Business Impact:** Required for enterprise sales, increases valuation

#### Implementation Tasks
1. **Audit Trail Enhancement** (4 days)
   - Implement comprehensive logging of all user actions:
     - Data access (who viewed what, when)
     - Data modifications (before/after values)
     - Authentication events (login, logout, failures)
     - Permission changes
   - Store logs in immutable audit table
   - Build admin audit log viewer
   - Retain logs for 7 years (compliance requirement)
   - Files: Add audit_logs table, `server/middleware/auditLogger.ts`

2. **Data Encryption Validation** (3 days)
   - Audit all data at rest encryption (PostgreSQL transparent data encryption)
   - Validate TLS 1.3 for all data in transit
   - Implement field-level encryption for sensitive data (SSNs, account numbers if applicable)
   - Document encryption architecture
   - Files: `SECURITY_ARCHITECTURE.md`

3. **Access Control Review** (3 days)
   - Audit role-based permissions (Operations, Advisor, GP, Admin)
   - Implement least-privilege principle
   - Add multi-factor authentication (MFA) requirement for admins
   - Build permission matrix documentation
   - Test permission enforcement across all endpoints
   - Files: `server/middleware/rbac.ts`, `PERMISSION_MATRIX.md`

4. **Security Policy Documentation** (3 days)
   - Write formal security policies:
     - Information Security Policy
     - Data Classification Policy
     - Incident Response Policy
     - Business Continuity / Disaster Recovery Policy
   - Document change management procedures
   - Create employee security training materials
   - Files: `docs/policies/`

5. **Penetration Testing** (3 days)
   - Hire external security firm for penetration test
   - Test OWASP Top 10 vulnerabilities
   - Fix all critical and high-severity findings
   - Document remediation efforts
   - Retest to verify fixes
   - Files: `PENTEST_RESULTS.md`, `REMEDIATION_PLAN.md`

6. **SOC 2 Audit** (4 days)
   - Engage SOC 2 auditor (Vanta, Drata, or Big 4 accounting firm)
   - Provide evidence for all controls
   - Conduct audit interviews
   - Review draft audit report
   - Receive SOC 2 Type II certification
   - Files: `SOC2_REPORT.pdf` (confidential)

**Success Metrics:**
- ✅ SOC 2 Type II certification achieved
- ✅ Zero critical vulnerabilities in penetration test
- ✅ Audit trail captures 100% of data access/modifications

### Week 41-44: Viral Rosetta Stone Tool
**Business Impact:** Generates 10K-15K monthly users, 3-5% conversion to paid

#### Implementation Tasks
1. **Interactive Compliance Mapper** (5 days)
   - Build free standalone tool (separate from main platform)
   - User inputs:
     - Fund AUM size
     - Desired facility size
     - Jurisdiction (US, UK, EU)
     - Covenant types they're considering
   - Tool outputs:
     - Regulatory requirements (if any)
     - Industry standard covenant thresholds (from market data)
     - Risk assessment (aggressive/moderate/conservative positioning)
     - Recommended legal review checklist
   - Beautiful visualizations (charts, graphs)
   - Files: `client/src/pages/public/rosetta-stone.tsx`

2. **Lead Capture Mechanism** (2 days)
   - Require email to generate full report
   - Qualify leads with questions:
     - Role (lender, fund, advisor)
     - Company name
     - Current NAV lending volume (for lenders)
   - Send report via email with AlphaNAV branding
   - Add to email marketing list (MailChimp/Klaviyo)
   - Files: Add leads table, integrate with email service

3. **Viral Sharing Features** (2 days)
   - Add "Share Report" button (LinkedIn, email, PDF download)
   - Generate unique shareable link for each report
   - Track shares and viral coefficient
   - Offer incentive for shares (e.g., unlock advanced features after 3 shares)
   - Files: `server/services/viralTracking.ts`

4. **SEO Optimization** (2 days)
   - Optimize Rosetta Stone page for search:
     - Target keywords: "NAV lending covenants", "NAV facility terms", "LTV ratio calculator"
   - Create supporting blog posts (5-10 posts)
   - Build backlinks from industry sites
   - Submit to Product Hunt, Hacker News
   - Files: Update meta tags, create `blog/` directory

5. **Marketing Automation** (3 days)
   - Build email drip campaign for Rosetta Stone users:
     - Day 0: Report delivery + introduction to AlphaNAV
     - Day 3: Case study (how AlphaNAV saved lender 100 bps)
     - Day 7: Free consultation offer
     - Day 14: Limited-time trial discount
   - Track email opens, clicks, conversions
   - A/B test subject lines and CTAs
   - Files: Email templates, integrate with MailChimp API

**Success Metrics:**
- ✅ 10K+ monthly users of Rosetta Stone tool by Month 12
- ✅ 3-5% conversion to platform trial
- ✅ Viral coefficient >1.2 (each user brings 1.2 new users)

### Week 45-48: Scaling & Exit Preparation
**Business Impact:** Prepare platform for strategic acquisition

#### Implementation Tasks
1. **Performance Optimization** (4 days)
   - Database query optimization (add indexes, optimize N+1 queries)
   - Implement Redis caching for frequently accessed data
   - Add CDN for static assets
   - Optimize React bundle size (code splitting, lazy loading)
   - Load test with 100+ concurrent users, 2000+ facilities
   - Target: <2 second page load, <500ms API response
   - Files: Performance testing scripts, caching layer

2. **Customer Success Program** (3 days)
   - Build customer health score:
     - Login frequency (weekly active users)
     - Feature adoption (% of features used)
     - Support ticket volume
     - Contract renewal probability
   - Create CSM dashboard showing at-risk accounts
   - Build automated onboarding email series
   - Quarterly business reviews with Enterprise customers
   - Files: `client/src/pages/admin/customer-health.tsx`

3. **Case Studies & Testimonials** (3 days)
   - Document 5-7 customer success stories:
     - Operational alpha delivered (X bps)
     - Time savings (Y hours/month)
     - Deal volume increase (Z% more deals)
   - Video testimonials from 3 customers
   - ROI calculator for prospects
   - Sales deck with customer logos and metrics
   - Files: `CASE_STUDIES.md`, video files

4. **Data Room Preparation** (3 days)
   - Organize virtual data room for acquirers:
     - Financial statements (revenue, expenses, ARR)
     - Customer list with ARR by customer
     - Product roadmap and technical documentation
     - Team org chart and employee agreements
     - Legal documents (incorporation, IP assignments)
     - Security documentation (SOC 2 report)
   - Clean cap table
   - Files: Data room folder structure

5. **Investment Bank Engagement** (2 days)
   - Engage M&A advisor (Moelis, Raymond James, Union Square Advisors)
   - Prepare CIM (Confidential Information Memorandum)
   - Identify 15-20 potential acquirers:
     - Category 1: Private capital platforms (BlackRock Aladdin, SS&C, Addepar)
     - Category 2: NAV lenders (17Capital, Pantheon, Arcmont, Churchill)
     - Category 3: Fund administrators (Alter Domus, Apex, Citco)
   - Initiate outreach
   - Files: `CIM.pdf`, acquirer target list

6. **Platform Hardening** (3 days)
   - Final security review and hardening
   - Disaster recovery test (restore from backup)
   - Chaos engineering (test system resilience)
   - Update all dependencies to latest stable versions
   - Complete documentation audit
   - Files: `DISASTER_RECOVERY_TEST.md`

**Success Metrics:**
- ✅ Platform handles 100 concurrent users with <2s response time
- ✅ Customer health score shows 85%+ accounts healthy
- ✅ 5 strong case studies with measurable ROI
- ✅ Data room complete and organized

**Week 48 Milestone: EXIT-READY**
- **Features:** Complete platform delivering 100 bps operational alpha
- **Customer Value:** SOC 2 certified, enterprise-grade, fully automated NAV lending operations
- **Revenue:** $4M-$5.5M ARR with 35-50 customers
- **Strategic Value:** Ready for $40-60M acquisition (8-12x ARR typical for B2B SaaS fintech)
- **Target:** Close strategic acquisition within 8-12 weeks

---

## Revenue Projections by Phase

| Phase | Timeline | Features | Target Customers | ARR | LTV:CAC |
|-------|----------|----------|------------------|-----|---------|
| Phase 1 (Complete) | Weeks -24 to 0 | Foundation + Auth | 0 | $0 | N/A |
| Phase 2A (MVP) | Weeks 1-8 | AI + Underwriting + Basic Monitoring | 3-5 pilot | $45K-$75K | 5:1 |
| Phase 2B (Professional) | Weeks 9-16 | Advanced AI + Legal + Pipeline | 8-12 | $500K-$750K | 8:1 |
| Phase 3A (Marketplace) | Weeks 17-24 | Advisor + GP Portals | 15-20 | $1.2M-$1.5M | 12:1 |
| Phase 3B (Enterprise) | Weeks 25-36 | Analytics + API + Integrations | 25-35 | $2.5M-$3.5M | 15:1 |
| Phase 4 (Growth) | Weeks 37-48 | SOC 2 + Viral Tool + Scaling | 35-50 | $4M-$5.5M | 20:1 |

**Net Dollar Retention Target:** 120% (expansion from facility count growth + tier upgrades)

---

## Resource Requirements

### Team (Current + Hiring Plan)

**Current (Phase 1):**
- 1 Founder/CEO (technical)
- 0 Additional team

**Phase 2 (Weeks 1-16):**
- 1 Full-stack engineer (hire Week 1) - $120K-$150K
- 1 Product designer (contract) - $80/hour, 20 hours/week
- Total: 2-3 people

**Phase 3 (Weeks 17-36):**
- +1 Frontend engineer (hire Week 17) - $110K-$140K
- +1 Backend engineer (hire Week 17) - $110K-$140K
- +1 Sales/BD (hire Week 20) - $80K base + commission
- +1 Customer success (hire Week 24) - $70K-$90K
- Total: 6-7 people

**Phase 4 (Weeks 37-48):**
- +1 Sales/BD (hire Week 38) - $80K base + commission
- +1 DevOps/Security (contract) - $100/hour, 20 hours/week
- +1 Marketing/Growth (hire Week 40) - $90K-$110K
- Total: 9-10 people

**Total Payroll (Annual):** ~$900K-$1.1M by Week 48

### Technology Costs

- **Infrastructure:** $500/month (Neon DB, hosting, CDN)
- **AI APIs:** $2K-$5K/month (Gemini, scales with usage)
- **SaaS Tools:** $1K/month (analytics, monitoring, email)
- **Security:** $10K one-time (penetration testing), $30K (SOC 2 audit)
- **Total Tech Spend:** ~$60K-$80K annually

### Marketing & Sales

- **Conferences:** $50K/year (sponsorships, booth, travel)
- **Content Marketing:** $30K/year (writers, SEO, ads)
- **Sales Tools:** $10K/year (CRM, prospecting, enablement)
- **Total Marketing:** ~$90K-$100K annually

### Total Operating Expenses

- **Year 1 (Weeks 1-48):** $1.8M-$2.2M
- **Funding Required:** Assume $2.5M seed round or bootstrap profitable after Week 24

---

## Risk Mitigation Strategies

### Technical Risks

**Risk 1: AI Accuracy Below 95%**
- **Mitigation:** Confidence scoring + human-in-the-loop for low confidence
- **Backup:** Offshore data entry at $25/hour for fallback
- **Success Metric:** Track accuracy weekly, target >98% by Week 16

**Risk 2: Performance Issues at Scale**
- **Mitigation:** Load testing at each phase milestone
- **Backup:** Database optimization, caching, horizontal scaling
- **Success Metric:** <2s page load with 100+ concurrent users

**Risk 3: Integration Failures with Fund Admins**
- **Mitigation:** Manual file upload as alternative to API
- **Backup:** Build partnerships with admins for better API access
- **Success Metric:** 95%+ successful syncs

### Business Risks

**Risk 4: Slow Customer Adoption**
- **Mitigation:** Freemium tier (5 facilities free)
- **Backup:** Revenue share model (10-15 bps vs fixed subscription)
- **Success Metric:** 3+ pilot customers by Week 8, 10+ by Week 24

**Risk 5: Competition from 73 Strings**
- **Mitigation:** Vertical depth (advisor portal, GP tools) they won't build
- **Backup:** Position as integration partner vs competitor
- **Success Metric:** Lock in 15-20 customers before competition reacts

**Risk 6: Regulatory Changes**
- **Mitigation:** Build compliance features that help lenders adapt
- **Backup:** Expand to Europe/Asia with different regulations
- **Success Metric:** Monitor regulatory landscape, scenario planning

---

## Success Metrics Dashboard

### Product Metrics (Track Weekly)
- Feature completion % (target: 100% by Week 48)
- AI extraction accuracy % (target: >98%)
- Page load time (target: <2s)
- API uptime % (target: 99.9%)

### Customer Metrics (Track Monthly)
- Total customers (target: 35-50 by Week 48)
- ARR (target: $4M-$5.5M by Week 48)
- Customer churn rate (target: <10% annual)
- Net dollar retention (target: 120%)
- Net promoter score (target: >50)

### Operational Alpha Metrics (Track Per Customer)
- Underwriting time saved (target: 40+ hours/deal)
- Covenant monitoring time saved (target: 8+ hours/quarter)
- Legal doc generation time saved (target: 15+ hours/deal)
- Total basis points delivered (target: 100 bps)

### Growth Metrics (Track Weekly)
- Rosetta Stone users (target: 10K+/month)
- Trial signups (target: 3-5% of Rosetta users)
- Trial-to-paid conversion (target: 30%)
- LTV:CAC ratio (target: 15:1+ by Week 48)

---

## Next Steps: Immediate Action Plan (Week 1)

### Day 1-2: Team & Planning
1. Review this roadmap with stakeholders
2. Recruit full-stack engineer (post job, start interviews)
3. Set up project management (Linear, Jira, or Notion)
4. Create Week 1-8 sprint plan with daily standup cadence

### Day 3-5: AI Integration Kickoff
5. Set up Gemini API credentials in development environment
6. Build basic document upload UI (drag-and-drop)
7. Write first extraction prompt for fund name + AUM
8. Test extraction on 5 sample fund documents

### Day 6-7: Database & Backend
9. Update schema for prospects, extraction_results tables
10. Run `npm run db:push --force` to sync schema
11. Build POST /api/prospects/extract endpoint
12. Test end-to-end: Upload → Extract → Save prospect

**Week 1 Goal:** Demo working AI extraction (even if basic) to validate technical approach.

---

## Conclusion

This roadmap transforms AlphaNAV from a strong foundation (15% complete) to a fully functional, exit-ready platform delivering 100 basis points operational alpha. The 48-week timeline is ambitious but achievable with focused execution and strategic hiring.

**Critical Success Factors:**
1. **Speed to MVP** (Week 8): Get to sellable product fast to validate market demand
2. **Customer Validation** (Week 16): Prove operational alpha with 8-12 paying customers
3. **Network Effects** (Week 24): Two-sided marketplace creates defensibility
4. **Enterprise Ready** (Week 36): API + integrations enable strategic partnerships
5. **Exit Preparation** (Week 48): SOC 2 + $4-5M ARR supports $40-60M valuation

The next 8 weeks (Phase 2A) are **critical** - focus 100% on AI extraction + underwriting dashboard to achieve MVP launch and first revenue.
