import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
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
  sessionId: varchar("session_id").notNull(),
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
