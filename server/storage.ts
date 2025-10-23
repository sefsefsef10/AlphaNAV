import { 
  type User, 
  type UpsertUser, 
  type OnboardingSession, 
  type InsertOnboardingSession,
  type UploadedDocument,
  type InsertUploadedDocument,
  type Prospect,
  type InsertProspect,
  type Deal,
  type InsertDeal,
  type Advisor,
  type InsertAdvisor,
  type AdvisorDeal,
  type InsertAdvisorDeal,
  type LenderInvitation,
  type InsertLenderInvitation,
  type TermSheet,
  type InsertTermSheet
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  createOnboardingSession(session: InsertOnboardingSession): Promise<OnboardingSession>;
  getOnboardingSession(id: string): Promise<OnboardingSession | undefined>;
  updateOnboardingSession(id: string, updates: Partial<OnboardingSession>): Promise<OnboardingSession | undefined>;
  listOnboardingSessions(): Promise<OnboardingSession[]>;
  
  createUploadedDocument(doc: InsertUploadedDocument): Promise<UploadedDocument>;
  getUploadedDocument(id: string): Promise<UploadedDocument | undefined>;
  getDocumentsBySessionId(sessionId: string): Promise<UploadedDocument[]>;
  getDocumentsByFacility(facilityId: string): Promise<UploadedDocument[]>;
  updateUploadedDocument(id: string, updates: Partial<UploadedDocument>): Promise<UploadedDocument | undefined>;
  
  createProspect(prospect: InsertProspect): Promise<Prospect>;
  getProspect(id: string): Promise<Prospect | undefined>;
  listProspects(): Promise<Prospect[]>;
  updateProspect(id: string, updates: Partial<Prospect>): Promise<Prospect | undefined>;
  
  createDeal(deal: InsertDeal): Promise<Deal>;
  getDeal(id: string): Promise<Deal | undefined>;
  listDeals(): Promise<Deal[]>;
  updateDeal(id: string, updates: Partial<Deal>): Promise<Deal | undefined>;
  
  createAdvisor(advisor: InsertAdvisor): Promise<Advisor>;
  getAdvisor(id: string): Promise<Advisor | undefined>;
  getAdvisorByEmail(email: string): Promise<Advisor | undefined>;
  listAdvisors(): Promise<Advisor[]>;
  updateAdvisor(id: string, updates: Partial<Advisor>): Promise<Advisor | undefined>;
  
  createAdvisorDeal(deal: InsertAdvisorDeal): Promise<AdvisorDeal>;
  getAdvisorDeal(id: string): Promise<AdvisorDeal | undefined>;
  listAdvisorDeals(advisorId?: string): Promise<AdvisorDeal[]>;
  updateAdvisorDeal(id: string, updates: Partial<AdvisorDeal>): Promise<AdvisorDeal | undefined>;
  
  createLenderInvitation(invitation: InsertLenderInvitation): Promise<LenderInvitation>;
  getLenderInvitationsByDeal(advisorDealId: string): Promise<LenderInvitation[]>;
  updateLenderInvitation(id: string, updates: Partial<LenderInvitation>): Promise<LenderInvitation | undefined>;
  
  createTermSheet(termSheet: InsertTermSheet): Promise<TermSheet>;
  getTermSheetsByDeal(advisorDealId: string): Promise<TermSheet[]>;
  updateTermSheet(id: string, updates: Partial<TermSheet>): Promise<TermSheet | undefined>;
  
  listFacilities(): Promise<any[]>;
  getFacility(id: string): Promise<any | undefined>;
  
  createDrawRequest(drawRequest: any): Promise<any>;
  getDrawRequest(id: string): Promise<any | undefined>;
  getDrawRequestsByFacility(facilityId: string): Promise<any[]>;
  listDrawRequests(): Promise<any[]>;
  updateDrawRequest(id: string, updates: any): Promise<any | undefined>;
  
  createCashFlow(cashFlow: any): Promise<any>;
  getCashFlowsByFacility(facilityId: string): Promise<any[]>;
  listCashFlows(): Promise<any[]>;
  updateCashFlow(id: string, updates: any): Promise<any | undefined>;
  
  createMessage(message: any): Promise<any>;
  getMessagesByThread(threadId: string): Promise<any[]>;
  listMessages(): Promise<any[]>;
  markMessageAsRead(id: string): Promise<any | undefined>;
  
  deleteUploadedDocument(id: string): Promise<void>;
  
  getNotificationsByUser(userId: string): Promise<any[]>;
  markNotificationAsRead(id: string): Promise<any | undefined>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  
  getNotificationPreferences(userId: string): Promise<any | undefined>;
  upsertNotificationPreferences(userId: string, preferences: any): Promise<any>;
  
  globalSearch(query: string): Promise<any[]>;
  
  createCovenant(covenant: any): Promise<any>;
  getCovenantsByFacility(facilityId: string): Promise<any[]>;
  updateCovenant(id: string, updates: any): Promise<any | undefined>;
  checkCovenants(facilityId: string): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private onboardingSessions: Map<string, OnboardingSession>;
  private uploadedDocuments: Map<string, UploadedDocument>;
  private prospects: Map<string, Prospect>;
  private deals: Map<string, Deal>;
  private advisors: Map<string, Advisor>;
  private advisorDeals: Map<string, AdvisorDeal>;
  private lenderInvitations: Map<string, LenderInvitation>;
  private termSheets: Map<string, TermSheet>;

  constructor() {
    this.users = new Map();
    this.onboardingSessions = new Map();
    this.uploadedDocuments = new Map();
    this.prospects = new Map();
    this.deals = new Map();
    this.advisors = new Map();
    this.advisorDeals = new Map();
    this.lenderInvitations = new Map();
    this.termSheets = new Map();
    
    // Seed default advisor for demo/dev purposes
    const defaultAdvisor: Advisor = {
      id: "mock-advisor-1",
      firmName: "Wheelahan Capital Advisors",
      advisorName: "Richard Wheelahan",
      email: "richard@wheelahancapital.com",
      phone: "+1 (415) 555-0199",
      linkedInUrl: "https://linkedin.com/in/richardwheel",
      commissionRate: 75,
      status: "active",
      dealsSubmitted: 8,
      dealsWon: 3,
      totalVolume: 45000000,
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date(),
    };
    this.advisors.set(defaultAdvisor.id, defaultAdvisor);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = Array.from(this.users.values()).find(u => u.id === userData.id);
    if (existing) {
      const updated: User = {
        ...existing,
        ...userData,
        updatedAt: new Date(),
      };
      this.users.set(updated.id, updated);
      return updated;
    }
    const user: User = {
      id: userData.id || randomUUID(),
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      role: userData.role || "gp",
      advisorId: userData.advisorId || null,
      createdAt: userData.createdAt || new Date(),
      updatedAt: userData.updatedAt || new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async createOnboardingSession(insertSession: InsertOnboardingSession): Promise<OnboardingSession> {
    const id = randomUUID();
    const now = new Date();
    const session: OnboardingSession = {
      id,
      fundName: insertSession.fundName,
      contactName: insertSession.contactName,
      contactEmail: insertSession.contactEmail,
      contactPhone: insertSession.contactPhone ?? null,
      currentStep: insertSession.currentStep ?? 1,
      status: insertSession.status ?? "in_progress",
      extractedData: insertSession.extractedData ?? null,
      confirmedData: insertSession.confirmedData ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.onboardingSessions.set(id, session);
    return session;
  }

  async getOnboardingSession(id: string): Promise<OnboardingSession | undefined> {
    return this.onboardingSessions.get(id);
  }

  async updateOnboardingSession(id: string, updates: Partial<OnboardingSession>): Promise<OnboardingSession | undefined> {
    const session = this.onboardingSessions.get(id);
    if (!session) return undefined;
    
    const updated: OnboardingSession = {
      ...session,
      ...updates,
      id: session.id,
      updatedAt: new Date(),
    };
    this.onboardingSessions.set(id, updated);
    return updated;
  }

  async listOnboardingSessions(): Promise<OnboardingSession[]> {
    return Array.from(this.onboardingSessions.values());
  }

  async createUploadedDocument(insertDoc: InsertUploadedDocument): Promise<UploadedDocument> {
    const id = randomUUID();
    const doc: UploadedDocument = {
      id,
      sessionId: insertDoc.sessionId,
      fileName: insertDoc.fileName,
      fileType: insertDoc.fileType,
      fileSize: insertDoc.fileSize,
      storageUrl: insertDoc.storageUrl,
      extractedData: insertDoc.extractedData ?? null,
      processingStatus: insertDoc.processingStatus ?? "pending",
      uploadedAt: new Date(),
    };
    this.uploadedDocuments.set(id, doc);
    return doc;
  }

  async getUploadedDocument(id: string): Promise<UploadedDocument | undefined> {
    return this.uploadedDocuments.get(id);
  }

  async getDocumentsBySessionId(sessionId: string): Promise<UploadedDocument[]> {
    return Array.from(this.uploadedDocuments.values()).filter(
      (doc) => doc.sessionId === sessionId,
    );
  }

  async updateUploadedDocument(id: string, updates: Partial<UploadedDocument>): Promise<UploadedDocument | undefined> {
    const doc = this.uploadedDocuments.get(id);
    if (!doc) return undefined;
    
    const updated: UploadedDocument = {
      ...doc,
      ...updates,
      id: doc.id,
    };
    this.uploadedDocuments.set(id, updated);
    return updated;
  }

  async createProspect(insertProspect: InsertProspect): Promise<Prospect> {
    const id = randomUUID();
    const now = new Date();
    const prospect: Prospect = {
      id,
      onboardingSessionId: insertProspect.onboardingSessionId ?? null,
      fundName: insertProspect.fundName,
      fundSize: insertProspect.fundSize ?? null,
      vintage: insertProspect.vintage ?? null,
      portfolioCount: insertProspect.portfolioCount ?? null,
      sectors: insertProspect.sectors ?? null,
      stage: insertProspect.stage ?? null,
      loanNeedScore: insertProspect.loanNeedScore ?? null,
      borrowerQualityScore: insertProspect.borrowerQualityScore ?? null,
      engagementScore: insertProspect.engagementScore ?? null,
      overallScore: insertProspect.overallScore ?? null,
      recommendation: insertProspect.recommendation ?? null,
      linkedInUrl: insertProspect.linkedInUrl ?? null,
      contactName: insertProspect.contactName ?? null,
      contactEmail: insertProspect.contactEmail ?? null,
      contactPhone: insertProspect.contactPhone ?? null,
      eligibilityStatus: insertProspect.eligibilityStatus ?? null,
      eligibilityNotes: insertProspect.eligibilityNotes ?? null,
      source: insertProspect.source ?? "manual",
      createdAt: now,
      updatedAt: now,
    };
    this.prospects.set(id, prospect);
    return prospect;
  }

  async getProspect(id: string): Promise<Prospect | undefined> {
    return this.prospects.get(id);
  }

  async listProspects(): Promise<Prospect[]> {
    return Array.from(this.prospects.values());
  }

  async updateProspect(id: string, updates: Partial<Prospect>): Promise<Prospect | undefined> {
    const prospect = this.prospects.get(id);
    if (!prospect) return undefined;
    
    const updated: Prospect = {
      ...prospect,
      ...updates,
      id: prospect.id,
      updatedAt: new Date(),
    };
    this.prospects.set(id, updated);
    return updated;
  }

  async createDeal(insertDeal: InsertDeal): Promise<Deal> {
    const id = randomUUID();
    const now = new Date();
    const deal: Deal = {
      id,
      prospectId: insertDeal.prospectId ?? null,
      fundName: insertDeal.fundName,
      status: insertDeal.status,
      amount: insertDeal.amount ?? null,
      stage: insertDeal.stage,
      riskScore: insertDeal.riskScore ?? null,
      lastUpdate: now,
      createdAt: now,
      updatedAt: now,
    };
    this.deals.set(id, deal);
    return deal;
  }

  async getDeal(id: string): Promise<Deal | undefined> {
    return this.deals.get(id);
  }

  async listDeals(): Promise<Deal[]> {
    return Array.from(this.deals.values());
  }

  async updateDeal(id: string, updates: Partial<Deal>): Promise<Deal | undefined> {
    const deal = this.deals.get(id);
    if (!deal) return undefined;
    
    const updated: Deal = {
      ...deal,
      ...updates,
      id: deal.id,
      lastUpdate: new Date(),
      updatedAt: new Date(),
    };
    this.deals.set(id, updated);
    return updated;
  }

  async createAdvisor(insertAdvisor: InsertAdvisor): Promise<Advisor> {
    const id = randomUUID();
    const now = new Date();
    const advisor: Advisor = {
      id,
      firmName: insertAdvisor.firmName,
      advisorName: insertAdvisor.advisorName,
      email: insertAdvisor.email,
      phone: insertAdvisor.phone ?? null,
      linkedInUrl: insertAdvisor.linkedInUrl ?? null,
      commissionRate: insertAdvisor.commissionRate ?? 50,
      status: insertAdvisor.status ?? "active",
      dealsSubmitted: insertAdvisor.dealsSubmitted ?? 0,
      dealsWon: insertAdvisor.dealsWon ?? 0,
      totalVolume: insertAdvisor.totalVolume ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    this.advisors.set(id, advisor);
    return advisor;
  }

  async getAdvisor(id: string): Promise<Advisor | undefined> {
    return this.advisors.get(id);
  }

  async getAdvisorByEmail(email: string): Promise<Advisor | undefined> {
    return Array.from(this.advisors.values()).find(
      (advisor) => advisor.email === email,
    );
  }

  async listAdvisors(): Promise<Advisor[]> {
    return Array.from(this.advisors.values());
  }

  async updateAdvisor(id: string, updates: Partial<Advisor>): Promise<Advisor | undefined> {
    const advisor = this.advisors.get(id);
    if (!advisor) return undefined;
    
    const updated: Advisor = {
      ...advisor,
      ...updates,
      id: advisor.id,
      updatedAt: new Date(),
    };
    this.advisors.set(id, updated);
    return updated;
  }

  async createAdvisorDeal(insertDeal: InsertAdvisorDeal): Promise<AdvisorDeal> {
    const id = randomUUID();
    const now = new Date();
    const deal: AdvisorDeal = {
      id,
      advisorId: insertDeal.advisorId,
      gpFundName: insertDeal.gpFundName,
      gpContactName: insertDeal.gpContactName ?? null,
      gpContactEmail: insertDeal.gpContactEmail ?? null,
      gpContactPhone: insertDeal.gpContactPhone ?? null,
      isAnonymized: insertDeal.isAnonymized ?? true,
      status: insertDeal.status ?? "draft",
      loanAmount: insertDeal.loanAmount ?? null,
      urgency: insertDeal.urgency ?? "standard",
      submissionDeadline: insertDeal.submissionDeadline ?? null,
      fundAum: insertDeal.fundAum ?? null,
      fundVintage: insertDeal.fundVintage ?? null,
      fundPortfolioCount: insertDeal.fundPortfolioCount ?? null,
      fundSectors: insertDeal.fundSectors ?? null,
      borrowingPermitted: insertDeal.borrowingPermitted ?? null,
      navIqStatus: insertDeal.navIqStatus ?? "pending",
      navIqPricing: insertDeal.navIqPricing ?? null,
      navIqTermSheetDate: insertDeal.navIqTermSheetDate ?? null,
      winner: insertDeal.winner ?? null,
      commissionEarned: insertDeal.commissionEarned ?? null,
      closeDate: insertDeal.closeDate ?? null,
      daysToClose: insertDeal.daysToClose ?? null,
      advisorNotes: insertDeal.advisorNotes ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.advisorDeals.set(id, deal);
    return deal;
  }

  async getAdvisorDeal(id: string): Promise<AdvisorDeal | undefined> {
    return this.advisorDeals.get(id);
  }

  async listAdvisorDeals(advisorId?: string): Promise<AdvisorDeal[]> {
    const deals = Array.from(this.advisorDeals.values());
    if (advisorId) {
      return deals.filter(deal => deal.advisorId === advisorId);
    }
    return deals;
  }

  async updateAdvisorDeal(id: string, updates: Partial<AdvisorDeal>): Promise<AdvisorDeal | undefined> {
    const deal = this.advisorDeals.get(id);
    if (!deal) return undefined;
    
    const updated: AdvisorDeal = {
      ...deal,
      ...updates,
      id: deal.id,
      updatedAt: new Date(),
    };
    this.advisorDeals.set(id, updated);
    return updated;
  }

  async createLenderInvitation(insertInvitation: InsertLenderInvitation): Promise<LenderInvitation> {
    const id = randomUUID();
    const now = new Date();
    const invitation: LenderInvitation = {
      id,
      advisorDealId: insertInvitation.advisorDealId,
      lenderName: insertInvitation.lenderName,
      invitedAt: insertInvitation.invitedAt ?? now,
      respondedAt: insertInvitation.respondedAt ?? null,
      response: insertInvitation.response ?? null,
      termSheetSubmitted: insertInvitation.termSheetSubmitted ?? false,
      createdAt: now,
    };
    this.lenderInvitations.set(id, invitation);
    return invitation;
  }

  async getLenderInvitationsByDeal(advisorDealId: string): Promise<LenderInvitation[]> {
    return Array.from(this.lenderInvitations.values()).filter(
      (inv) => inv.advisorDealId === advisorDealId,
    );
  }

  async updateLenderInvitation(id: string, updates: Partial<LenderInvitation>): Promise<LenderInvitation | undefined> {
    const invitation = this.lenderInvitations.get(id);
    if (!invitation) return undefined;
    
    const updated: LenderInvitation = {
      ...invitation,
      ...updates,
      id: invitation.id,
    };
    this.lenderInvitations.set(id, updated);
    return updated;
  }

  async createTermSheet(insertTermSheet: InsertTermSheet): Promise<TermSheet> {
    const id = randomUUID();
    const now = new Date();
    const termSheet: TermSheet = {
      id,
      advisorDealId: insertTermSheet.advisorDealId,
      lenderName: insertTermSheet.lenderName,
      pricingRange: insertTermSheet.pricingRange ?? null,
      loanAmount: insertTermSheet.loanAmount ?? null,
      ltvRatio: insertTermSheet.ltvRatio ?? null,
      timelineToTermSheet: insertTermSheet.timelineToTermSheet ?? null,
      timelineToClose: insertTermSheet.timelineToClose ?? null,
      keyCovenants: insertTermSheet.keyCovenants ?? null,
      otherTerms: insertTermSheet.otherTerms ?? null,
      submittedAt: insertTermSheet.submittedAt ?? now,
      createdAt: now,
    };
    this.termSheets.set(id, termSheet);
    return termSheet;
  }

  async getTermSheetsByDeal(advisorDealId: string): Promise<TermSheet[]> {
    return Array.from(this.termSheets.values()).filter(
      (ts) => ts.advisorDealId === advisorDealId,
    );
  }

  async updateTermSheet(id: string, updates: Partial<TermSheet>): Promise<TermSheet | undefined> {
    const termSheet = this.termSheets.get(id);
    if (!termSheet) return undefined;
    
    const updated: TermSheet = {
      ...termSheet,
      ...updates,
      id: termSheet.id,
    };
    this.termSheets.set(id, updated);
    return updated;
  }

  async listFacilities(): Promise<any[]> {
    return [];
  }

  async getFacility(id: string): Promise<any | undefined> {
    return undefined;
  }

  async getNotificationsByUser(userId: string): Promise<any[]> {
    return [];
  }

  async markNotificationAsRead(id: string): Promise<any | undefined> {
    return undefined;
  }
}

export const storage = new MemStorage();
