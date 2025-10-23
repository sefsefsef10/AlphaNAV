# AlphaNAV - Professional Testing Plan
## Quality Assurance Strategy for Production Launch

**Version**: 1.0  
**Date**: October 23, 2025  
**Status**: Ready for Execution  
**Target Go-Live**: TBD based on test results

---

## Executive Summary

This testing plan ensures AlphaNAV's 22 features (20 core + 2 AI) are production-ready through systematic validation across 3 user roles (Operations, Advisors, GPs). The plan employs a **risk-based approach** focusing on critical user workflows, data integrity, security, and AI accuracy.

**Test Strategy**: Role-driven manual testing with semi-automated API validation  
**Constraint**: OIDC authentication limits full automation  
**Timeline**: 3-5 days for complete validation  
**Go/No-Go Decision**: Based on acceptance criteria (see Section 9)

---

## 1. Test Objectives

### Primary Goals
✅ **Functional Validation** - All 22 features work as designed across 3 roles  
✅ **Data Integrity** - Correct data flow between 22 database tables and frontend  
✅ **Security Compliance** - Authentication, authorization, and data protection verified  
✅ **AI Accuracy** - Gemini extraction ≥85% accurate, breach risk variance <10%  
✅ **Performance** - System responsive under realistic load (50 concurrent users)  
✅ **User Experience** - Workflows intuitive, error handling graceful  

### Secondary Goals
- Regression coverage for future releases
- Documentation of known issues and workarounds
- Baseline performance metrics for monitoring

---

## 2. Test Scope

### In Scope
- All 3 user roles (Operations, Advisors, GP Users)
- All 22 features end-to-end
- API endpoints (authenticated and public)
- Database operations and data consistency
- File upload and document processing
- AI features (document extraction, breach analysis)
- Notification system
- Global search (Cmd+K)
- CSV exports
- Legal document generation
- Security and access control
- Performance under load
- Browser compatibility (Chrome, Firefox, Safari, Edge)

### Out of Scope
- Mobile app testing (no mobile app exists)
- Internationalization (English only)
- Third-party integrations (LinkedIn, CRM - not yet implemented)
- SOC 2 compliance audit (separate process)
- Penetration testing (requires security specialist)
- Load testing beyond 50 concurrent users

---

## 3. Test Environment

### Prerequisites
- **URL**: Production or staging environment with HTTPS enabled
- **Database**: PostgreSQL with test data seeded
- **Auth**: Replit Auth (OIDC) configured with test accounts
- **Secrets**: GEMINI_API_KEY, SESSION_SECRET, DATABASE_URL configured
- **Test Accounts**: 
  - 3 Operations users
  - 3 Advisor users  
  - 3 GP users
- **Test Data**:
  - 20 prospects (various stages)
  - 15 facilities (5 active, 5 pending, 5 closed)
  - 30 covenants (mix of compliant, warning, breach)
  - 10 advisor deals (various statuses)
  - 50 notifications
  - 20 uploaded documents

### Browser Setup
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Clear cache/cookies between test runs
- Disable browser extensions

---

## 4. High-Risk Areas (Priority 0)

These areas have the highest business impact and must pass before launch:

### 4.1 Authentication & Session Management
**Risk**: Users cannot access the system  
**Test Focus**:
- Login via Replit Auth succeeds
- Profile selection routes to correct dashboard
- Session persists after page refresh
- Logout clears session completely
- Unauthorized API calls return 401/403

### 4.2 Data Integrity
**Risk**: Data loss or corruption  
**Test Focus**:
- All CRUD operations persist correctly
- No orphaned records (referential integrity)
- React Query cache syncs with database
- Concurrent updates handled correctly
- Transaction rollback on errors

### 4.3 Gemini AI Accuracy
**Risk**: Incorrect AI outputs lead to bad decisions  
**Test Focus**:
- Document extraction accuracy ≥85% vs manual review
- Breach risk predictions within 10% of analyst baseline
- Confidence scores correlate with accuracy
- Graceful fallback when AI fails
- No hallucinations or fabricated data

### 4.4 Covenant Monitoring
**Risk**: Missed breaches cause financial loss  
**Test Focus**:
- Status transitions (compliant → warning → breach) accurate
- Notifications triggered at correct thresholds
- Warning alerts at 90% of breach threshold
- Breach notifications created (only if facility has owner)
- AI breach analysis aligns with covenant status

### 4.5 Legal Document Generation
**Risk**: Incorrect legal terms create liability  
**Test Focus**:
- All conditional sections appear/disappear correctly
- Facility data populated accurately (no placeholders in production)
- Generated documents match configuration
- Downloaded files have correct format (.md/.html/.pdf)
- Audit trail records generation (document ID, timestamp, user)

---

## 5. Test Scenarios by Role

### 5.1 Operations Team Workflows (Priority 0)

#### Scenario 1: Prospect Intake → Underwriting
**Objective**: Operations creates prospect, conducts underwriting, creates facility

**Steps**:
1. Login as Operations user
2. Navigate to Deal Pipeline
3. Create new prospect (fund name, contact info, AUM)
4. Update prospect status to "Underwriting"
5. Add underwriting notes
6. Create facility from prospect
7. Set covenant thresholds (LTV, minimum NAV, diversification)
8. Verify facility appears in portfolio

**Pass Criteria**:
- Prospect saved with all fields
- Facility created with correct data inheritance
- Covenants linked to facility
- Notification sent (if applicable)
- CSV export includes new prospect

**Fail Criteria**:
- Data not persisted
- Referential integrity broken
- Missing required fields accepted
- Error without rollback

---

#### Scenario 2: Covenant Monitoring Cycle
**Objective**: Operations runs quarterly covenant check

**Steps**:
1. Login as Operations user
2. Navigate to Monitoring page
3. Select facility with covenants
4. Update current values (NAV, LTV, portfolio count)
5. Click "Check Covenants" button
6. Review covenant status updates
7. Click "Analyze Breach Risk" (AI)
8. Review AI risk assessment
9. Check notifications created for breaches

**Pass Criteria**:
- Covenant statuses correct (compliant/warning/breach)
- Warning triggered at 90% threshold
- Breach notification created (if owner exists)
- AI analysis: breach probability 0-100%, risk level, recommendations
- AI time-to-breach estimate logical
- Status persists after page refresh

**Fail Criteria**:
- Incorrect status calculation
- Missing breach notifications
- AI analysis nonsensical
- Zero-value current values skipped
- Duplicate notifications

**Test Data**:
- Facility 1: All covenants compliant (LTV 8%, NAV $200M)
- Facility 2: LTV at 92% of breach (warning)
- Facility 3: LTV breached (16% when max is 15%)

---

#### Scenario 3: Legal Document Generation
**Objective**: Operations generates loan agreement, term sheet, compliance report

**Steps**:
1. Login as Operations user
2. Navigate to Legal Documents page
3. Generate Loan Agreement for facility
   - Configure: OID 2%, PIK option, amortization, prepayment penalty, security interest
4. Download and verify content
5. Generate Term Sheet for same facility
   - Configure: Same settings
6. Generate Compliance Report (no configuration)
7. Download all 3 documents
8. Verify documents saved in database

**Pass Criteria**:
- All 3 documents generate successfully
- Loan agreement includes all configured sections
- Term sheet shows fee table correctly
- Compliance report has standardized format
- Facility data populated (no "TBD" placeholders)
- Files download with correct extensions (.md, .html, or .pdf)
- Documents persist in database (GET /api/generated-documents)

**Fail Criteria**:
- Missing conditional sections
- Incorrect facility data (wrong fund name, amounts)
- File extension mismatch
- Compliance report shows config form (should be hidden)
- Documents not saved to database

---

#### Scenario 4: Portfolio Analytics
**Objective**: Operations reviews portfolio metrics

**Steps**:
1. Login as Operations user
2. Navigate to Portfolio page
3. Review metrics cards (total AUM, facilities, active facilities, avg LTV)
4. Check LTV distribution chart
5. Check facility status breakdown
6. Verify data matches database query
7. Export portfolio to CSV

**Pass Criteria**:
- All metrics display correct values
- Charts render without errors
- CSV export contains all facilities
- Performance <2 seconds for 50 facilities

**Fail Criteria**:
- Metrics incorrect vs database
- Chart rendering errors
- Missing facilities in export
- Slow performance (>3 seconds)

---

### 5.2 Advisor Workflows (Priority 1)

#### Scenario 5: Advisor RFP Submission
**Objective**: Advisor submits anonymized deal to lenders

**Steps**:
1. Login as Advisor user
2. Navigate to Advisor Dashboard
3. Create new deal
   - GP fund name: "Test Growth Fund III"
   - Desired amount: $50M
   - NAV: $300M
   - LTV requested: 12%
   - Anonymize: Enable
4. Invite 3 lenders
5. Submit deal
6. Verify deal appears in Operations pipeline
7. Verify anonymization (fund name hidden)
8. Check commission tracking

**Pass Criteria**:
- Deal created successfully
- Lender invitations sent
- Deal visible to Operations (as prospect)
- Fund name anonymized in ops view
- Commission rate tracked (50-75 bps)
- Deal shows in advisor's active deals

**Fail Criteria**:
- Deal not created
- Anonymization broken (fund name visible)
- Lender invitations not sent
- Missing from advisor dashboard

---

#### Scenario 6: Term Sheet Comparison
**Objective**: Advisor compares term sheets from multiple lenders

**Steps**:
1. Login as Advisor user (with existing deal)
2. Navigate to deal with 3 term sheets submitted
3. Open term sheet comparison view
4. Compare: interest rates, fees, LTV, terms
5. Select winning term sheet
6. Mark deal as "Won"
7. Verify commission calculated correctly

**Pass Criteria**:
- All term sheets display side-by-side
- Key metrics highlighted
- Selection persists
- Commission = (Deal Amount) × (Commission Rate)
- Deal status updates
- Notification sent to Operations

**Fail Criteria**:
- Term sheets not loading
- Incorrect commission calculation
- Status not updating
- Missing term sheet data

---

### 5.3 GP User Workflows (Priority 1)

#### Scenario 7: GP Self-Onboarding
**Objective**: GP completes 4-step onboarding with document upload

**Steps**:
1. Navigate to /onboarding (no login required)
2. Step 1: Enter fund info (name, contact, phone)
3. Step 2: Upload 2 documents (PPM, fund agreement PDFs)
4. Wait for processing (should complete quickly)
5. Step 3: Click "Analyze Documents" button
6. Verify AI extracted data:
   - Fund name, vintage, AUM, portfolio count, sectors, key personnel
   - Eligibility assessment, confidence score
7. Review and edit extracted data if needed
8. Step 4: Confirm and submit
9. Verify session saved in database

**Pass Criteria**:
- All 4 steps complete smoothly
- Documents upload successfully (<10MB, PDF/Word/Excel)
- AI extraction completes in <10 seconds
- Extracted data ≥70% confidence OR manual override works
- Eligibility assessment matches criteria logic
- Session persists with status "completed"
- If AI fails, fallback to manual entry works

**Fail Criteria**:
- Upload fails for valid files
- AI extraction hangs or errors without fallback
- Extracted data nonsensical (hallucination)
- Eligibility assessment incorrect
- Session not saved

**Test Data**:
- Document 1: PPM with fund name "Acme Growth Partners II", vintage 2019, AUM $250M, 8 portfolio companies
- Document 2: Fund agreement with key personnel, sectors (software, healthcare, fintech)

---

#### Scenario 8: GP Draw Request
**Objective**: GP submits draw request on active facility

**Steps**:
1. Login as GP user
2. Navigate to GP Dashboard
3. View active facility
4. Click "Request Draw"
5. Enter amount ($5M), purpose, requested date
6. Submit request
7. Verify request appears in facility detail
8. Verify Operations receives notification
9. Check request status updates when Operations approves

**Pass Criteria**:
- Draw request created
- Amount validated (≤ available credit)
- Notification sent to Operations
- Request visible to both GP and Operations
- Status updates (pending → approved/rejected)

**Fail Criteria**:
- Request fails silently
- No notification sent
- Amount exceeds limit (should reject)
- Status not updating

---

#### Scenario 9: GP Document Vault
**Objective**: GP uploads and downloads facility documents

**Steps**:
1. Login as GP user
2. Navigate to facility detail
3. Upload document (compliance report PDF)
4. Verify document appears in vault
5. Download document
6. Delete document
7. Verify deletion

**Pass Criteria**:
- Upload succeeds (<10MB)
- Document listed with metadata (name, size, date)
- Download works correctly
- Delete removes from list
- Operations can also view documents

**Fail Criteria**:
- Upload fails for valid files
- Downloaded file corrupted
- Delete doesn't remove
- Unauthorized access (GP sees other GPs' docs)

---

#### Scenario 10: GP Messaging
**Objective**: GP sends message to Operations about facility

**Steps**:
1. Login as GP user
2. Navigate to facility messages
3. Send message: "When is next payment due?"
4. Logout
5. Login as Operations user
6. Check notifications (should have message alert)
7. Navigate to facility messages
8. Reply to GP message
9. Logout, login as GP
10. Verify reply received and notification shows

**Pass Criteria**:
- Message sent successfully
- Notification created for recipient
- Reply thread maintained
- Unread count updates
- Read status updates when viewed

**Fail Criteria**:
- Message not sent
- No notification created
- Thread broken
- Read status incorrect

---

## 6. Integration Testing (Priority 1)

### 6.1 Notification System Integration

**Test Cases**:
1. **Prospect eligibility** → Creates "info" notification for Operations
2. **Deal status change** → Notifies advisor and Operations
3. **Term sheet received** → Notifies advisor
4. **Covenant breach** → Creates "error" notification for facility owner
5. **Draw request submitted** → Notifies Operations
6. **Message sent** → Creates notification for recipient

**Validation**:
- Notifications persist in database
- Real-time updates via polling
- Mark read/unread works
- Delete removes notification
- Priority coding correct (info/warning/error)

---

### 6.2 CSV Export Validation

**Test Cases**:
1. Export prospects → Verify all columns, data accuracy, filename timestamp
2. Export deals → Verify advisor attribution, commission data
3. Export facilities → Verify covenant status, financial metrics
4. Export with filters → Verify only filtered data exported
5. Empty dataset → Graceful handling

**Validation**:
- CSV format valid (parseable)
- All expected columns present
- Data matches database query
- Special characters escaped
- Filename includes timestamp

---

### 6.3 React Query Cache Sync

**Test Cases**:
1. Create facility → Verify appears in list without refresh
2. Update covenant → Verify status updates in monitoring view
3. Delete notification → Verify removed from bell dropdown
4. Concurrent updates → Verify optimistic UI + server reconciliation

**Validation**:
- Cache invalidation on mutations
- No stale data displayed
- Loading states shown during fetch
- Error states handled gracefully

---

## 7. Security Testing (Priority 0)

### 7.1 Authentication & Authorization

**Test Cases**:

#### AC-1: Unauthorized API Access
**Steps**:
1. Logout (or use private browser)
2. Attempt API calls to protected endpoints:
   - GET /api/notifications
   - GET /api/facilities
   - POST /api/prospects
   - DELETE /api/covenants/:id
3. Verify all return 401 Unauthorized

**Pass**: All protected endpoints return 401  
**Fail**: Any endpoint accessible without auth

---

#### AC-2: Cross-Role Authorization
**Steps**:
1. Login as GP user
2. Attempt to access Operations-only routes:
   - /deal-pipeline
   - /monitoring
   - /portfolio
3. Verify redirect or 403 Forbidden
4. Repeat for Advisor accessing GP routes

**Pass**: Unauthorized routes blocked  
**Fail**: Role leakage (GP sees Operations data)

---

#### AC-3: Session Security
**Steps**:
1. Login and capture session cookie
2. Verify cookie has Secure and HttpOnly flags
3. Verify cookie expires on logout
4. Test session timeout (if implemented)
5. Attempt session fixation attack

**Pass**: Secure cookie flags, proper expiration  
**Fail**: Cookie insecure or persistent after logout

---

### 7.2 File Upload Security

**Test Cases**:

#### FU-1: File Type Validation
**Upload Test Files**:
- ✅ Valid: .pdf, .doc, .docx, .xls, .xlsx
- ❌ Invalid: .exe, .sh, .js, .html, .php

**Pass**: Invalid files rejected with clear error  
**Fail**: Executable files accepted

---

#### FU-2: File Size Validation
**Upload Test Files**:
- ✅ 1MB file (valid)
- ✅ 9.5MB file (valid)
- ❌ 11MB file (exceeds 10MB limit)

**Pass**: Large files rejected with error  
**Fail**: Oversized files accepted

---

#### FU-3: File Path Traversal
**Steps**:
1. Attempt upload with filename: `../../etc/passwd`
2. Verify filename sanitized
3. Check file stored in /tmp/uploads only

**Pass**: Path traversal blocked  
**Fail**: File stored in arbitrary location

---

### 7.3 Input Validation & XSS

**Test Cases**:

#### IV-1: SQL Injection
**Inputs**:
- Prospect name: `'; DROP TABLE prospects; --`
- Fund name: `' OR '1'='1`
- Search query: `<script>alert('XSS')</script>`

**Steps**: Submit these as form inputs  
**Pass**: Inputs escaped, no SQL execution  
**Fail**: SQL error or data corruption

---

#### IV-2: XSS Prevention
**Inputs**:
- Message content: `<script>alert('XSS')</script>`
- Fund name: `<img src=x onerror=alert('XSS')>`

**Steps**: Submit and view rendered output  
**Pass**: HTML escaped, no script execution  
**Fail**: Alert popup appears

---

## 8. Performance Testing (Priority 2)

### 8.1 Load Testing

**Scenario**: 50 concurrent users accessing system

**Test Setup**:
- Use Apache JMeter or similar tool
- Ramp up: 0 → 50 users over 1 minute
- Sustain: 50 users for 5 minutes
- Measure: Response times, error rate, throughput

**SLO Targets**:
- **P50 response time**: <500ms
- **P95 response time**: <2s
- **P99 response time**: <5s
- **Error rate**: <1%
- **Successful requests**: >99%

**API Endpoints to Test**:
- GET /api/prospects (with 1000 records)
- GET /api/facilities (with 500 records)
- POST /api/covenants/:facilityId/check-covenants
- POST /api/onboarding/sessions/:id/analyze (AI)
- POST /api/facilities/:facilityId/analyze-breach-risk (AI)
- GET /api/notifications

**Pass Criteria**:
- All SLOs met under load
- No 500 errors
- No database connection exhaustion
- Memory usage stable (<2GB)

**Fail Criteria**:
- Error rate >1%
- P95 >3s
- Database timeout errors
- Memory leak detected

---

### 8.2 AI Endpoint Performance

**Test Cases**:

#### AI-1: Document Extraction Latency
**Steps**:
1. Upload 5 documents (1MB PDFs)
2. Call analyze endpoint
3. Measure time to completion

**Pass**: <10s per document, <30s total  
**Fail**: >15s per document or timeout

---

#### AI-2: Breach Analysis Latency
**Steps**:
1. Call analyze-breach-risk for facility with 10 covenants
2. Measure response time
3. Repeat 10 times, calculate P95

**Pass**: P95 <6s  
**Fail**: P95 >10s or timeout

---

#### AI-3: Concurrent AI Requests
**Steps**:
1. Submit 5 document analysis requests simultaneously
2. Submit 5 breach analysis requests simultaneously
3. Verify all complete without errors

**Pass**: All requests succeed, no rate limiting  
**Fail**: Requests fail or queue indefinitely

---

### 8.3 Frontend Performance

**Test Cases**:

#### FE-1: Initial Page Load
**Metrics**: Time to Interactive (TTI), First Contentful Paint (FCP)  
**Tool**: Lighthouse audit

**Pass**: 
- FCP <1.5s
- TTI <3s
- Performance score >80

**Fail**: TTI >5s or score <60

---

#### FE-2: Large Data Tables
**Steps**:
1. Navigate to Deal Pipeline with 1000 prospects
2. Measure render time
3. Test scrolling performance
4. Test filtering/searching

**Pass**: Renders <2s, smooth scrolling (60fps)  
**Fail**: Janky scrolling or >3s render

---

## 9. AI Validation (Priority 0)

### 9.1 Document Extraction Accuracy

**Gold Standard Dataset**: 20 manually reviewed fund documents

**Test Protocol**:
1. Upload each document to GP onboarding
2. Run AI extraction
3. Compare AI output vs manual review
4. Calculate accuracy per field:
   - Fund name: Exact match
   - Vintage: ±1 year acceptable
   - AUM: ±10% acceptable
   - Portfolio count: ±1 acceptable
   - Sectors: 80% overlap acceptable
   - Key personnel: 70% overlap acceptable
   - Borrowing permitted: Boolean exact match

**Acceptance Criteria**:
- **Overall accuracy**: ≥85%
- **Confidence score correlation**: High confidence (>80) = >90% accuracy
- **Hallucination rate**: <5% (fabricated data not in document)
- **Eligibility assessment**: 100% correct when all fields accurate

**Fail Conditions**:
- Accuracy <80%
- Hallucinations >10%
- Eligibility logic broken

---

### 9.2 Breach Risk Analysis Validation

**Baseline Dataset**: 30 facilities with analyst-provided breach assessments

**Test Protocol**:
1. Run AI breach analysis for each facility
2. Compare AI output vs analyst assessment:
   - Breach probability (0-100%)
   - Risk level (low/medium/high/critical)
   - Key risk factors
   - Time to breach estimate

**Acceptance Criteria**:
- **Probability variance**: <10% vs analyst
- **Risk level agreement**: ≥90%
- **Risk factors**: ≥70% overlap with analyst notes
- **Time to breach**: Within same quarter as analyst estimate

**Fail Conditions**:
- Probability variance >15%
- Risk level agreement <80%
- Nonsensical recommendations

---

### 9.3 AI Fallback Testing

**Test Cases**:

#### AI-FB-1: Gemini API Unavailable
**Steps**:
1. Temporarily disable GEMINI_API_KEY
2. Upload document and analyze
3. Verify fallback to manual entry
4. Verify error message clear

**Pass**: Manual entry form shown, no crash  
**Fail**: Application error or hang

---

#### AI-FB-2: Invalid API Response
**Steps**:
1. Mock Gemini to return malformed JSON
2. Trigger analysis
3. Verify graceful error handling

**Pass**: Fallback to manual entry, error logged  
**Fail**: Unhandled exception

---

#### AI-FB-3: Low Confidence Output
**Steps**:
1. Upload document with minimal fund info
2. Run analysis
3. Verify low confidence score (<30)
4. Verify user prompted to review manually

**Pass**: Low confidence flagged, manual review requested  
**Fail**: Low confidence treated as accurate

---

## 10. Browser Compatibility (Priority 2)

**Browsers to Test**:
- Chrome (latest, Windows/Mac)
- Firefox (latest, Windows/Mac)
- Safari (latest, Mac only)
- Edge (latest, Windows)

**Test Scenarios** (across all browsers):
1. Login and profile selection
2. Navigate all main pages
3. Create prospect, facility, covenant
4. Upload document
5. Generate legal document
6. Use global search (Cmd+K / Ctrl+K)
7. Mark notification read
8. Send message
9. Export CSV
10. Responsive behavior at 1920x1080, 1366x768, 1024x768

**Pass Criteria**:
- All features functional
- No visual regressions
- Performance acceptable

**Fail Criteria**:
- Feature broken in any browser
- Major visual issues
- JavaScript errors in console

---

## 11. Regression Testing

### Regression Test Suite (30 minutes)

**When to Run**: Before each production release

**Smoke Tests** (Must pass):
1. Login successful for all 3 roles
2. Profile selection routes correctly
3. Create prospect
4. Create facility
5. Create covenant and check status
6. Upload document
7. Run AI document extraction
8. Generate legal document
9. Send notification
10. Global search returns results

**Critical Path Tests**:
- Covenant monitoring cycle (end-to-end)
- GP onboarding (end-to-end)
- Advisor deal submission (end-to-end)
- Legal document generation (all 3 types)

**Regression Strategy**:
- Maintain snapshot exports of calculated fields
- Compare new results vs baselines
- Flag variances >1% for review
- Update baselines after verified fixes

---

## 12. Acceptance Criteria for Go-Live

### Mandatory (Must Pass)

✅ **Functional**:
- [ ] All Priority 0 scenarios pass (Sections 4, 5.1)
- [ ] All Priority 1 scenarios pass (Sections 5.2, 5.3, 6)
- [ ] Zero P0 (critical) bugs
- [ ] Zero P1 (high) bugs blocking workflows

✅ **Security**:
- [ ] All auth/authz tests pass (Section 7.1)
- [ ] File upload security validated (Section 7.2)
- [ ] No XSS/SQL injection vulnerabilities (Section 7.3)
- [ ] Session security verified

✅ **AI Quality**:
- [ ] Document extraction accuracy ≥85% (Section 9.1)
- [ ] Breach risk variance <10% (Section 9.2)
- [ ] Fallback mechanisms working (Section 9.3)

✅ **Performance**:
- [ ] Load test SLOs met: P95 <3s, error rate <1% (Section 8.1)
- [ ] AI endpoints: extraction <10s, breach analysis <6s (Section 8.2)

✅ **Data Integrity**:
- [ ] All CRUD operations persist correctly
- [ ] No orphaned records
- [ ] React Query cache syncs

✅ **Documentation**:
- [ ] Test execution evidence captured
- [ ] Known issues documented
- [ ] Rollback plan documented

### Recommended (Should Pass)

⚠️ **Browser Compatibility**:
- [ ] Chrome, Firefox, Safari, Edge validated (Section 10)

⚠️ **Regression**:
- [ ] Smoke suite passes twice consecutively (Section 11)

⚠️ **Legal/Compliance**:
- [ ] Legal docs reviewed by compliance officer
- [ ] Privacy policy and terms of service published

### Optional (Nice to Have)

💡 **Advanced**:
- [ ] Load testing with 100+ concurrent users
- [ ] External penetration test
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance monitoring dashboard live

---

## 13. Test Execution Plan

### Phase 1: Functional Validation (Days 1-2)

**Day 1 Morning**: Operations workflows
- Prospect intake → underwriting (Scenario 1)
- Covenant monitoring (Scenario 2)
- Legal document generation (Scenario 3)
- Portfolio analytics (Scenario 4)

**Day 1 Afternoon**: Advisor & GP workflows
- Advisor RFP submission (Scenario 5)
- Term sheet comparison (Scenario 6)
- GP onboarding (Scenario 7)
- GP draw request (Scenario 8)

**Day 2 Morning**: Integration testing
- Notification system (Section 6.1)
- CSV exports (Section 6.2)
- React Query cache (Section 6.3)

**Day 2 Afternoon**: GP workflows continued
- GP document vault (Scenario 9)
- GP messaging (Scenario 10)

---

### Phase 2: Security & Performance (Day 3)

**Day 3 Morning**: Security testing
- Authentication & authorization (Section 7.1)
- File upload security (Section 7.2)
- Input validation & XSS (Section 7.3)

**Day 3 Afternoon**: Performance testing
- Load testing 50 concurrent users (Section 8.1)
- AI endpoint performance (Section 8.2)
- Frontend performance (Section 8.3)

---

### Phase 3: AI Validation (Day 4)

**Day 4 Morning**: Document extraction
- Run 20-document gold standard test (Section 9.1)
- Calculate accuracy metrics
- Review low-confidence cases

**Day 4 Afternoon**: Breach risk analysis
- Run 30-facility baseline test (Section 9.2)
- Compare vs analyst assessments
- Test fallback mechanisms (Section 9.3)

---

### Phase 4: Final Validation (Day 5)

**Day 5 Morning**: Browser compatibility
- Test all 4 browsers (Section 10)
- Document any visual issues

**Day 5 Afternoon**: Regression & sign-off
- Run full regression suite (Section 11)
- Verify all acceptance criteria (Section 12)
- Prepare test summary report
- Go/No-Go decision meeting

---

## 14. Defect Management

### Defect Severity Levels

**P0 - Critical** (Blocker)
- System crash or data loss
- Security vulnerability
- Authentication broken
- Cannot complete core workflow
- **Action**: Fix immediately, block release

**P1 - High** (Major)
- Feature broken for some users/scenarios
- Incorrect data/calculations
- Performance degradation >50%
- **Action**: Fix before release

**P2 - Medium** (Minor)
- Cosmetic issues
- Workaround available
- Low-impact edge case
- **Action**: Can defer to next release

**P3 - Low** (Trivial)
- Typos, minor UI polish
- Enhancement request
- **Action**: Backlog for future

---

### Defect Triage Process

1. **Log defect** in tracking system with:
   - Title (concise description)
   - Severity (P0/P1/P2/P3)
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/videos
   - Environment (browser, OS, URL)
   - Test data used

2. **Assign priority** based on:
   - Impact (# users affected)
   - Frequency (how often it occurs)
   - Workaround availability

3. **Triage meeting** (daily during testing):
   - Review new defects
   - Assign severity
   - Assign owner
   - Set target resolution date

4. **Retest after fix**:
   - Verify fix in same environment
   - Check for regressions
   - Close if verified, reopen if still broken

---

## 15. Test Deliverables

### Test Summary Report

**Contents**:
- Executive summary (pass/fail, key metrics)
- Test execution overview (# scenarios, pass rate)
- Defect summary (by severity)
- Risk assessment (remaining issues)
- Go/No-Go recommendation
- Sign-off from QA lead, product owner, engineering lead

### Test Evidence Package

**Artifacts**:
- Completed test case checklist (with pass/fail marks)
- Screenshots of critical workflows
- Video recordings of complex scenarios
- Defect logs with steps to reproduce
- Performance test results (JMeter reports)
- AI validation spreadsheet (20 documents, 30 facilities)
- Browser compatibility matrix
- Test data used (database snapshot)

### Known Issues Log

**Format**:
| ID | Severity | Description | Workaround | Target Release |
|----|----------|-------------|------------|----------------|
| BUG-001 | P2 | Safari: CSV download filename truncated | Use Chrome | 1.1 |
| BUG-002 | P3 | Dark mode: Card border too subtle | None | 1.2 |

---

## 16. Risks & Mitigations

### Risk 1: OIDC Auth Blocks Automation
**Impact**: High (manual testing required)  
**Mitigation**: 
- Use mock token harness in staging environment
- Leverage API testing tools (Postman) for backend validation
- Create detailed manual test scripts with screenshots

### Risk 2: AI Output Non-Deterministic
**Impact**: Medium (testing results vary)  
**Mitigation**:
- Use fixed test documents
- Run each test 3 times, calculate average accuracy
- Set confidence thresholds (low confidence = flag for manual review)

### Risk 3: Limited Test Data Volume
**Impact**: Medium (may miss edge cases)  
**Mitigation**:
- Use database seeding script to generate realistic volume
- Test with 1000+ prospects, 500+ facilities
- Include edge cases: $0 facilities, negative covenants, special characters

### Risk 4: Performance Testing Without Production Load
**Impact**: Low (may not reflect real usage)  
**Mitigation**:
- Extrapolate from 50 concurrent user test
- Plan for post-launch monitoring and optimization
- Set up performance alerts (New Relic, Datadog)

### Risk 5: Security Testing Incomplete
**Impact**: High (potential vulnerabilities)  
**Mitigation**:
- Engage external security consultant for penetration test
- Follow OWASP Top 10 checklist
- Plan for SOC 2 Type 1 audit within 6 months

---

## 17. Tools & Resources

### Testing Tools

**Manual Testing**:
- Browser DevTools (Chrome, Firefox, Safari, Edge)
- MANUAL_TESTING_GUIDE.md (52 test cases reference)
- Spreadsheet for tracking test execution

**API Testing**:
- Postman or Insomnia (for authenticated API calls)
- cURL (for quick endpoint validation)

**Performance Testing**:
- Apache JMeter (load testing)
- Lighthouse (frontend performance)
- Chrome DevTools Performance tab

**AI Testing**:
- Python script for batch document processing
- Excel/Sheets for accuracy calculation

**Security Testing**:
- OWASP ZAP (vulnerability scanning)
- Burp Suite (intercepting proxy)

### Test Data Preparation

**Seeding Script** (to create):
```bash
npm run db:seed-test-data
```

**Should generate**:
- 100 users (33 Operations, 33 Advisors, 34 GPs)
- 50 prospects (various stages)
- 30 facilities (10 active, 10 pending, 10 closed)
- 60 covenants (20 compliant, 20 warning, 20 breach)
- 20 advisor deals
- 100 notifications
- 50 uploaded documents

---

## 18. Post-Launch Monitoring

### Metrics to Track (First 30 Days)

**Application Health**:
- Uptime (target: 99.9%)
- Error rate (target: <0.5%)
- P95 response time (target: <2s)
- Database connection pool utilization (target: <70%)

**Feature Adoption**:
- Daily active users (by role)
- Feature usage heatmap
- Most-used workflows
- Feature abandonment rate

**AI Performance**:
- Document extraction accuracy (ongoing validation)
- AI endpoint latency (P50, P95, P99)
- AI fallback rate (target: <5%)
- User feedback on AI suggestions

**User Feedback**:
- Support tickets (by category)
- Bug reports
- Feature requests
- NPS score

---

## 19. Success Criteria

### Testing Success
- ✅ All Priority 0 & 1 scenarios pass
- ✅ Zero P0/P1 defects
- ✅ Security validated
- ✅ AI accuracy ≥85%
- ✅ Performance SLOs met
- ✅ Test evidence captured

### Production Success (30 days post-launch)
- ✅ Uptime ≥99.5%
- ✅ Error rate <1%
- ✅ No critical bugs reported
- ✅ User satisfaction (NPS) >40
- ✅ First customer onboarded successfully

---

## 20. Sign-Off

### Approvers

**QA Lead**: _________________ Date: _______  
**Product Owner**: _________________ Date: _______  
**Engineering Lead**: _________________ Date: _______  
**Security Lead**: _________________ Date: _______  

### Go/No-Go Decision

**Launch Approved**: ☐ Yes ☐ No ☐ Conditional

**Conditions** (if conditional):
- [ ] Fix P1 defects: [list defects]
- [ ] Complete security review
- [ ] Validate AI accuracy on additional dataset

**Decision Maker**: _________________  
**Date**: _______  

---

## Appendix A: Quick Reference Checklist

**Priority 0 - Must Pass Before Launch**:
- [ ] Authentication works (login, profile selection, session persistence)
- [ ] Operations prospect → facility creation
- [ ] Covenant monitoring with AI breach analysis
- [ ] Legal document generation (3 types)
- [ ] GP onboarding with AI document extraction
- [ ] Security: auth/authz, file upload, XSS/SQLi
- [ ] Performance: 50 concurrent users, AI endpoints <10s
- [ ] AI accuracy: extraction ≥85%, breach variance <10%
- [ ] Data integrity: CRUD operations, referential integrity

**Priority 1 - Should Pass**:
- [ ] Advisor RFP submission and term sheet comparison
- [ ] GP draw requests and messaging
- [ ] Notification system integration
- [ ] CSV exports
- [ ] React Query cache sync

**Priority 2 - Nice to Have**:
- [ ] Browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Frontend performance (Lighthouse >80)
- [ ] Regression suite passes

---

*End of Testing Plan*  
**Version**: 1.0  
**Prepared by**: Professional QA Team  
**Reviewed by**: Product, Engineering, Security Leads
