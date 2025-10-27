# AlphaNAV API Documentation

**Version**: 1.0.0  
**Base URL**: `https://your-domain.replit.app/api`  
**Authentication**: Session-based (OIDC via Replit Auth)  
**Rate Limiting**: 100 requests per 15 minutes (global), 5 login attempts per 15 minutes

---

## Table of Contents

1. [Authentication](#authentication)
2. [User & Profile](#user--profile)
3. [GP Onboarding](#gp-onboarding)
4. [Prospects](#prospects)
5. [Facilities](#facilities)
6. [Draw Requests](#draw-requests)
7. [Cash Flows](#cash-flows)
8. [Covenants](#covenants)
9. [Documents](#documents)
10. [Legal Document Generation](#legal-document-generation)
11. [Advisor Operations](#advisor-operations)
12. [Portfolio Analytics](#portfolio-analytics)
13. [Notifications](#notifications)
14. [Messages](#messages)
15. [Global Search](#global-search)
16. [AI Services](#ai-services)
17. [Error Codes](#error-codes)

---

## Authentication

### Login
```http
GET /api/login
```

Initiates OIDC authentication flow. Redirects to Replit Auth.

**Response**: `302 Redirect` to OIDC provider

---

### Callback
```http
GET /api/callback
```

OAuth callback endpoint. Handles authentication response.

**Response**: `302 Redirect` to `/` on success

---

### Logout
```http
GET /api/logout
```

Terminates session and redirects to OIDC logout.

**Response**: `302 Redirect` to OIDC logout page

---

### Get Current User
```http
GET /api/auth/user
```

Returns authenticated user information.

**Response**: `200 OK`
```json
{
  "id": "user_abc123",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "operations",
  "profileImageUrl": "https://..."
}
```

**Error**: `401 Unauthorized` if not authenticated

---

### Token Refresh
```http
POST /api/auth/refresh
```

Refreshes access token using refresh token.

**Rate Limit**: 20 requests per 15 minutes

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Token refreshed successfully"
}
```

---

## User & Profile

### Set User Role
```http
POST /api/user/role
```

Sets the user's role for role-based navigation.

**Permissions**: Authenticated users

**Request Body**:
```json
{
  "role": "operations" | "advisor" | "gp"
}
```

**Response**: `200 OK`
```json
{
  "id": "user_abc123",
  "role": "operations"
}
```

---

## GP Onboarding

### Create Onboarding Session
```http
POST /api/onboarding/sessions
```

**Permissions**: GP users

**Request Body**:
```json
{
  "fundName": "Example Fund LP",
  "vintage": 2020,
  "aum": 250000000,
  "fundStage": "fundraising" | "investing" | "harvesting"
}
```

**Response**: `201 Created`
```json
{
  "id": "session_xyz789",
  "userId": "user_abc123",
  "fundName": "Example Fund LP",
  "vintage": 2020,
  "aum": 250000000,
  "currentStep": "fund_info",
  "status": "in_progress",
  "createdAt": "2025-10-27T10:00:00Z"
}
```

---

### Upload Document
```http
POST /api/onboarding/sessions/:sessionId/documents
Content-Type: multipart/form-data
```

**Permissions**: GP users (own sessions only)

**Request Body**:
- `file`: Document file (PDF, DOCX, XLSX, TXT, CSV)
- `documentType`: "fund_documents" | "financial_statements" | "legal_agreements" | "other"

**File Limits**:
- Max size: 10MB
- Allowed types: PDF, Word, Excel, plain text, CSV

**Response**: `201 Created`
```json
{
  "id": "doc_123",
  "sessionId": "session_xyz789",
  "filename": "fund_agreement.pdf",
  "fileSize": 2048576,
  "mimeType": "application/pdf",
  "documentType": "fund_documents",
  "uploadedAt": "2025-10-27T10:05:00Z"
}
```

---

### Analyze Document with AI
```http
POST /api/onboarding/sessions/:sessionId/analyze
```

**Permissions**: GP users

**Description**: Uses Gemini AI to extract fund information from uploaded documents

**Response**: `200 OK`
```json
{
  "success": true,
  "extraction": {
    "fundName": "Example Fund IV LP",
    "aum": 250000000,
    "vintage": 2020,
    "portfolioCompanies": ["Company A", "Company B"],
    "sectors": ["Technology", "Healthcare"],
    "keyPersonnel": ["John Doe (Managing Partner)"],
    "meetsEligibilityCriteria": true,
    "confidence": 85
  }
}
```

---

### Get Onboarding Session
```http
GET /api/onboarding/sessions/:sessionId
```

**Permissions**: GP users (own sessions), Operations/Admin (all sessions)

**Response**: `200 OK`
```json
{
  "id": "session_xyz789",
  "fundName": "Example Fund LP",
  "currentStep": "review",
  "status": "completed",
  "documents": [ /* array of uploaded documents */ ]
}
```

---

## Prospects

### List Prospects
```http
GET /api/prospects
```

**Permissions**: Operations, Admin

**Query Parameters**:
- `stage`: Filter by stage ("prospect" | "underwriting" | "term_sheet" | "due_diligence" | "closed")
- `search`: Search by fund name

**Response**: `200 OK`
```json
[
  {
    "id": "prospect_1",
    "fundName": "Example Fund LP",
    "vintage": 2020,
    "aum": 250000000,
    "stage": "underwriting",
    "fundScore": {
      "loanNeedScore": 85,
      "borrowerQualityScore": 90,
      "engagementScore": 75,
      "overallScore": 83,
      "recommendation": "high-priority"
    },
    "createdAt": "2025-10-27T10:00:00Z"
  }
]
```

---

### Create Prospect
```http
POST /api/prospects
```

**Permissions**: Operations, Admin

**Request Body**:
```json
{
  "fundName": "Example Fund LP",
  "vintage": 2020,
  "aum": 250000000,
  "fundStage": "investing",
  "contactName": "John Doe",
  "contactEmail": "john@example.com"
}
```

**Response**: `201 Created`

---

### Update Prospect
```http
PATCH /api/prospects/:id
```

**Permissions**: Operations, Admin

**Request Body**: Partial prospect object

**Response**: `200 OK`

---

## Facilities

### List Facilities
```http
GET /api/facilities
```

**Permissions**:
- GP: Own facilities only
- Operations/Admin: All facilities

**Query Parameters**:
- `status`: Filter by status ("active" | "prepaid" | "defaulted" | "matured")

**Response**: `200 OK`
```json
[
  {
    "id": "facility-1",
    "facilityName": "Example Fund NAV Facility",
    "ownerId": "user_abc123",
    "fundName": "Example Fund LP",
    "loanAmount": 50000000,
    "interestRate": 8.5,
    "ltv": 12.5,
    "status": "active",
    "startDate": "2025-01-15",
    "maturityDate": "2027-01-15",
    "createdAt": "2025-01-10T10:00:00Z"
  }
]
```

---

### Get Facility
```http
GET /api/facilities/:id
```

**Permissions**:
- GP: Own facilities only (403 for others)
- Operations/Admin: All facilities

**Response**: `200 OK`
```json
{
  "id": "facility-1",
  "facilityName": "Example Fund NAV Facility",
  /* ...full facility object... */
}
```

**Error**: `403 Forbidden` if GP accessing another GP's facility

---

### Create Facility
```http
POST /api/facilities
```

**Permissions**: Operations, Admin

**Request Body**:
```json
{
  "facilityName": "Example Fund NAV Facility",
  "ownerId": "user_abc123",
  "fundName": "Example Fund LP",
  "loanAmount": 50000000,
  "interestRate": 8.5,
  "ltv": 12.5,
  "startDate": "2025-01-15",
  "maturityDate": "2027-01-15"
}
```

**Response**: `201 Created`

---

## Draw Requests

### List Draw Requests
```http
GET /api/facilities/:facilityId/draw-requests
```

**Permissions**:
- GP: Own facility's draw requests only
- Operations/Admin: All draw requests

**Response**: `200 OK`
```json
[
  {
    "id": "draw_123",
    "facilityId": "facility-1",
    "amount": 5000000,
    "purpose": "Portfolio company acquisition",
    "status": "pending",
    "requestedAt": "2025-10-27T10:00:00Z"
  }
]
```

---

### Create Draw Request
```http
POST /api/facilities/:facilityId/draw-requests
```

**Permissions**:
- GP: Own facilities only
- Operations/Admin: All facilities

**Request Body**:
```json
{
  "amount": 5000000,
  "purpose": "Portfolio company acquisition",
  "requestedDrawDate": "2025-11-01"
}
```

**Response**: `201 Created`

**Error**: `403 Forbidden` if GP creating draw request for another GP's facility

---

### Approve Draw Request
```http
POST /api/draw-requests/:id/approve
```

**Permissions**: Operations, Admin

**Response**: `200 OK`

---

### Reject Draw Request
```http
POST /api/draw-requests/:id/reject
```

**Permissions**: Operations, Admin

**Request Body**:
```json
{
  "reason": "Insufficient collateral"
}
```

**Response**: `200 OK`

---

## Cash Flows

### List Cash Flows
```http
GET /api/facilities/:facilityId/cash-flows
```

**Permissions**:
- GP: Own facility only
- Operations/Admin: All facilities

**Response**: `200 OK`
```json
[
  {
    "id": "cf_123",
    "facilityId": "facility-1",
    "type": "payment",
    "amount": 500000,
    "dueDate": "2025-11-15",
    "paidDate": null,
    "status": "pending"
  }
]
```

---

### Create Cash Flow
```http
POST /api/facilities/:facilityId/cash-flows
```

**Permissions**: Operations, Admin

**Request Body**:
```json
{
  "type": "payment" | "fee" | "interest",
  "amount": 500000,
  "dueDate": "2025-11-15",
  "description": "Monthly interest payment"
}
```

**Response**: `201 Created`

---

### Record Payment
```http
POST /api/cash-flows/:id/record-payment
```

**Permissions**: Operations, Admin

**Request Body**:
```json
{
  "paidDate": "2025-11-15",
  "paidAmount": 500000
}
```

**Response**: `200 OK`

---

## Covenants

### List Covenants
```http
GET /api/facilities/:facilityId/covenants
```

**Permissions**:
- GP: Own facility only
- Operations/Admin: All facilities

**Response**: `200 OK`
```json
[
  {
    "id": "cov_123",
    "facilityId": "facility-1",
    "covenantType": "ltv_ratio",
    "threshold": 15.0,
    "currentValue": 12.5,
    "status": "compliant",
    "lastChecked": "2025-10-27T10:00:00Z"
  }
]
```

---

### Manual Covenant Check
```http
POST /api/facilities/:facilityId/covenants/check
```

**Permissions**:
- GP: Own facility only
- Operations/Admin: All facilities

**Description**: Manually triggers covenant compliance check

**Response**: `200 OK`
```json
{
  "facilityId": "facility-1",
  "results": [
    {
      "covenantType": "ltv_ratio",
      "status": "compliant",
      "currentValue": 12.5,
      "threshold": 15.0
    }
  ]
}
```

**Error**: `403 Forbidden` if GP checking another GP's facility

---

### Get Covenant Summary
```http
GET /api/facilities/:facilityId/covenants/summary
```

**Permissions**:
- GP: Own facility only
- Operations/Admin: All facilities

**Response**: `200 OK`
```json
{
  "total": 5,
  "compliant": 4,
  "warning": 1,
  "breach": 0,
  "covenants": [ /* array of covenant objects */ ]
}
```

---

### Analyze Breach Risk (AI)
```http
POST /api/facilities/:facilityId/analyze-breach-risk
```

**Permissions**: Operations, Admin, GP (own facility)

**Description**: Uses Gemini AI to analyze covenant breach probability

**Response**: `200 OK`
```json
{
  "facilityId": "facility-1",
  "breachProbability": 15,
  "riskLevel": "low",
  "riskFactors": [
    "Market volatility in technology sector",
    "Recent portfolio company underperformance"
  ],
  "recommendations": [
    "Monitor portfolio company valuations monthly",
    "Consider hedging strategies"
  ],
  "timeToBreachEstimate": "12+ months"
}
```

---

## Documents

### List Documents
```http
GET /api/facilities/:facilityId/documents
```

**Permissions**:
- GP: Own facility only
- Operations/Admin: All facilities

**Response**: `200 OK`
```json
[
  {
    "id": "doc_456",
    "facilityId": "facility-1",
    "filename": "loan_agreement.pdf",
    "documentType": "loan_agreement",
    "uploadedAt": "2025-10-27T10:00:00Z",
    "uploadedBy": "user_abc123"
  }
]
```

---

### Upload Document
```http
POST /api/facilities/:facilityId/documents
Content-Type: multipart/form-data
```

**Permissions**:
- GP: Own facility only
- Operations/Admin: All facilities

**Request Body**:
- `file`: Document file (max 10MB)
- `documentType`: Document category

**Response**: `201 Created`

---

### Download Document
```http
GET /api/documents/:id/download
```

**Permissions**: Facility owner or Operations/Admin

**Response**: `200 OK` (file download)

---

## Legal Document Generation

### Generate Document
```http
POST /api/facilities/:facilityId/generate-document
```

**Permissions**:
- GP: Own facility only
- Operations/Admin: All facilities

**Request Body**:
```json
{
  "documentType": "loan-agreement" | "term-sheet" | "compliance-report",
  "config": {
    "includeSchedules": true,
    "includeGuarantees": false,
    "customClauses": ["prepayment-penalty"]
  }
}
```

**Response**: `200 OK`
```json
{
  "id": "gendoc_789",
  "facilityId": "facility-1",
  "documentType": "loan-agreement",
  "content": "# LOAN AGREEMENT\n\n...",
  "generatedAt": "2025-10-27T10:00:00Z"
}
```

**Error**: `403 Forbidden` if GP generating for another GP's facility

---

## Advisor Operations

### Submit Deal
```http
POST /api/advisor/deals
```

**Permissions**: Advisor

**Request Body**:
```json
{
  "fundName": "Example Fund LP (Confidential)",
  "dealSize": 50000000,
  "requestedRate": 8.5,
  "urgency": "standard" | "high",
  "dealDescription": "..."
}
```

**Response**: `201 Created`

---

### List Advisor Deals
```http
GET /api/advisor/deals
```

**Permissions**: Advisor (own deals), Operations/Admin (all deals)

**Response**: `200 OK`

---

### Compare Bids
```http
GET /api/advisor/deals/:dealId/compare-bids
```

**Permissions**: Advisor (own deals), Operations/Admin

**Description**: Returns intelligent bid comparison with scoring

**Response**: `200 OK`
```json
{
  "dealId": "deal_123",
  "bids": [
    {
      "lenderId": "lender_1",
      "lenderName": "NAV IQ Capital",
      "interestRate": 8.5,
      "fees": 1.5,
      "terms": "24 months",
      "score": 92,
      "recommendation": "Best overall value"
    }
  ]
}
```

---

### Calculate Commission
```http
GET /api/advisor/commission/:dealId
```

**Permissions**: Advisor (own deals), Operations/Admin

**Response**: `200 OK`
```json
{
  "dealId": "deal_123",
  "dealSize": 50000000,
  "commissionRate": 0.75,
  "commissionAmount": 375000,
  "tier": "$10M-$50M"
}
```

**Commission Tiers**:
- <$10M: 100 bps (1.0%)
- $10M-$50M: 75 bps (0.75%)
- >$50M: 50 bps (0.5%)

---

### Advisor Dashboard
```http
GET /api/advisor/dashboard
```

**Permissions**: Advisor

**Response**: `200 OK`
```json
{
  "activeDeals": 5,
  "totalPipeline": 150000000,
  "avgWinRate": 68,
  "totalCommissionsEarned": 1250000,
  "recentDeals": [ /* array */ ]
}
```

---

## Portfolio Analytics

### Get Portfolio Summary
```http
GET /api/portfolio/summary
```

**Permissions**: Operations, Admin

**Description**: Comprehensive portfolio-wide analytics

**Response**: `200 OK`
```json
{
  "totalFacilities": 25,
  "totalLoanAmount": 750000000,
  "averageLtv": 11.8,
  "portfolioMetrics": {
    "activeLoans": 20,
    "prepaidLoans": 3,
    "defaultedLoans": 1,
    "maturedLoans": 1
  },
  "covenantHealth": {
    "compliant": 18,
    "warning": 2,
    "breach": 0
  },
  "paymentPerformance": {
    "onTime": 95,
    "late": 5,
    "defaulted": 0
  },
  "riskScoring": {
    "lowRisk": 15,
    "mediumRisk": 8,
    "highRisk": 2
  }
}
```

**Error**: `403 Forbidden` for non-Operations/Admin users

---

## Notifications

### List Notifications
```http
GET /api/notifications
```

**Permissions**: Authenticated users (own notifications)

**Query Parameters**:
- `unreadOnly`: boolean

**Response**: `200 OK`
```json
[
  {
    "id": "notif_123",
    "userId": "user_abc123",
    "type": "draw_request_approved",
    "priority": "high",
    "title": "Draw Request Approved",
    "message": "Your draw request for $5M has been approved",
    "read": false,
    "createdAt": "2025-10-27T10:00:00Z"
  }
]
```

---

### Mark as Read
```http
PATCH /api/notifications/:id/read
```

**Permissions**: Notification owner

**Response**: `200 OK`

---

## Messages

### List Messages
```http
GET /api/facilities/:facilityId/messages
```

**Permissions**: Facility owner or Operations/Admin

**Response**: `200 OK`
```json
[
  {
    "id": "msg_123",
    "facilityId": "facility-1",
    "senderId": "user_abc123",
    "message": "When can we expect the draw?",
    "createdAt": "2025-10-27T10:00:00Z"
  }
]
```

---

### Send Message
```http
POST /api/facilities/:facilityId/messages
```

**Permissions**: Facility owner or Operations/Admin

**Request Body**:
```json
{
  "message": "Draw approved, funds will be available on Nov 1"
}
```

**Response**: `201 Created`

---

## Global Search

### Search
```http
GET /api/search?q={query}
```

**Permissions**: Authenticated users

**Description**: Searches across facilities, prospects, deals

**Response**: `200 OK`
```json
{
  "facilities": [ /* matching facilities */ ],
  "prospects": [ /* matching prospects */ ],
  "deals": [ /* matching advisor deals */ ]
}
```

---

## AI Services

### Extract Document Data (Gemini AI)
```http
POST /api/onboarding/sessions/:sessionId/analyze
```

**Permissions**: GP (own sessions)

**Description**: Extracts fund information using Gemini 2.0 Flash

**Features**:
- Fund name, AUM, vintage extraction
- Portfolio company identification
- Sector analysis
- Key personnel detection
- Eligibility assessment
- Confidence scoring

---

### Analyze Covenant Breach Risk (Gemini AI)
```http
POST /api/facilities/:facilityId/analyze-breach-risk
```

**Permissions**: Operations, Admin, GP (own facility)

**Description**: AI-powered breach probability analysis

**Features**:
- Breach probability calculation
- Risk level assessment
- Risk factor identification
- Actionable recommendations
- Time-to-breach estimation

---

## Error Codes

### Standard HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request body or parameters |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Error Response Format

```json
{
  "error": "Error message",
  "details": {
    "field": "Validation details (if applicable)"
  }
}
```

---

## Rate Limiting

| Endpoint Pattern | Limit | Window |
|-----------------|-------|--------|
| `/api/*` | 100 requests | 15 minutes |
| `/api/login` | 5 attempts | 15 minutes |
| `/api/auth/callback` | 5 attempts | 15 minutes |
| `/api/auth/refresh` | 20 requests | 15 minutes |

**Rate Limit Headers**:
- `RateLimit-Limit`: Total requests allowed
- `RateLimit-Remaining`: Requests remaining
- `RateLimit-Reset`: Time when limit resets

---

## Security

### Authentication
- Session-based authentication using Replit Auth (OIDC)
- Session cookies: httpOnly, secure (production), sameSite=strict
- Session TTL: 7 days

### Authorization
- Role-based access control (RBAC)
- Multi-tenant isolation (GP users can only access own facilities)
- Operations/Admin roles bypass tenant restrictions

### Data Security
- Input validation using Zod schemas
- File upload restrictions (type, size, magic byte validation)
- SQL injection protection (Drizzle ORM parameterized queries)
- XSS protection (Helmet.js CSP headers)

### Monitoring
- Error tracking: Sentry
- Audit logging: All security-critical operations logged
- Rate limiting: Express rate-limit middleware

---

## Support

For API support:
- Documentation issues: [GitHub Issues]
- Production support: support@alphanav.com
- Security issues: security@alphanav.com

---

*Last Updated: October 27, 2025*  
*Version: 1.0.0*
