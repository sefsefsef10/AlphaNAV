import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, boolean, index, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth (Mandatory - do not drop)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth (Mandatory - do not drop)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("gp"), // 'advisor', 'gp', 'operations', 'admin'
  advisorId: varchar("advisor_id"), // Link to advisors table if role is 'advisor'
  stripeCustomerId: varchar("stripe_customer_id").unique(), // Stripe customer ID
  stripeSubscriptionId: varchar("stripe_subscription_id"), // Current active subscription ID
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Multi-Factor Authentication tables
export const mfaSettings = pgTable("mfa_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  enabled: boolean("enabled").notNull().default(false),
  totpSecret: varchar("totp_secret"), // Encrypted TOTP secret for authenticator apps
  backupPhone: varchar("backup_phone"), // For SMS backup (optional)
  smsEnabled: boolean("sms_enabled").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMfaSettingsSchema = createInsertSchema(mfaSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMfaSettings = z.infer<typeof insertMfaSettingsSchema>;
export type MfaSettings = typeof mfaSettings.$inferSelect;

// Backup recovery codes for MFA
export const mfaBackupCodes = pgTable("mfa_backup_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  code: varchar("code").notNull(), // Hashed backup code
  used: boolean("used").notNull().default(false),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_backup_codes_user_id").on(table.userId),
]);

export const insertMfaBackupCodeSchema = createInsertSchema(mfaBackupCodes).omit({
  id: true,
  createdAt: true,
});

export type InsertMfaBackupCode = z.infer<typeof insertMfaBackupCodeSchema>;
export type MfaBackupCode = typeof mfaBackupCodes.$inferSelect;

// MFA verification sessions (track 2FA challenges)
export const mfaSessions = pgTable("mfa_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  verified: boolean("verified").notNull().default(false),
  verifiedAt: timestamp("verified_at"),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_mfa_sessions_user_id").on(table.userId),
  index("idx_mfa_sessions_expires_at").on(table.expiresAt),
]);

export const insertMfaSessionSchema = createInsertSchema(mfaSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertMfaSession = z.infer<typeof insertMfaSessionSchema>;
export type MfaSession = typeof mfaSessions.$inferSelect;

export const onboardingSessions = pgTable("onboarding_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fundName: text("fund_name").notNull(),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  currentStep: integer("current_step").notNull().default(1),
  status: text("status").notNull().default("in_progress"),
  extractedData: jsonb("extracted_data"),
  confirmedData: jsonb("confirmed_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOnboardingSessionSchema = createInsertSchema(onboardingSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOnboardingSession = z.infer<typeof insertOnboardingSessionSchema>;
export type OnboardingSession = typeof onboardingSessions.$inferSelect;

// Batch upload tracking
export const uploadedDocumentBatches = pgTable("uploaded_document_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  uploadedBy: varchar("uploaded_by").notNull(),
  sessionId: varchar("session_id"), // Optional: link to onboarding session
  facilityId: varchar("facility_id"), // Optional: link to facility
  prospectId: varchar("prospect_id"), // Optional: link to prospect
  totalFiles: integer("total_files").notNull(),
  processedFiles: integer("processed_files").notNull().default(0),
  failedFiles: integer("failed_files").notNull().default(0),
  status: text("status").notNull().default("uploading"), // uploading, processing, completed, failed
  metadata: jsonb("metadata"), // Additional batch metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUploadedDocumentBatchSchema = createInsertSchema(uploadedDocumentBatches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUploadedDocumentBatch = z.infer<typeof insertUploadedDocumentBatchSchema>;
export type UploadedDocumentBatch = typeof uploadedDocumentBatches.$inferSelect;

// Document processing jobs for async queue
export const documentProcessingJobs = pgTable("document_processing_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  batchId: varchar("batch_id"),
  documentId: varchar("document_id").notNull(),
  jobType: text("job_type").notNull(), // extract_data, parse_legal, extract_companies
  status: text("status").notNull().default("queued"), // queued, processing, completed, failed, cancelled
  priority: integer("priority").notNull().default(5), // 1-10, higher = more urgent
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  processingStartedAt: timestamp("processing_started_at"),
  processingCompletedAt: timestamp("processing_completed_at"),
  result: jsonb("result"),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_processing_jobs_batch_id").on(table.batchId),
  index("idx_processing_jobs_document_id").on(table.documentId),
  index("idx_processing_jobs_status").on(table.status),
]);

export const insertDocumentProcessingJobSchema = createInsertSchema(documentProcessingJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDocumentProcessingJob = z.infer<typeof insertDocumentProcessingJobSchema>;
export type DocumentProcessingJob = typeof documentProcessingJobs.$inferSelect;

export const uploadedDocuments = pgTable("uploaded_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  batchId: varchar("batch_id"), // Link to batch if part of batch upload
  sessionId: varchar("session_id"), // For onboarding documents
  facilityId: varchar("facility_id"), // For facility documents
  prospectId: varchar("prospect_id"), // For prospect documents
  uploadedBy: varchar("uploaded_by"), // User ID who uploaded
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  storageUrl: text("storage_url").notNull(),
  checksum: text("checksum"), // SHA256 checksum for deduplication
  storageProvider: text("storage_provider").notNull().default("replit"), // replit, s3, gcs
  extractedData: jsonb("extracted_data"),
  extractionConfidence: integer("extraction_confidence"), // 0-100 confidence score
  processingStatus: text("processing_status").notNull().default("pending"), // pending, processing, completed, failed
  processingError: text("processing_error"), // Error message if failed
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
}, (table) => [
  index("idx_uploaded_documents_batch_id").on(table.batchId),
  index("idx_uploaded_documents_session_id").on(table.sessionId),
  index("idx_uploaded_documents_facility_id").on(table.facilityId),
  index("idx_uploaded_documents_prospect_id").on(table.prospectId),
  index("idx_uploaded_documents_checksum").on(table.checksum),
]);

export const insertUploadedDocumentSchema = createInsertSchema(uploadedDocuments).omit({
  id: true,
  uploadedAt: true,
});

export type InsertUploadedDocument = z.infer<typeof insertUploadedDocumentSchema>;
export type UploadedDocument = typeof uploadedDocuments.$inferSelect;

export const prospects = pgTable("prospects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  onboardingSessionId: varchar("onboarding_session_id"),
  fundName: text("fund_name").notNull(),
  fundSize: integer("fund_size"), // AUM in dollars
  vintage: integer("vintage"),
  portfolioCount: integer("portfolio_count"),
  sectors: jsonb("sectors"),
  gpName: text("gp_name"), // General Partner name
  gpFirmName: text("gp_firm_name"), // GP firm name
  gpTrackRecord: text("gp_track_record"), // GP track record summary
  fundStructure: text("fund_structure"), // LP/GP split, fund type
  strategy: text("strategy"), // Investment strategy
  geography: text("geography"), // Geographic focus
  stage: text("stage").notNull().default("prospect"), // prospect, underwriting, term_sheet, due_diligence, closed
  loanNeedScore: integer("loan_need_score"),
  borrowerQualityScore: integer("borrower_quality_score"),
  engagementScore: integer("engagement_score"),
  overallScore: integer("overall_score"),
  recommendation: text("recommendation"),
  linkedInUrl: text("linkedin_url"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  eligibilityStatus: text("eligibility_status"),
  eligibilityNotes: text("eligibility_notes"),
  extractionConfidence: integer("extraction_confidence"), // 0-100, overall confidence score
  extractedData: jsonb("extracted_data"), // Full raw extraction results
  extractedAt: timestamp("extracted_at"), // When AI extraction completed
  extractedBy: varchar("extracted_by"), // Which AI model/version
  source: text("source").notNull().default("manual"), // manual, ai_extraction, api
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProspectSchema = createInsertSchema(prospects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProspect = z.infer<typeof insertProspectSchema>;
export type Prospect = typeof prospects.$inferSelect;

// Portfolio companies extracted from fund documents
export const portfolioCompanies = pgTable("portfolio_companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prospectId: varchar("prospect_id"),
  facilityId: varchar("facility_id"),
  companyName: text("company_name").notNull(),
  industry: text("industry"),
  sector: text("sector"),
  geography: text("geography"),
  investmentDate: timestamp("investment_date"),
  investmentAmount: integer("investment_amount"),
  ownershipPercentage: numeric("ownership_percentage", { precision: 5, scale: 2 }),
  currentValue: integer("current_value"),
  valuationDate: timestamp("valuation_date"),
  status: text("status").notNull().default("active"), // active, exited, written-off
  exitDate: timestamp("exit_date"),
  exitValue: integer("exit_value"),
  extractedFrom: varchar("extracted_from"), // Document ID
  extractionConfidence: integer("extraction_confidence"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_portfolio_companies_prospect_id").on(table.prospectId),
  index("idx_portfolio_companies_facility_id").on(table.facilityId),
]);

export const insertPortfolioCompanySchema = createInsertSchema(portfolioCompanies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPortfolioCompany = z.infer<typeof insertPortfolioCompanySchema>;
export type PortfolioCompany = typeof portfolioCompanies.$inferSelect;

// Portfolio holdings (track changes over time)
export const portfolioHoldings = pgTable("portfolio_holdings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  asOfDate: timestamp("as_of_date").notNull(),
  fairValue: integer("fair_value").notNull(),
  costBasis: integer("cost_basis"),
  unrealizedGain: integer("unrealized_gain"),
  percentageOfNAV: numeric("percentage_of_nav", { precision: 5, scale: 2 }),
  source: text("source"), // quarterly-report, valuation-update, etc
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_portfolio_holdings_company_id").on(table.companyId),
  index("idx_portfolio_holdings_as_of_date").on(table.asOfDate),
]);

export const insertPortfolioHoldingSchema = createInsertSchema(portfolioHoldings).omit({
  id: true,
  createdAt: true,
});

export type InsertPortfolioHolding = z.infer<typeof insertPortfolioHoldingSchema>;
export type PortfolioHolding = typeof portfolioHoldings.$inferSelect;

// Extraction runs to track batch extraction jobs
export const extractionRuns = pgTable("extraction_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id"),
  batchId: varchar("batch_id"),
  extractionType: text("extraction_type").notNull(), // portfolio_companies, credit_clauses, fund_data
  status: text("status").notNull().default("running"), // running, completed, failed
  companiesExtracted: integer("companies_extracted").default(0),
  averageConfidence: numeric("average_confidence", { precision: 5, scale: 2 }),
  model: text("model").notNull(), // e.g., gemini-2.0-flash
  error: text("error"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_extraction_runs_document_id").on(table.documentId),
  index("idx_extraction_runs_batch_id").on(table.batchId),
]);

export const insertExtractionRunSchema = createInsertSchema(extractionRuns).omit({
  id: true,
  startedAt: true,
});

export type InsertExtractionRun = z.infer<typeof insertExtractionRunSchema>;
export type ExtractionRun = typeof extractionRuns.$inferSelect;

// Credit/Legal documents (loan agreements, term sheets, etc)
export const creditDocuments = pgTable("credit_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id"),
  documentId: varchar("document_id"), // Link to uploaded_documents
  documentType: text("document_type").notNull(), // loan_agreement, term_sheet, credit_agreement, etc
  parties: jsonb("parties"), // Lender, borrower, guarantors
  effectiveDate: timestamp("effective_date"),
  maturityDate: timestamp("maturity_date"),
  principalAmount: integer("principal_amount"),
  interestRate: numeric("interest_rate", { precision: 5, scale: 2 }),
  covenantCount: integer("covenant_count").default(0),
  parsedData: jsonb("parsed_data"),
  parsingConfidence: integer("parsing_confidence"),
  parsedAt: timestamp("parsed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_credit_documents_facility_id").on(table.facilityId),
  index("idx_credit_documents_document_id").on(table.documentId),
]);

export const insertCreditDocumentSchema = createInsertSchema(creditDocuments).omit({
  id: true,
  createdAt: true,
});

export type InsertCreditDocument = z.infer<typeof insertCreditDocumentSchema>;
export type CreditDocument = typeof creditDocuments.$inferSelect;

// Legal clause templates for pattern matching
export const legalClauseTemplates = pgTable("legal_clause_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clauseType: text("clause_type").notNull(), // covenant, representation, event_of_default, etc
  clauseName: text("clause_name").notNull(),
  category: text("category"), // financial, operational, reporting, etc
  keyTerms: jsonb("key_terms"), // Terms to extract (ratios, dates, amounts)
  patternRegex: text("pattern_regex"),
  description: text("description"),
  severity: text("severity"), // critical, high, medium, low
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLegalClauseTemplateSchema = createInsertSchema(legalClauseTemplates).omit({
  id: true,
  createdAt: true,
});

export type InsertLegalClauseTemplate = z.infer<typeof insertLegalClauseTemplateSchema>;
export type LegalClauseTemplate = typeof legalClauseTemplates.$inferSelect;

// Clause occurrences found in documents
export const clauseOccurrences = pgTable("clause_occurrences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creditDocumentId: varchar("credit_document_id").notNull(),
  templateId: varchar("template_id"),
  clauseText: text("clause_text").notNull(),
  clauseType: text("clause_type").notNull(),
  extractedTerms: jsonb("extracted_terms"),
  pageNumber: integer("page_number"),
  sectionNumber: text("section_number"),
  confidence: integer("confidence"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_clause_occurrences_credit_document_id").on(table.creditDocumentId),
  index("idx_clause_occurrences_template_id").on(table.templateId),
]);

export const insertClauseOccurrenceSchema = createInsertSchema(clauseOccurrences).omit({
  id: true,
  createdAt: true,
});

export type InsertClauseOccurrence = z.infer<typeof insertClauseOccurrenceSchema>;
export type ClauseOccurrence = typeof clauseOccurrences.$inferSelect;

export const deals = pgTable("deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prospectId: varchar("prospect_id"),
  fundName: text("fund_name").notNull(),
  status: text("status").notNull(),
  amount: integer("amount"),
  stage: text("stage").notNull(),
  riskScore: integer("risk_score"),
  lastUpdate: timestamp("last_update").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_deals_prospect_id").on(table.prospectId),
]);

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastUpdate: true,
});

export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof deals.$inferSelect;

export const advisors = pgTable("advisors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firmName: text("firm_name").notNull(),
  advisorName: text("advisor_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  linkedInUrl: text("linkedin_url"),
  commissionRate: integer("commission_rate").notNull().default(50),
  status: text("status").notNull().default("active"),
  dealsSubmitted: integer("deals_submitted").notNull().default(0),
  dealsWon: integer("deals_won").notNull().default(0),
  totalVolume: integer("total_volume").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAdvisorSchema = createInsertSchema(advisors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAdvisor = z.infer<typeof insertAdvisorSchema>;
export type Advisor = typeof advisors.$inferSelect;

export const advisorDeals = pgTable("advisor_deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advisorId: varchar("advisor_id").notNull(),
  gpFundName: text("gp_fund_name").notNull(),
  gpContactName: text("gp_contact_name"),
  gpContactEmail: text("gp_contact_email"),
  gpContactPhone: text("gp_contact_phone"),
  isAnonymized: boolean("is_anonymized").notNull().default(true),
  status: text("status").notNull().default("draft"),
  loanAmount: integer("loan_amount"),
  urgency: text("urgency").notNull().default("standard"),
  submissionDeadline: timestamp("submission_deadline"),
  fundAum: integer("fund_aum"),
  fundVintage: integer("fund_vintage"),
  fundPortfolioCount: integer("fund_portfolio_count"),
  fundSectors: jsonb("fund_sectors"),
  borrowingPermitted: boolean("borrowing_permitted"),
  navIqStatus: text("nav_iq_status").notNull().default("pending"),
  navIqPricing: jsonb("nav_iq_pricing"),
  navIqTermSheetDate: timestamp("nav_iq_term_sheet_date"),
  winner: text("winner"),
  commissionEarned: integer("commission_earned"),
  closeDate: timestamp("close_date"),
  daysToClose: integer("days_to_close"),
  advisorNotes: text("advisor_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_advisor_deals_advisor_id").on(table.advisorId),
]);

export const insertAdvisorDealSchema = createInsertSchema(advisorDeals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAdvisorDeal = z.infer<typeof insertAdvisorDealSchema>;
export type AdvisorDeal = typeof advisorDeals.$inferSelect;

export const lenderInvitations = pgTable("lender_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advisorDealId: varchar("advisor_deal_id").notNull(),
  lenderName: text("lender_name").notNull(),
  invitedAt: timestamp("invited_at").notNull().defaultNow(),
  respondedAt: timestamp("responded_at"),
  response: text("response"),
  termSheetSubmitted: boolean("term_sheet_submitted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_lender_invitations_advisor_deal_id").on(table.advisorDealId),
]);

export const insertLenderInvitationSchema = createInsertSchema(lenderInvitations).omit({
  id: true,
  createdAt: true,
});

export type InsertLenderInvitation = z.infer<typeof insertLenderInvitationSchema>;
export type LenderInvitation = typeof lenderInvitations.$inferSelect;

export const termSheets = pgTable("term_sheets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advisorDealId: varchar("advisor_deal_id").notNull(),
  lenderName: text("lender_name").notNull(),
  pricingRange: text("pricing_range"),
  loanAmount: integer("loan_amount"),
  ltvRatio: integer("ltv_ratio"),
  timelineToTermSheet: integer("timeline_to_term_sheet"),
  timelineToClose: integer("timeline_to_close"),
  keyCovenants: jsonb("key_covenants"),
  otherTerms: text("other_terms"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_term_sheets_advisor_deal_id").on(table.advisorDealId),
]);

export const insertTermSheetSchema = createInsertSchema(termSheets).omit({
  id: true,
  createdAt: true,
});

export type InsertTermSheet = z.infer<typeof insertTermSheetSchema>;
export type TermSheet = typeof termSheets.$inferSelect;

// Facilities (actual loans issued)
export const facilities = pgTable("facilities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prospectId: varchar("prospect_id"),
  advisorDealId: varchar("advisor_deal_id"),
  gpUserId: varchar("gp_user_id"), // Links facility to the GP user who owns it
  fundName: text("fund_name").notNull(),
  lenderName: text("lender_name").notNull().default("NAV IQ Capital"),
  principalAmount: integer("principal_amount").notNull(),
  outstandingBalance: integer("outstanding_balance").notNull(),
  interestRate: integer("interest_rate").notNull(), // Stored as basis points (850 = 8.50%)
  ltvRatio: integer("ltv_ratio").notNull(), // Stored as percentage (15 = 15%)
  maturityDate: timestamp("maturity_date").notNull(),
  status: text("status").notNull().default("active"), // 'active', 'prepaid', 'defaulted', 'matured'
  paymentSchedule: text("payment_schedule").notNull().default("quarterly"), // 'monthly', 'quarterly', 'semi-annual', 'annual'
  originationDate: timestamp("origination_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_facilities_prospect_id").on(table.prospectId),
  index("idx_facilities_advisor_deal_id").on(table.advisorDealId),
  index("idx_facilities_gp_user_id").on(table.gpUserId),
  index("idx_facilities_status_maturity").on(table.status, table.maturityDate),
]);

export const insertFacilitySchema = createInsertSchema(facilities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFacility = z.infer<typeof insertFacilitySchema>;
export type Facility = typeof facilities.$inferSelect;

// Covenants (monitoring rules for facilities)
export const covenants = pgTable("covenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").notNull(),
  covenantType: text("covenant_type").notNull(), // 'debt_ebitda', 'interest_coverage', 'minimum_liquidity', etc.
  thresholdOperator: text("threshold_operator").notNull(), // 'less_than', 'less_than_equal', 'greater_than', 'greater_than_equal'
  thresholdValue: integer("threshold_value").notNull(), // Stored in basis points or appropriate units
  currentValue: integer("current_value"),
  status: text("status").notNull().default("compliant"), // 'compliant', 'warning', 'breach'
  lastChecked: timestamp("last_checked"),
  nextCheckDate: timestamp("next_check_date"),
  checkFrequency: text("check_frequency").notNull().default("quarterly"), // 'monthly', 'quarterly', 'annual'
  breachNotified: boolean("breach_notified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_covenants_facility_id_status").on(table.facilityId, table.status),
  index("idx_covenants_next_check").on(table.nextCheckDate),
]);

export const insertCovenantSchema = createInsertSchema(covenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCovenant = z.infer<typeof insertCovenantSchema>;
export type Covenant = typeof covenants.$inferSelect;

// ML Breach Predictions - predictive model for covenant breaches
export const breachPredictions = pgTable("breach_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").notNull(),
  covenantId: varchar("covenant_id"),
  predictionDate: timestamp("prediction_date").notNull().defaultNow(),
  timeHorizon: text("time_horizon").notNull(), // 30_days, 90_days, 180_days, 1_year
  breachProbability: numeric("breach_probability", { precision: 5, scale: 2 }).notNull(), // 0.00 to 100.00
  riskScore: integer("risk_score").notNull(), // 0-100
  contributingFactors: jsonb("contributing_factors"), // Factors driving the prediction
  modelVersion: text("model_version").notNull(),
  modelConfidence: numeric("model_confidence", { precision: 5, scale: 2 }), // Model's self-assessed confidence
  actualBreachOccurred: boolean("actual_breach_occurred"), // True outcome for model training
  actualBreachDate: timestamp("actual_breach_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_breach_predictions_facility_id").on(table.facilityId),
  index("idx_breach_predictions_covenant_id").on(table.covenantId),
  index("idx_breach_predictions_prediction_date").on(table.predictionDate),
]);

export const insertBreachPredictionSchema = createInsertSchema(breachPredictions).omit({
  id: true,
  createdAt: true,
});

export type InsertBreachPrediction = z.infer<typeof insertBreachPredictionSchema>;
export type BreachPrediction = typeof breachPredictions.$inferSelect;

// ML Model versions and metadata
export const mlModels = pgTable("ml_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modelName: text("model_name").notNull(),
  modelVersion: text("model_version").notNull(),
  modelType: text("model_type").notNull(), // breach_predictor, ltv_optimizer, risk_scorer
  status: text("status").notNull().default("active"), // active, deprecated, testing
  accuracy: numeric("accuracy", { precision: 5, scale: 2 }), // Overall accuracy percentage
  precision: numeric("precision", { precision: 5, scale: 2 }),
  recall: numeric("recall", { precision: 5, scale: 2 }),
  f1Score: numeric("f1_score", { precision: 5, scale: 2 }),
  trainingDataCount: integer("training_data_count"),
  lastTrainedAt: timestamp("last_trained_at"),
  hyperparameters: jsonb("hyperparameters"),
  featureImportance: jsonb("feature_importance"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_ml_models_model_type_status").on(table.modelType, table.status),
]);

export const insertMLModelSchema = createInsertSchema(mlModels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMLModel = z.infer<typeof insertMLModelSchema>;
export type MLModel = typeof mlModels.$inferSelect;

// Training data for ML models
export const mlTrainingData = pgTable("ml_training_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modelType: text("model_type").notNull(),
  facilityId: varchar("facility_id"),
  features: jsonb("features").notNull(), // Input features
  label: jsonb("label").notNull(), // True outcome (breach/no breach, etc)
  weight: numeric("weight", { precision: 5, scale: 2 }).default("1.0"), // Sample weight
  dataSource: text("data_source"), // historical, simulation, external
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_ml_training_data_model_type").on(table.modelType),
  index("idx_ml_training_data_facility_id").on(table.facilityId),
]);

export const insertMLTrainingDataSchema = createInsertSchema(mlTrainingData).omit({
  id: true,
  createdAt: true,
});

export type InsertMLTrainingData = z.infer<typeof insertMLTrainingDataSchema>;
export type MLTrainingData = typeof mlTrainingData.$inferSelect;

// Cash flows (payment schedules and actual payments)
export const cashFlows = pgTable("cash_flows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").notNull(),
  dueDate: timestamp("due_date").notNull(),
  principal: integer("principal").notNull(),
  interest: integer("interest").notNull(),
  totalDue: integer("total_due").notNull(),
  paidAmount: integer("paid_amount").notNull().default(0),
  paidDate: timestamp("paid_date"),
  status: text("status").notNull().default("scheduled"), // 'scheduled', 'paid', 'overdue', 'waived'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_cash_flows_facility_id_status").on(table.facilityId, table.status),
  index("idx_cash_flows_due_date").on(table.dueDate),
]);

export const insertCashFlowSchema = createInsertSchema(cashFlows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCashFlow = z.infer<typeof insertCashFlowSchema>;
export type CashFlow = typeof cashFlows.$inferSelect;

// Draw requests (capital deployment requests from GPs)
export const drawRequests = pgTable("draw_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").notNull(),
  requestedAmount: integer("requested_amount").notNull(),
  purpose: text("purpose").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected', 'disbursed'
  requestedBy: text("requested_by").notNull(),
  requestDate: timestamp("request_date").notNull().defaultNow(),
  approvedBy: text("approved_by"),
  approvedDate: timestamp("approved_date"),
  disbursedDate: timestamp("disbursed_date"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_draw_requests_facility_id_status").on(table.facilityId, table.status),
]);

export const insertDrawRequestSchema = createInsertSchema(drawRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDrawRequest = z.infer<typeof insertDrawRequestSchema>;
export type DrawRequest = typeof drawRequests.$inferSelect;

// Messages (in-app messaging between users)
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull(),
  senderId: varchar("sender_id").notNull(),
  senderRole: text("sender_role").notNull(), // 'advisor', 'gp', 'operations'
  recipientId: varchar("recipient_id").notNull(),
  recipientRole: text("recipient_role").notNull(),
  subject: text("subject"),
  body: text("body").notNull(),
  relatedEntityType: text("related_entity_type"), // 'facility', 'advisor_deal', 'prospect', etc.
  relatedEntityId: varchar("related_entity_id"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_messages_thread_id").on(table.threadId),
  index("idx_messages_sender_id").on(table.senderId),
  index("idx_messages_recipient_id").on(table.recipientId),
]);

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Notifications (system-generated notifications)
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(), // 'status_change', 'covenant_breach', 'payment_due', 'task_assigned', etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: varchar("related_entity_id"),
  actionUrl: text("action_url"),
  isRead: boolean("is_read").notNull().default(false),
  priority: text("priority").notNull().default("normal"), // 'low', 'normal', 'high', 'urgent'
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_notifications_user_id_is_read").on(table.userId, table.isRead),
  index("idx_notifications_created_at").on(table.createdAt),
]);

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Notification delivery tracking for Slack/SMS/Email
export const notificationDeliveries = pgTable("notification_deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  notificationId: varchar("notification_id"),
  channel: text("channel").notNull(), // slack, sms, email, in_app
  recipient: text("recipient").notNull(), // Slack channel, phone number, email
  messageTemplate: text("message_template"),
  messageContent: text("message_content").notNull(),
  status: text("status").notNull().default("pending"), // pending, sent, failed, delivered, read
  provider: text("provider"), // twilio, slack, resend
  providerMessageId: text("provider_message_id"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  error: text("error"),
  retryCount: integer("retry_count").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_notification_deliveries_notification_id").on(table.notificationId),
  index("idx_notification_deliveries_status").on(table.status),
  index("idx_notification_deliveries_channel").on(table.channel),
]);

export const insertNotificationDeliverySchema = createInsertSchema(notificationDeliveries).omit({
  id: true,
  createdAt: true,
});

export type InsertNotificationDelivery = z.infer<typeof insertNotificationDeliverySchema>;
export type NotificationDelivery = typeof notificationDeliveries.$inferSelect;

// Notification preferences for users
export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  channel: text("channel").notNull(), // slack, sms, email, in_app
  enabled: boolean("enabled").notNull().default(true),
  contactInfo: text("contact_info"), // Phone, email, Slack user ID
  notificationTypes: jsonb("notification_types"), // Which types to receive on this channel
  quietHoursStart: text("quiet_hours_start"), // HH:MM format
  quietHoursEnd: text("quiet_hours_end"), // HH:MM format
  timezone: text("timezone").default("America/New_York"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_notification_preferences_user_id").on(table.userId),
]);

export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferenceSchema>;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;

// Audit logs (track all important actions)
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  userRole: text("user_role").notNull(),
  action: text("action").notNull(), // 'created', 'updated', 'deleted', 'approved', 'rejected', etc.
  entityType: text("entity_type").notNull(), // 'facility', 'covenant', 'draw_request', etc.
  entityId: varchar("entity_id").notNull(),
  changes: jsonb("changes"), // Store before/after state
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_audit_logs_user_id_created_at").on(table.userId, table.createdAt),
  index("idx_audit_logs_entity_type_id").on(table.entityType, table.entityId),
]);

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Market Intelligence - Track market data and trends
export const marketIntelligence = pgTable("market_intelligence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dataType: text("data_type").notNull(), // interest_rates, fund_valuations, deal_volume, sector_performance
  asOfDate: timestamp("as_of_date").notNull(),
  geography: text("geography"), // US, Europe, Asia, Global
  sector: text("sector"), // Tech, Healthcare, etc
  metric: text("metric").notNull(), // avg_interest_rate, median_ltv, deal_count
  value: numeric("value", { precision: 15, scale: 2 }).notNull(),
  percentageChange: numeric("percentage_change", { precision: 5, scale: 2 }), // vs previous period
  source: text("source"), // internal, pitchbook, preqin, spglobal
  confidence: integer("confidence"), // 0-100 data quality score
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_market_intelligence_data_type_date").on(table.dataType, table.asOfDate),
  index("idx_market_intelligence_geography_sector").on(table.geography, table.sector),
]);

export const insertMarketIntelligenceSchema = createInsertSchema(marketIntelligence).omit({
  id: true,
  createdAt: true,
});

export type InsertMarketIntelligence = z.infer<typeof insertMarketIntelligenceSchema>;
export type MarketIntelligence = typeof marketIntelligence.$inferSelect;

// Competitive intelligence - Track competitor deals and positioning
export const competitorIntelligence = pgTable("competitor_intelligence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  competitorName: text("competitor_name").notNull(),
  competitorType: text("competitor_type").notNull(), // bank, credit_fund, bdc, direct_lender
  dealType: text("deal_type"), // nav_loan, subscription_line, hybrid
  fundSize: integer("fund_size"), // Target fund AUM
  loanAmount: integer("loan_amount"),
  interestRate: numeric("interest_rate", { precision: 5, scale: 2 }),
  ltv: numeric("ltv", { precision: 5, scale: 2 }),
  sector: text("sector"),
  geography: text("geography"),
  source: text("source"), // press_release, pitch, market_rumors
  sourceUrl: text("source_url"),
  reportedDate: timestamp("reported_date"),
  reliability: text("reliability").default("unverified"), // verified, likely, unverified
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_competitor_intelligence_competitor_name").on(table.competitorName),
  index("idx_competitor_intelligence_reported_date").on(table.reportedDate),
]);

export const insertCompetitorIntelligenceSchema = createInsertSchema(competitorIntelligence).omit({
  id: true,
  createdAt: true,
});

export type InsertCompetitorIntelligence = z.infer<typeof insertCompetitorIntelligenceSchema>;
export type CompetitorIntelligence = typeof competitorIntelligence.$inferSelect;

// Lender Directory - Track potential lending partners and investors
export const lenderDirectory = pgTable("lender_directory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lenderName: text("lender_name").notNull(),
  lenderType: text("lender_type").notNull(), // bank, credit_fund, insurance_company, bdc, family_office
  tier: text("tier"), // tier_1, tier_2, tier_3 (based on size/reputation)
  aum: integer("aum"), // Assets under management
  geography: text("geography"),
  sectors: jsonb("sectors"), // Preferred sectors
  minDealSize: integer("min_deal_size"),
  maxDealSize: integer("max_deal_size"),
  typicalLtv: numeric("typical_ltv", { precision: 5, scale: 2 }),
  typicalRate: numeric("typical_rate", { precision: 5, scale: 2 }),
  productTypes: jsonb("product_types"), // nav_loans, subscription_lines, etc
  contactName: text("contact_name"),
  contactTitle: text("contact_title"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  website: text("website"),
  linkedinUrl: text("linkedin_url"),
  relationship: text("relationship").default("cold"), // cold, warm, active, preferred
  lastContact: timestamp("last_contact"),
  notes: text("notes"),
  status: text("status").default("active"), // active, inactive, do_not_contact
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_lender_directory_lender_type").on(table.lenderType),
  index("idx_lender_directory_relationship").on(table.relationship),
  index("idx_lender_directory_status").on(table.status),
]);

export const insertLenderDirectorySchema = createInsertSchema(lenderDirectory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLenderDirectory = z.infer<typeof insertLenderDirectorySchema>;
export type LenderDirectory = typeof lenderDirectory.$inferSelect;

// Lender interactions - Track all interactions with lenders
export const lenderInteractions = pgTable("lender_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lenderId: varchar("lender_id").notNull(),
  interactionType: text("interaction_type").notNull(), // email, call, meeting, pitch, proposal
  interactionDate: timestamp("interaction_date").notNull(),
  participants: jsonb("participants"), // Who attended/participated
  summary: text("summary"),
  outcome: text("outcome"), // positive, neutral, negative, no_response
  nextSteps: text("next_steps"),
  followUpDate: timestamp("follow_up_date"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_lender_interactions_lender_id").on(table.lenderId),
  index("idx_lender_interactions_interaction_date").on(table.interactionDate),
]);

export const insertLenderInteractionSchema = createInsertSchema(lenderInteractions).omit({
  id: true,
  createdAt: true,
});

export type InsertLenderInteraction = z.infer<typeof insertLenderInteractionSchema>;
export type LenderInteraction = typeof lenderInteractions.$inferSelect;

// OAuth2 API - Public API access for external systems
export const apiClients = pgTable("api_clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().unique(),
  clientSecret: varchar("client_secret").notNull(), // Hashed
  clientName: text("client_name").notNull(),
  organizationId: varchar("organization_id"), // Which GP/organization owns this client
  redirectUris: jsonb("redirect_uris"), // OAuth redirect URIs
  allowedScopes: jsonb("allowed_scopes"), // Permissions: read:facilities, write:draws, etc
  grantTypes: jsonb("grant_types").default('["client_credentials","authorization_code"]'), // OAuth grant types
  status: text("status").notNull().default("active"), // active, suspended, revoked
  rateLimit: integer("rate_limit").default(1000), // Requests per hour
  environment: text("environment").default("production"), // production, sandbox
  webhookUrl: text("webhook_url"),
  contactEmail: text("contact_email"),
  createdBy: varchar("created_by").notNull(),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_api_clients_client_id").on(table.clientId),
  index("idx_api_clients_organization_id").on(table.organizationId),
  index("idx_api_clients_status").on(table.status),
]);

export const insertApiClientSchema = createInsertSchema(apiClients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertApiClient = z.infer<typeof insertApiClientSchema>;
export type ApiClient = typeof apiClients.$inferSelect;

// OAuth2 access tokens
export const accessTokens = pgTable("access_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: varchar("token").notNull().unique(),
  clientId: varchar("client_id").notNull(),
  userId: varchar("user_id"), // For user-authenticated tokens
  scopes: jsonb("scopes").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  revoked: boolean("revoked").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_access_tokens_token").on(table.token),
  index("idx_access_tokens_client_id").on(table.clientId),
  index("idx_access_tokens_expires_at").on(table.expiresAt),
]);

export const insertAccessTokenSchema = createInsertSchema(accessTokens).omit({
  id: true,
  createdAt: true,
});

export type InsertAccessToken = z.infer<typeof insertAccessTokenSchema>;
export type AccessToken = typeof accessTokens.$inferSelect;

// API usage tracking
export const apiUsageLogs = pgTable("api_usage_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(), // GET, POST, PUT, DELETE
  statusCode: integer("status_code").notNull(),
  responseTime: integer("response_time"), // milliseconds
  requestSize: integer("request_size"), // bytes
  responseSize: integer("response_size"), // bytes
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_api_usage_logs_client_id_created_at").on(table.clientId, table.createdAt),
  index("idx_api_usage_logs_endpoint").on(table.endpoint),
]);

export const insertApiUsageLogSchema = createInsertSchema(apiUsageLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertApiUsageLog = z.infer<typeof insertApiUsageLogSchema>;
export type ApiUsageLog = typeof apiUsageLogs.$inferSelect;

// Fund Admin Integrations - Connect to SS&C, Alter Domus, Apex, etc
export const fundAdminConnections = pgTable("fund_admin_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").notNull(),
  providerId: varchar("provider_id").notNull(),
  providerName: text("provider_name").notNull(), // SSC_Intralinks, Alter_Domus, Apex, etc
  providerType: text("provider_type").notNull(), // fund_admin, custodian, transfer_agent
  connectionType: text("connection_type").notNull(), // api, sftp, email, manual
  credentials: jsonb("credentials"), // Encrypted API keys, SFTP creds
  syncFrequency: text("sync_frequency").default("daily"), // realtime, hourly, daily, weekly
  lastSync: timestamp("last_sync"),
  lastSyncStatus: text("last_sync_status"), // success, partial, failed
  syncErrors: jsonb("sync_errors"),
  dataTypes: jsonb("data_types"), // nav, holdings, commitments, distributions
  status: text("status").notNull().default("active"), // active, paused, error
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_fund_admin_connections_facility_id").on(table.facilityId),
  index("idx_fund_admin_connections_provider_id").on(table.providerId),
  index("idx_fund_admin_connections_status").on(table.status),
]);

export const insertFundAdminConnectionSchema = createInsertSchema(fundAdminConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFundAdminConnection = z.infer<typeof insertFundAdminConnectionSchema>;
export type FundAdminConnection = typeof fundAdminConnections.$inferSelect;

// Fund Admin sync logs
export const fundAdminSyncLogs = pgTable("fund_admin_sync_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectionId: varchar("connection_id").notNull(),
  syncType: text("sync_type").notNull(), // full, incremental
  status: text("status").notNull(), // running, completed, failed
  recordsProcessed: integer("records_processed").default(0),
  recordsCreated: integer("records_created").default(0),
  recordsUpdated: integer("records_updated").default(0),
  recordsFailed: integer("records_failed").default(0),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  error: text("error"),
  metadata: jsonb("metadata"),
}, (table) => [
  index("idx_fund_admin_sync_logs_connection_id").on(table.connectionId),
  index("idx_fund_admin_sync_logs_started_at").on(table.startedAt),
]);

export const insertFundAdminSyncLogSchema = createInsertSchema(fundAdminSyncLogs).omit({
  id: true,
  startedAt: true,
});

export type InsertFundAdminSyncLog = z.infer<typeof insertFundAdminSyncLogSchema>;
export type FundAdminSyncLog = typeof fundAdminSyncLogs.$inferSelect;

// Generated Documents (legal documents generated from templates)
export const generatedDocuments = pgTable("generated_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id"),
  dealId: varchar("deal_id"),
  advisorDealId: varchar("advisor_deal_id"),
  documentType: text("document_type").notNull(), // 'term_sheet', 'loan_agreement', 'compliance_report', etc.
  title: text("title").notNull(),
  content: text("content").notNull(),
  templateConfig: jsonb("template_config"), // Store the configuration used to generate
  format: text("format").notNull().default("markdown"), // 'markdown', 'html', 'pdf'
  generatedBy: varchar("generated_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGeneratedDocumentSchema = createInsertSchema(generatedDocuments).omit({
  id: true,
  createdAt: true,
});

export type InsertGeneratedDocument = z.infer<typeof insertGeneratedDocumentSchema>;
export type GeneratedDocument = typeof generatedDocuments.$inferSelect;

// Subscriptions (billing and plan management)
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  stripeSubscriptionId: varchar("stripe_subscription_id").notNull().unique(),
  stripeCustomerId: varchar("stripe_customer_id").notNull(),
  stripePriceId: varchar("stripe_price_id").notNull(),
  tier: text("tier").notNull(), // 'starter', 'professional', 'enterprise'
  status: text("status").notNull(), // 'active', 'past_due', 'canceled', 'incomplete', 'trialing'
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_subscriptions_user_id").on(table.userId),
  index("idx_subscriptions_status").on(table.status),
]);

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

// Usage Tracking (metered billing for API calls, AI extractions, etc.)
export const usageRecords = pgTable("usage_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  subscriptionId: varchar("subscription_id").notNull(),
  metricType: text("metric_type").notNull(), // 'api_calls', 'ai_extractions', 'documents_generated', 'storage_gb'
  quantity: integer("quantity").notNull(), // Number of units consumed
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  facilityId: varchar("facility_id"), // Optional link to specific facility
  metadata: jsonb("metadata"), // Additional context
}, (table) => [
  index("idx_usage_records_user_id_timestamp").on(table.userId, table.timestamp),
  index("idx_usage_records_subscription_id").on(table.subscriptionId),
  index("idx_usage_records_metric_type").on(table.metricType),
]);

export const insertUsageRecordSchema = createInsertSchema(usageRecords).omit({
  id: true,
  timestamp: true,
});

export type InsertUsageRecord = z.infer<typeof insertUsageRecordSchema>;
export type UsageRecord = typeof usageRecords.$inferSelect;

// Invoices (billing history)
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  subscriptionId: varchar("subscription_id"),
  stripeInvoiceId: varchar("stripe_invoice_id").notNull().unique(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  amount: integer("amount").notNull(), // Amount in cents
  currency: text("currency").notNull().default("usd"),
  status: text("status").notNull(), // 'draft', 'open', 'paid', 'uncollectible', 'void'
  invoiceNumber: text("invoice_number"),
  invoicePdf: text("invoice_pdf"), // URL to PDF
  hostedInvoiceUrl: text("hosted_invoice_url"), // Stripe hosted invoice page
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  paidAt: timestamp("paid_at"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_invoices_user_id_created_at").on(table.userId, table.createdAt),
  index("idx_invoices_subscription_id").on(table.subscriptionId),
  index("idx_invoices_status").on(table.status),
]);

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// Subscription Plans (pricing tiers and limits)
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // 'Starter', 'Professional', 'Enterprise'
  tier: text("tier").notNull().unique(), // 'starter', 'professional', 'enterprise'
  stripePriceId: varchar("stripe_price_id").notNull().unique(),
  stripeProductId: varchar("stripe_product_id").notNull(),
  price: integer("price").notNull(), // Monthly price in cents
  currency: text("currency").notNull().default("usd"),
  maxFacilities: integer("max_facilities").notNull(), // Maximum number of facilities
  maxUsers: integer("max_users").notNull(), // Maximum team members
  maxStorage: integer("max_storage").notNull(), // Max storage in GB
  aiExtractions: integer("ai_extractions").notNull(), // AI extractions per month
  features: jsonb("features").notNull(), // List of included features
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

// Marketing Leads table
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: varchar("email").notNull(),
  company: text("company").notNull(),
  phone: varchar("phone"),
  interest: varchar("interest").notNull(), // demo, pricing, enterprise, security, other
  message: text("message"),
  status: varchar("status").notNull().default("new"), // new, contacted, qualified, converted, closed
  source: varchar("source").default("website"), // website, referral, campaign
  assignedTo: varchar("assigned_to"), // User ID of sales rep
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_leads_email").on(table.email),
  index("idx_leads_status").on(table.status),
  index("idx_leads_created_at").on(table.createdAt),
]);

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  source: true,
  assignedTo: true,
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// AI Validation & Accuracy Tracking

// Ground truth datasets for AI validation testing
export const groundTruthDatasets = pgTable("ground_truth_datasets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // e.g., "Test Fund Alpha Capital 2020"
  description: text("description"),
  documentPath: text("document_path").notNull(), // Path to test document
  documentType: varchar("document_type").notNull(), // pdf, docx, etc.
  
  // Expected correct values (ground truth)
  expectedFundName: text("expected_fund_name"),
  expectedFundSize: numeric("expected_fund_size"), // AUM in dollars
  expectedVintage: integer("expected_vintage"),
  expectedPortfolioCount: integer("expected_portfolio_count"),
  expectedSectors: text("expected_sectors").array(),
  expectedGpName: text("expected_gp_name"),
  expectedGpFirmName: text("expected_gp_firm_name"),
  expectedGpTrackRecord: text("expected_gp_track_record"),
  expectedFundStructure: text("expected_fund_structure"),
  expectedStrategy: text("expected_strategy"),
  expectedGeography: text("expected_geography"),
  expectedContactName: text("expected_contact_name"),
  expectedContactEmail: text("expected_contact_email"),
  expectedContactPhone: text("expected_contact_phone"),
  
  // Metadata
  active: boolean("active").notNull().default(true), // Can be disabled for testing
  difficulty: varchar("difficulty").notNull().default("medium"), // easy, medium, hard
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_ground_truth_active").on(table.active),
  index("idx_ground_truth_difficulty").on(table.difficulty),
]);

// Individual validation test runs
export const validationRuns = pgTable("validation_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  datasetId: varchar("dataset_id").notNull().references(() => groundTruthDatasets.id, { onDelete: "cascade" }),
  
  // Extracted values from AI
  extractedFundName: text("extracted_fund_name"),
  extractedFundSize: numeric("extracted_fund_size"),
  extractedVintage: integer("extracted_vintage"),
  extractedPortfolioCount: integer("extracted_portfolio_count"),
  extractedSectors: text("extracted_sectors").array(),
  extractedGpName: text("extracted_gp_name"),
  extractedGpFirmName: text("extracted_gp_firm_name"),
  extractedGpTrackRecord: text("extracted_gp_track_record"),
  extractedFundStructure: text("extracted_fund_structure"),
  extractedStrategy: text("extracted_strategy"),
  extractedGeography: text("extracted_geography"),
  extractedContactName: text("extracted_contact_name"),
  extractedContactEmail: text("extracted_contact_email"),
  extractedContactPhone: text("extracted_contact_phone"),
  
  // Confidence scores from AI
  confidenceOverall: integer("confidence_overall"),
  confidenceFundName: integer("confidence_fund_name"),
  confidenceFundSize: integer("confidence_fund_size"),
  confidenceVintage: integer("confidence_vintage"),
  confidencePortfolioCount: integer("confidence_portfolio_count"),
  confidenceGpInfo: integer("confidence_gp_info"),
  
  // Accuracy results (calculated by comparing to ground truth)
  accuracyOverall: numeric("accuracy_overall"), // 0-100%
  accuracyFundName: boolean("accuracy_fund_name"), // exact match
  accuracyFundSize: boolean("accuracy_fund_size"), // within tolerance
  accuracyVintage: boolean("accuracy_vintage"), // exact match
  accuracyPortfolioCount: boolean("accuracy_portfolio_count"), // exact match
  accuracySectors: numeric("accuracy_sectors"), // % of sectors matched
  accuracyGpName: boolean("accuracy_gp_name"),
  accuracyGpFirmName: boolean("accuracy_gp_firm_name"),
  accuracyStrategy: boolean("accuracy_strategy"),
  accuracyGeography: boolean("accuracy_geography"),
  accuracyContactInfo: boolean("accuracy_contact_info"),
  
  // Performance metrics
  processingTimeMs: integer("processing_time_ms"),
  modelVersion: varchar("model_version").notNull().default("gemini-2.0-flash-exp"),
  
  // Run metadata
  runType: varchar("run_type").notNull().default("automated"), // automated, manual
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_validation_runs_dataset").on(table.datasetId),
  index("idx_validation_runs_accuracy").on(table.accuracyOverall),
  index("idx_validation_runs_created").on(table.createdAt),
]);

// Aggregate accuracy metrics over time
export const accuracyMetrics = pgTable("accuracy_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Time period
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Aggregate accuracy scores (0-100%)
  overallAccuracy: numeric("overall_accuracy").notNull(),
  fundNameAccuracy: numeric("fund_name_accuracy").notNull(),
  fundSizeAccuracy: numeric("fund_size_accuracy").notNull(),
  vintageAccuracy: numeric("vintage_accuracy").notNull(),
  portfolioCountAccuracy: numeric("portfolio_count_accuracy").notNull(),
  sectorsAccuracy: numeric("sectors_accuracy").notNull(),
  gpInfoAccuracy: numeric("gp_info_accuracy").notNull(),
  strategyAccuracy: numeric("strategy_accuracy").notNull(),
  geographyAccuracy: numeric("geography_accuracy").notNull(),
  contactInfoAccuracy: numeric("contact_info_accuracy").notNull(),
  
  // Confidence score statistics
  avgConfidenceScore: numeric("avg_confidence_score").notNull(),
  highConfidenceCount: integer("high_confidence_count").notNull(), // >= 91
  mediumConfidenceCount: integer("medium_confidence_count").notNull(), // 71-90
  lowConfidenceCount: integer("low_confidence_count").notNull(), // < 71
  
  // Volume metrics
  totalRuns: integer("total_runs").notNull(),
  passedRuns: integer("passed_runs").notNull(), // >= 95% accuracy
  failedRuns: integer("failed_runs").notNull(), // < 95% accuracy
  
  // Performance metrics
  avgProcessingTimeMs: numeric("avg_processing_time_ms"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_accuracy_metrics_period").on(table.periodStart, table.periodEnd),
  index("idx_accuracy_metrics_overall").on(table.overallAccuracy),
]);

export const insertGroundTruthDatasetSchema = createInsertSchema(groundTruthDatasets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertValidationRunSchema = createInsertSchema(validationRuns).omit({
  id: true,
  createdAt: true,
});

export const insertAccuracyMetricSchema = createInsertSchema(accuracyMetrics).omit({
  id: true,
  createdAt: true,
});

export type InsertGroundTruthDataset = z.infer<typeof insertGroundTruthDatasetSchema>;
export type GroundTruthDataset = typeof groundTruthDatasets.$inferSelect;
export type InsertValidationRun = z.infer<typeof insertValidationRunSchema>;
export type ValidationRun = typeof validationRuns.$inferSelect;
export type InsertAccuracyMetric = z.infer<typeof insertAccuracyMetricSchema>;
export type AccuracyMetric = typeof accuracyMetrics.$inferSelect;
