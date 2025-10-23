import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, boolean, index } from "drizzle-orm/pg-core";
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

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

export const uploadedDocuments = pgTable("uploaded_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id"), // For onboarding documents
  facilityId: varchar("facility_id"), // For facility documents
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  storageUrl: text("storage_url").notNull(),
  extractedData: jsonb("extracted_data"),
  processingStatus: text("processing_status").notNull().default("pending"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

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
  fundSize: integer("fund_size"),
  vintage: integer("vintage"),
  portfolioCount: integer("portfolio_count"),
  sectors: jsonb("sectors"),
  stage: text("stage"),
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
  source: text("source").notNull().default("manual"),
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
});

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
});

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
});

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
});

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
});

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
});

export const insertCovenantSchema = createInsertSchema(covenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCovenant = z.infer<typeof insertCovenantSchema>;
export type Covenant = typeof covenants.$inferSelect;

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
});

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
});

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
});

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
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Notification Preferences (user notification settings)
export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  pushNotifications: boolean("push_notifications").notNull().default(true),
  dealUpdates: boolean("deal_updates").notNull().default(true),
  underwritingAlerts: boolean("underwriting_alerts").notNull().default(true),
  portfolioAlerts: boolean("portfolio_alerts").notNull().default(true),
  systemAnnouncements: boolean("system_announcements").notNull().default(true),
  weeklyDigest: boolean("weekly_digest").notNull().default(false),
  instantAlerts: boolean("instant_alerts").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateNotificationPreferencesSchema = insertNotificationPreferencesSchema.partial();

export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;

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
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

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
