interface TemplateConfig {
  interestType: "fixed" | "variable";
  termLength: number;
  includeOID: boolean;
  includePIK: boolean;
  covenantDebtEBITDA: boolean;
  debtEBITDARatio?: number;
  amortizationSchedule: boolean;
  prepaymentPenalty: boolean;
  securityInterest: boolean;
}

interface FacilityData {
  fundName: string;
  principalAmount: number;
  interestRate: number;
  ltvRatio: number;
  maturityDate: Date;
  paymentSchedule: string;
}

export function generateLoanAgreement(config: TemplateConfig, facility?: Partial<FacilityData>): string {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  const doc = `# NAV FACILITY LOAN AGREEMENT

**Date:** ${date}  
**Lender:** NAV IQ Capital LLC  
**Borrower:** ${facility?.fundName || '[FUND NAME]'}

## ARTICLE I: LOAN TERMS

### 1.1 Principal Amount
The Lender agrees to provide a credit facility to the Borrower in the principal amount of **$${facility?.principalAmount?.toLocaleString() || '[AMOUNT]'}** (the "Principal Amount").

### 1.2 Interest Rate
${config.interestType === 'fixed' 
  ? `The Loan shall bear interest at a **fixed rate** of **${facility?.interestRate ? (facility.interestRate / 100).toFixed(2) : '[RATE]'}%** per annum.`
  : `The Loan shall bear interest at a **variable rate** equal to SOFR plus [MARGIN]% per annum, calculated and payable ${facility?.paymentSchedule || 'quarterly'}.`
}

### 1.3 Term
The Loan shall have a term of **${config.termLength} months** from the date of first drawdown, maturing on ${facility?.maturityDate ? new Date(facility.maturityDate).toLocaleDateString() : '[MATURITY DATE]'}.

### 1.4 Loan-to-NAV Ratio
The maximum Loan-to-NAV ratio shall not exceed **${facility?.ltvRatio || '[LTV]'}%** at any time during the term of this Agreement.

${config.includeOID ? `
## ARTICLE II: ORIGINAL ISSUE DISCOUNT (OID)

### 2.1 OID Terms
The Borrower acknowledges that this Loan includes an Original Issue Discount of [OID_AMOUNT]% of the Principal Amount. The effective proceeds to the Borrower shall be reduced by the OID amount at closing.

### 2.2 OID Accounting
The OID shall be treated as additional interest expense and amortized over the term of the Loan in accordance with applicable accounting standards.
` : ''}

## ARTICLE ${config.includeOID ? 'III' : 'II'}: PAYMENT TERMS

### ${config.includeOID ? '3' : '2'}.1 Payment Schedule
${config.amortizationSchedule 
  ? `Principal and interest shall be payable on a ${facility?.paymentSchedule || 'quarterly'} basis according to the amortization schedule attached as **Exhibit A**.`
  : `Interest shall be payable ${facility?.paymentSchedule || 'quarterly'} in arrears. The entire Principal Amount shall be due and payable on the Maturity Date.`
}

${config.includePIK ? `
### ${config.includeOID ? '3' : '2'}.2 Payment-In-Kind (PIK) Option
The Borrower may elect to pay up to [PIK_PERCENTAGE]% of the interest due in any period by adding such amount to the outstanding Principal Amount (the "PIK Option"). The Borrower must provide notice of PIK election no less than [NOTICE_DAYS] days prior to each payment date.
` : ''}

### ${config.includeOID ? '3' : '2'}.${config.includePIK ? '3' : '2'} Prepayment
${config.prepaymentPenalty
  ? `The Borrower may prepay all or any portion of the Loan, provided that prepayments made during the first [LOCKOUT_PERIOD] months shall be subject to a prepayment penalty equal to [PENALTY_RATE]% of the amount prepaid.`
  : `The Borrower may prepay all or any portion of the Loan at any time without penalty, provided that prepayments shall be accompanied by accrued interest to the date of prepayment.`
}

## ARTICLE ${config.includeOID ? 'IV' : 'III'}: COVENANTS

### ${config.includeOID ? '4' : '3'}.1 Financial Covenants
The Borrower shall maintain the following financial covenants at all times during the term of this Agreement:

${config.covenantDebtEBITDA ? `
**(a) Debt/EBITDA Ratio:** The Borrower's ratio of total debt to EBITDA shall not exceed ${config.debtEBITDARatio || 3.5}:1.0 at any time.
` : ''}

**(b) Loan-to-NAV Ratio:** The Loan-to-NAV ratio shall not exceed ${facility?.ltvRatio || '[LTV]'}% at any time, tested ${facility?.paymentSchedule || 'quarterly'}.

**(c) Minimum Liquidity:** The Borrower shall maintain minimum undrawn cash and cash equivalents of not less than [MINIMUM_LIQUIDITY]% of the outstanding Loan balance.

### ${config.includeOID ? '4' : '3'}.2 Reporting Requirements
The Borrower shall provide to the Lender:

(a) Quarterly NAV statements within 45 days of quarter-end  
(b) Annual audited financial statements within 120 days of year-end  
(c) Monthly flash reports within 15 days of month-end  
(d) Immediate notice of any covenant breach or material adverse change

${config.securityInterest ? `
## ARTICLE ${config.includeOID ? 'V' : 'IV'}: SECURITY AND COLLATERAL

### ${config.includeOID ? '5' : '4'}.1 Security Interest
As security for the Loan, the Borrower grants to the Lender a first-priority security interest in:

(a) All capital commitments from limited partners  
(b) All rights to capital calls and distributions  
(c) All portfolio investments and proceeds thereof  
(d) All cash and cash equivalents held in the fund  
(e) All other assets of the Borrower

### ${config.includeOID ? '5' : '4'}.2 Perfection
The Borrower shall execute and deliver all documents necessary to perfect the Lender's security interest, including UCC financing statements and notices to limited partners.
` : ''}

## ARTICLE ${config.includeOID ? 'VI' : config.securityInterest ? 'V' : 'IV'}: EVENTS OF DEFAULT

### Default Events
The following shall constitute Events of Default under this Agreement:

(a) Failure to pay principal or interest when due  
(b) Breach of any covenant that is not cured within [CURE_PERIOD] days  
(c) Material misrepresentation or breach of warranty  
(d) Bankruptcy or insolvency of the Borrower  
(e) Material adverse change in the Borrower's financial condition  
(f) Cross-default under any other material agreement

### Remedies
Upon an Event of Default, the Lender may declare the entire outstanding balance immediately due and payable and exercise all rights and remedies available at law or in equity.

## ARTICLE ${config.includeOID ? 'VII' : config.securityInterest ? 'VI' : 'V'}: GENERAL PROVISIONS

### Governing Law
This Agreement shall be governed by and construed in accordance with the laws of the State of [GOVERNING_STATE].

### Notices
All notices shall be in writing and delivered to the addresses set forth in this Agreement.

### Amendments
This Agreement may be amended only by written agreement signed by both parties.

---

**IN WITNESS WHEREOF**, the parties have executed this Agreement as of the date first written above.

**NAV IQ CAPITAL LLC**

By: ________________________  
Name:  
Title:  
Date:

**${facility?.fundName || '[BORROWER NAME]'}**

By: ________________________  
Name:  
Title:  
Date:

---

*This is a computer-generated template. Review by qualified legal counsel is required before execution.*
`;

  return doc;
}

export function generateTermSheet(config: TemplateConfig, facility?: Partial<FacilityData>): string {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  const doc = `# NAV FACILITY TERM SHEET

**Date:** ${date}  
**Lender:** NAV IQ Capital LLC  
**Borrower:** ${facility?.fundName || '[FUND NAME]'}

---

## PRINCIPAL TERMS

| **Term** | **Details** |
|----------|-------------|
| **Facility Amount** | $${facility?.principalAmount?.toLocaleString() || '[AMOUNT]'} |
| **Interest Rate** | ${config.interestType === 'fixed' ? `${facility?.interestRate ? (facility.interestRate / 100).toFixed(2) : '[RATE]'}% fixed` : 'SOFR + [MARGIN]% variable'} |
| **Term** | ${config.termLength} months |
| **LTV Ratio** | Maximum ${facility?.ltvRatio || '[LTV]'}% |
| **Payment Schedule** | ${facility?.paymentSchedule || 'Quarterly'} interest${config.amortizationSchedule ? ' and principal' : ', principal at maturity'} |
| **Maturity Date** | ${facility?.maturityDate ? new Date(facility.maturityDate).toLocaleDateString() : '[MATURITY DATE]'} |

## FEES & ECONOMICS

${config.includeOID ? `**Original Issue Discount:** [OID_PERCENTAGE]% of facility amount\n` : ''}
**Commitment Fee:** [COMMITMENT_FEE]% per annum on undrawn amounts  
**Closing Fee:** [CLOSING_FEE]% of facility amount  
${config.prepaymentPenalty ? `**Prepayment Penalty:** ${config.prepaymentPenalty ? '[PENALTY_RATE]% during first [LOCKOUT_PERIOD] months' : 'None'}\n` : ''}

## KEY COVENANTS

### Financial Covenants
${config.covenantDebtEBITDA ? `- **Debt/EBITDA:** Maximum ${config.debtEBITDARatio || 3.5}:1.0\n` : ''}
- **LTV Ratio:** Maximum ${facility?.ltvRatio || '[LTV]'}%
- **Minimum Liquidity:** [MINIMUM_LIQUIDITY]% of outstanding balance

### Reporting Requirements
- Quarterly NAV statements (within 45 days)
- Annual audited financials (within 120 days)
- Monthly flash reports (within 15 days)
- Immediate breach notification

${config.securityInterest ? `
## SECURITY
- First-priority security interest in all fund assets
- Capital commitments and distribution rights
- Portfolio investments and proceeds
- Cash and cash equivalents
` : ''}

## CONDITIONS PRECEDENT

- Satisfactory due diligence  
- Approval by Lender's investment committee  
- Legal documentation acceptable to Lender  
- Third-party opinions and confirmations  
- No material adverse change

## GOVERNING LAW

State of [GOVERNING_STATE]

---

**This term sheet is non-binding and for discussion purposes only. Final terms subject to definitive loan documentation and Lender approval.**

*Generated: ${new Date().toISOString()}*
`;

  return doc;
}

export function generateComplianceReport(facilityId: string, facilityData?: any): string {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const quarter = `Q${Math.floor(new Date().getMonth() / 3) + 1} ${new Date().getFullYear()}`;
  
  const doc = `# QUARTERLY COMPLIANCE REPORT

**Report Period:** ${quarter}  
**Report Date:** ${date}  
**Lender:** NAV IQ Capital LLC  
**Borrower:** ${facilityData?.fundName || '[FUND NAME]'}  
**Facility ID:** ${facilityId}

---

## EXECUTIVE SUMMARY

This Quarterly Compliance Report confirms the Borrower's compliance status with all financial covenants and reporting requirements under the NAV Facility Loan Agreement dated [LOAN_DATE].

**Overall Compliance Status:** ✓ COMPLIANT

---

## LOAN DETAILS

| **Metric** | **Value** |
|------------|-----------|
| **Original Principal** | $${facilityData?.principalAmount?.toLocaleString() || '[AMOUNT]'} |
| **Current Outstanding Balance** | $${facilityData?.outstandingBalance?.toLocaleString() || '[BALANCE]'} |
| **Interest Rate** | ${facilityData?.interestRate ? (facilityData.interestRate / 100).toFixed(2) : '[RATE]'}% |
| **Maturity Date** | ${facilityData?.maturityDate ? new Date(facilityData.maturityDate).toLocaleDateString() : '[DATE]'} |
| **Payment Status** | Current |

---

## COVENANT COMPLIANCE

### Financial Covenants

| **Covenant** | **Requirement** | **Actual** | **Status** |
|--------------|----------------|------------|------------|
| **LTV Ratio** | ≤ ${facilityData?.ltvRatio || '[LTV]'}% | [ACTUAL_LTV]% | ✓ Compliant |
| **Minimum Liquidity** | ≥ [MIN_LIQ]% | [ACTUAL_LIQ]% | ✓ Compliant |
| **Debt/EBITDA** | ≤ [MAX_RATIO] | [ACTUAL_RATIO] | ✓ Compliant |

### Operational Covenants

- ✓ Quarterly NAV statement received [DATE]
- ✓ Monthly flash reports current
- ✓ No material adverse changes reported
- ✓ No Events of Default

---

## NAV ANALYSIS

**Fund NAV (as of [NAV_DATE]):** $[NAV_AMOUNT]

**NAV Movement:**
- Beginning NAV: $[BEGINNING_NAV]
- Contributions: $[CONTRIBUTIONS]
- Distributions: ($[DISTRIBUTIONS])
- Net Appreciation/(Depreciation): $[NET_CHANGE]
- Ending NAV: $[ENDING_NAV]

**Loan-to-NAV Calculation:**
- Outstanding Loan Balance: $[LOAN_BALANCE]
- Current Fund NAV: $[CURRENT_NAV]
- **LTV Ratio: [CALCULATED_LTV]%** (Limit: ${facilityData?.ltvRatio || '[LTV]'}%)

---

## PORTFOLIO COMPOSITION

| **Sector** | **# Investments** | **Fair Value** | **% of NAV** |
|------------|-------------------|----------------|--------------|
| Technology | [COUNT] | $[VALUE] | [PERCENT]% |
| Healthcare | [COUNT] | $[VALUE] | [PERCENT]% |
| Financial Services | [COUNT] | $[VALUE] | [PERCENT]% |
| Industrial | [COUNT] | $[VALUE] | [PERCENT]% |
| **Total** | **[TOTAL_COUNT]** | **$[TOTAL_VALUE]** | **100%** |

**Portfolio Diversification:** ✓ Adequate

---

## LIQUIDITY ANALYSIS

| **Liquidity Item** | **Amount** |
|-------------------|------------|
| Cash & Cash Equivalents | $[CASH] |
| Undrawn Capital Commitments | $[UNDRAWN] |
| Near-term Expected Distributions | $[EXPECTED_DIST] |
| **Total Available Liquidity** | **$[TOTAL_LIQUIDITY]** |

**Liquidity Coverage Ratio:** [RATIO]x (Minimum: [MIN_RATIO]x)

---

## PAYMENT HISTORY

### Current Quarter
- **Interest Payment Due:** $[INTEREST_DUE]
- **Interest Paid:** $[INTEREST_PAID]
- **Payment Date:** [PAYMENT_DATE]
- **Status:** ✓ Paid in Full

### Year-to-Date
- **Total Interest Paid:** $[YTD_INTEREST]
- **Missed Payments:** 0
- **Late Payments:** 0

---

## REPORTING COMPLIANCE

| **Required Report** | **Due Date** | **Submitted** | **Status** |
|---------------------|--------------|---------------|------------|
| Q1 NAV Statement | [DUE_DATE] | [SUBMIT_DATE] | ✓ On Time |
| Monthly Flash (Jan) | [DUE_DATE] | [SUBMIT_DATE] | ✓ On Time |
| Monthly Flash (Feb) | [DUE_DATE] | [SUBMIT_DATE] | ✓ On Time |
| Monthly Flash (Mar) | [DUE_DATE] | [SUBMIT_DATE] | ✓ On Time |

---

## RISK FACTORS & NOTES

**Identified Risks:**
- [RISK_ITEM_1]
- [RISK_ITEM_2]

**Mitigation Actions:**
- [MITIGATION_1]
- [MITIGATION_2]

**Comments:**
[ADDITIONAL_NOTES]

---

## CERTIFICATION

I hereby certify that the information contained in this Compliance Report is true, accurate, and complete to the best of my knowledge.

**Prepared By:**  
Name: [PREPARER_NAME]  
Title: [TITLE]  
Date: ${date}

**Reviewed By:**  
Name: [REVIEWER_NAME]  
Title: Chief Compliance Officer  
Date: ${date}

---

*This compliance report is generated for internal monitoring purposes and is subject to verification.*

**Next Report Due:** [NEXT_QUARTER]
`;

  return doc;
}
