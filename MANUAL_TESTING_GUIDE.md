# AlphaNAV - Manual Testing Guide

## ✅ Automated Testing Results

**Test 1: Authentication & Profile Selection - PASSED**
- ✅ Profile selection page displays correctly with 3 role cards
- ✅ OIDC login flow works properly
- ✅ Operations role routes to `/deal-pipeline`
- ✅ Advisor role routes to `/advisor`
- ✅ GP role routes to `/onboarding`
- ✅ Change Profile button works correctly
- ✅ Session persistence after page refresh
- ✅ Header components (notifications, help, theme toggle) render correctly

---

## 🧪 Manual Testing Workflows

### Test 2: Operations Team - NAV IQ Capital

**Login**: Select "NAV IQ Capital Operations" from profile selection

#### A. Prospect Management (`/deal-pipeline`)
1. **Create New Prospect**
   - [ ] Click "New Deal" button
   - [ ] Fill in fund details:
     - Fund Name: "Test Growth Fund"
     - GP Name: "Test Partners LLC"
     - AUM: $250M
     - Strategy: "Growth Equity"
     - Use Case: "Growth"
     - Requested Amount: $25M
     - Contact info
   - [ ] Click "Create Prospect"
   - [ ] Verify prospect appears in the pipeline table
   - [ ] Verify status shows "new"

2. **Prospect Details & Actions**
   - [ ] Click on prospect row to view details
   - [ ] Verify all entered data displays correctly
   - [ ] Test status updates (new → qualified → underwriting)
   - [ ] Add notes to the prospect
   - [ ] Export prospects to CSV using export button

#### B. Facility Underwriting (`/underwriting`)
3. **Create New Facility**
   - [ ] Navigate to Underwriting page
   - [ ] Click "New Facility" button
   - [ ] Fill in facility details:
     - Fund Name: (select from dropdown or enter new)
     - Principal Amount: $25M
     - Interest Rate: 8.50% (850 bps)
     - LTV Ratio: 12%
     - Maturity Date: 36 months from now
     - Payment Schedule: Quarterly
   - [ ] Click "Create Facility"
   - [ ] Verify success toast notification
   - [ ] Verify facility appears in facilities table

#### C. Covenant Monitoring (`/monitoring`)
4. **Create & Monitor Covenants**
   - [ ] Navigate to Monitoring page
   - [ ] Click on a facility row
   - [ ] Click "Add Covenant" button
   - [ ] Create LTV covenant:
     - Type: "LTV Covenant"
     - Operator: "Less Than or Equal"
     - Threshold: 15%
     - Current Value: 12%
     - Frequency: Quarterly
   - [ ] Verify covenant shows "Compliant" status (green badge)
   - [ ] Update current value to 14.5%
   - [ ] Run covenant check
   - [ ] Verify status changes to "Warning" (yellow badge - 90%+ of threshold)
   - [ ] Update current value to 16%
   - [ ] Run covenant check
   - [ ] Verify status changes to "Breach" (red badge)
   - [ ] Check notifications for breach alert

5. **Covenant Types Testing**
   - [ ] Create Minimum NAV covenant (greater_than)
   - [ ] Create Diversification covenant
   - [ ] Create Liquidity covenant
   - [ ] Verify all covenants display correctly
   - [ ] Test bulk covenant check (check all button)

#### D. Portfolio Analytics (`/portfolio`)
6. **Portfolio Overview**
   - [ ] Navigate to Portfolio page
   - [ ] Verify all active facilities display
   - [ ] Check portfolio metrics:
     - [ ] Total Outstanding Balance
     - [ ] Weighted Average LTV
     - [ ] Number of Active Facilities
   - [ ] Verify portfolio composition chart
   - [ ] Test date range filters
   - [ ] Export portfolio data to CSV

#### E. Legal Document Generation (`/legal`)
7. **Generate Loan Agreement**
   - [ ] Navigate to Legal page
   - [ ] Select document type: "Loan Agreement"
   - [ ] Configure terms:
     - Interest Type: Fixed
     - Term Length: 36 months
     - Include OID: Yes
     - Include PIK: No
     - Covenant: Debt/EBITDA ratio
     - Amortization: Yes
     - Prepayment Penalty: Yes
     - Security Interest: Yes
   - [ ] Click "Generate Loan Agreement"
   - [ ] Verify document downloads as `.md` file
   - [ ] Open document and verify:
     - [ ] All 7 articles present
     - [ ] OID section included
     - [ ] Covenant section included
     - [ ] Amortization schedule section included

8. **Generate Term Sheet**
   - [ ] Select document type: "Term Sheet"
   - [ ] Configure terms (use different config than loan agreement)
   - [ ] Click "Generate Term Sheet"
   - [ ] Verify downloads as `.md` file
   - [ ] Verify table format with key terms

9. **Generate Compliance Report**
   - [ ] Select document type: "Compliance Report"
   - [ ] Verify configuration options are hidden
   - [ ] Verify informational card displays
   - [ ] Click "Generate Compliance Report"
   - [ ] Verify downloads with correct extension
   - [ ] Verify report includes:
     - [ ] Covenant compliance data
     - [ ] NAV analysis
     - [ ] Portfolio composition
     - [ ] Payment history

10. **Test Reset Configuration**
    - [ ] Select "Loan Agreement"
    - [ ] Change multiple configuration options
    - [ ] Click "Reset Configuration"
    - [ ] Verify all options reset to defaults
    - [ ] Switch to "Compliance Report"
    - [ ] Verify "Reset Configuration" button is hidden

#### F. Reports & Analytics (`/reports`)
11. **Reporting Dashboard**
    - [ ] Navigate to Reports page
    - [ ] Generate quarterly performance report
    - [ ] Export data in multiple formats
    - [ ] Verify charts and visualizations load
    - [ ] Test date range filtering

---

### Test 3: Advisor/Placement Agent Workflows

**Login**: Select "Advisor/Placement Agent" from profile selection

#### A. Advisor Dashboard (`/advisor`)
1. **Dashboard Overview**
   - [ ] Verify active RFPs display
   - [ ] Check commission pipeline metrics
   - [ ] View recent activity feed
   - [ ] Verify advisor profile information

#### B. Submit New Deal (`/advisor/submit-deal`)
2. **Create RFP Process**
   - [ ] Click "Submit New Deal" or navigate to `/advisor/submit-deal`
   - [ ] Fill in fund details:
     - Fund Name: "Confidential Fund Alpha"
     - GP Name: (anonymized - "GP-12345")
     - AUM: $300M
     - Strategy: Buyout
     - Requested Amount: $30M
   - [ ] Verify GP information is anonymized
   - [ ] Submit deal
   - [ ] Verify deal appears in active RFPs

#### C. Active RFPs Management (`/advisor/active-rfps`)
3. **Manage RFP Process**
   - [ ] Navigate to Active RFPs page
   - [ ] View all active RFP processes
   - [ ] Click on an RFP to view details
   - [ ] Check anonymization of GP details
   - [ ] Review submitted term sheets

4. **Term Sheet Comparison**
   - [ ] Select an RFP with multiple term sheets
   - [ ] Use comparison view (if available)
   - [ ] Compare pricing, terms, timelines
   - [ ] Rank lenders
   - [ ] Add notes to term sheets

#### D. Client Management (`/advisor/clients`)
5. **Client Portfolio**
   - [ ] Navigate to My Clients page
   - [ ] View all GP clients
   - [ ] Add new client
   - [ ] Track client deal history
   - [ ] Monitor commission status

6. **Commission Tracking**
   - [ ] View earned commissions (50-75 bps)
   - [ ] Check commission pipeline
   - [ ] Filter by status (pending, earned, paid)
   - [ ] Export commission report

---

### Test 4: GP/Fund Manager Workflows

**Login**: Select "GP/Fund Manager" from profile selection

#### A. GP Onboarding (`/onboarding`)
1. **Start Onboarding**
   - [ ] Verify landing page displays
   - [ ] Fill in fund information:
     - Fund Name: "Test Venture Fund III"
     - Contact Name
     - Contact Email
     - Contact Phone
   - [ ] Click "Continue to Document Upload"
   - [ ] Verify redirect to upload page

2. **Document Upload** (`/onboarding/:id/upload`)
   - [ ] Upload fund documents (PPM, financials, portfolio data)
   - [ ] Verify upload progress indicators
   - [ ] Verify document list updates
   - [ ] Test file type validation
   - [ ] Test file size limits
   - [ ] Click "Continue to Review"

3. **Review & Submit** (`/onboarding/:id/review`)
   - [ ] Review extracted data (if AI extraction enabled)
   - [ ] Verify all fields populated correctly
   - [ ] Make manual corrections if needed
   - [ ] Confirm data accuracy
   - [ ] Click "Submit Application"
   - [ ] Verify redirect to completion page

4. **Onboarding Complete** (`/onboarding/:id/complete`)
   - [ ] Verify success message
   - [ ] Check next steps information
   - [ ] Click "Go to Dashboard"
   - [ ] Verify redirect to GP dashboard

#### B. GP Dashboard (`/gp`)
5. **GP Dashboard Overview**
   - [ ] View facility summary
   - [ ] Check outstanding balance
   - [ ] View payment schedule
   - [ ] See upcoming obligations
   - [ ] Access quick actions (draw request, upload document)

#### C. Facility Management (`/gp/facility`)
6. **Facility Details**
   - [ ] Navigate to Facility page
   - [ ] View complete facility terms
   - [ ] Check interest rate and LTV
   - [ ] View maturity date and payment schedule
   - [ ] Download facility documents

7. **Draw Requests**
   - [ ] Click "New Draw Request" button
   - [ ] Enter draw amount
   - [ ] Add justification/purpose
   - [ ] Upload supporting documents
   - [ ] Submit request
   - [ ] Verify request appears in pending draws
   - [ ] Track approval status

8. **Document Management**
   - [ ] Navigate to document vault
   - [ ] Upload quarterly financials
   - [ ] Upload portfolio company reports
   - [ ] View uploaded documents list
   - [ ] Download previously uploaded documents
   - [ ] Delete documents (test permissions)

9. **Messaging/Communication**
   - [ ] Open messaging interface
   - [ ] Send message to operations team
   - [ ] Attach documents to messages
   - [ ] View message history
   - [ ] Test real-time updates (if applicable)

---

### Test 5: Global Features (All Users)

#### A. Global Search (Cmd+K / Ctrl+K)
1. **Search Functionality**
   - [ ] Press Cmd+K (Mac) or Ctrl+K (Windows)
   - [ ] Verify search modal opens
   - [ ] Search for a GP deal by fund name
   - [ ] Verify results display with correct icon
   - [ ] Click result to navigate to entity
   - [ ] Search for a prospect by name
   - [ ] Search for a facility
   - [ ] Search for an advisor
   - [ ] Test real-time search (type-ahead)
   - [ ] Test empty search results
   - [ ] Press Escape to close modal

2. **Search Result Types**
   - [ ] Verify GP deals show with appropriate icon
   - [ ] Verify prospects show with appropriate icon
   - [ ] Verify facilities show with appropriate icon
   - [ ] Verify advisors show with appropriate icon
   - [ ] Test clicking each result type
   - [ ] Verify navigation works correctly

#### B. Notifications
3. **Notification Center**
   - [ ] Click notification bell icon
   - [ ] Verify notification dropdown opens
   - [ ] Check notification count badge
   - [ ] View different notification types:
     - [ ] Covenant breach alerts (red/urgent)
     - [ ] Draw request updates
     - [ ] Document uploads
     - [ ] Term sheet submissions
   - [ ] Mark notification as read
   - [ ] Verify read notifications style changes
   - [ ] Delete notification
   - [ ] Click "View All" to go to full notifications page

4. **Notification Preferences** (`/notifications`)
   - [ ] Navigate to Notification Preferences page
   - [ ] Toggle email notifications
   - [ ] Toggle SMS notifications
   - [ ] Configure notification types:
     - [ ] Covenant breaches
     - [ ] Draw requests
     - [ ] Term sheets
     - [ ] Document uploads
   - [ ] Set quiet hours
   - [ ] Save preferences
   - [ ] Verify toast confirmation

#### C. Help System
5. **Help Center**
   - [ ] Click help button (? icon)
   - [ ] Verify help dialog opens
   - [ ] Test tabbed navigation:
     - [ ] Operations Guide
     - [ ] Advisors Guide
     - [ ] GP Users Guide
     - [ ] FAQ
   - [ ] Verify role-specific content displays
   - [ ] Test help content search (if available)
   - [ ] Close help dialog
   - [ ] Verify keyboard shortcut (if applicable)

#### D. Settings & Profile
6. **User Settings** (`/settings`)
   - [ ] Navigate to Settings page
   - [ ] Update profile information
   - [ ] Change email preferences
   - [ ] Update notification settings
   - [ ] Test theme toggle (light/dark mode)
   - [ ] Save changes
   - [ ] Verify changes persist after refresh

#### E. Data Export
7. **CSV Export Testing**
   - [ ] From Deal Pipeline: Export prospects to CSV
   - [ ] From Monitoring: Export facilities to CSV
   - [ ] From Portfolio: Export all facilities to CSV
   - [ ] Open each CSV file
   - [ ] Verify all columns present
   - [ ] Verify data accuracy
   - [ ] Verify timestamp in filename

---

## 🔍 Cross-Cutting Concerns

### Performance
- [ ] Test with 50+ prospects
- [ ] Test with 20+ facilities
- [ ] Test with 100+ notifications
- [ ] Verify page load times < 2 seconds
- [ ] Check for memory leaks (long session)

### Responsiveness
- [ ] Test on mobile viewport (375px)
- [ ] Test on tablet viewport (768px)
- [ ] Test on desktop (1920px)
- [ ] Verify sidebar collapses on mobile
- [ ] Test touch interactions

### Error Handling
- [ ] Test invalid form submissions
- [ ] Test network errors (offline mode)
- [ ] Test concurrent user updates
- [ ] Verify error toast messages display
- [ ] Test form validation messages

### Security
- [ ] Verify unauthenticated users redirect to login
- [ ] Test role-based access (advisor can't access operations features)
- [ ] Verify sensitive data is not exposed in URLs
- [ ] Test session timeout behavior
- [ ] Verify CSRF protection (if applicable)

### Data Integrity
- [ ] Create facility → delete prospect → verify facility still works
- [ ] Create covenant → update facility → verify covenant still tracks
- [ ] Generate document → update facility data → regenerate → verify changes
- [ ] Test concurrent edits (two users editing same entity)

---

## 📊 Success Criteria

**Pass Criteria:**
- ✅ All core user workflows complete without errors
- ✅ Data persists correctly across sessions
- ✅ Notifications trigger appropriately
- ✅ Documents generate with correct data
- ✅ Search returns accurate results
- ✅ No console errors during normal usage
- ✅ Responsive design works on all viewports

**Known Limitations:**
- Automated e2e testing blocked by OIDC in test environment (expected)
- Manual testing required for complete coverage

---

## 🐛 Bug Reporting Template

If you encounter issues, document them using this template:

```markdown
**Bug Title:** Brief description

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. Navigate to...
2. Click on...
3. Enter...
4. Click submit...

**Expected Result:** What should happen

**Actual Result:** What actually happened

**Screenshots:** (if applicable)

**Environment:**
- Browser: Chrome/Firefox/Safari
- Viewport: Desktop/Mobile/Tablet
- User Role: Operations/Advisor/GP

**Console Errors:** (copy from browser console)
```

---

## ✅ Testing Checklist Summary

**Phase 1: Authentication & Navigation**
- [ ] Profile selection works
- [ ] Role routing correct
- [ ] Session persistence
- [ ] Change profile works

**Phase 2: Operations Team (15 checks)**
- [ ] Prospect management (5 checks)
- [ ] Facility creation (3 checks)
- [ ] Covenant monitoring (7 checks)
- [ ] Legal document generation (10 checks)
- [ ] Portfolio analytics (3 checks)

**Phase 3: Advisors (10 checks)**
- [ ] Dashboard overview (4 checks)
- [ ] RFP creation (3 checks)
- [ ] Term sheet comparison (3 checks)

**Phase 4: GP Users (15 checks)**
- [ ] Onboarding flow (9 checks)
- [ ] Facility management (6 checks)

**Phase 5: Global Features (12 checks)**
- [ ] Search (5 checks)
- [ ] Notifications (4 checks)
- [ ] Help system (3 checks)

**Total: 52 Manual Test Cases**

---

*Generated for AlphaNAV - NAV Lending Operations Platform*
*Last Updated: October 23, 2025*
