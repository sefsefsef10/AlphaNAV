import { 
  type User, 
  type InsertUser, 
  type OnboardingSession, 
  type InsertOnboardingSession,
  type UploadedDocument,
  type InsertUploadedDocument,
  type Prospect,
  type InsertProspect,
  type Deal,
  type InsertDeal
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createOnboardingSession(session: InsertOnboardingSession): Promise<OnboardingSession>;
  getOnboardingSession(id: string): Promise<OnboardingSession | undefined>;
  updateOnboardingSession(id: string, updates: Partial<OnboardingSession>): Promise<OnboardingSession | undefined>;
  listOnboardingSessions(): Promise<OnboardingSession[]>;
  
  createUploadedDocument(doc: InsertUploadedDocument): Promise<UploadedDocument>;
  getUploadedDocument(id: string): Promise<UploadedDocument | undefined>;
  getDocumentsBySessionId(sessionId: string): Promise<UploadedDocument[]>;
  updateUploadedDocument(id: string, updates: Partial<UploadedDocument>): Promise<UploadedDocument | undefined>;
  
  createProspect(prospect: InsertProspect): Promise<Prospect>;
  getProspect(id: string): Promise<Prospect | undefined>;
  listProspects(): Promise<Prospect[]>;
  updateProspect(id: string, updates: Partial<Prospect>): Promise<Prospect | undefined>;
  
  createDeal(deal: InsertDeal): Promise<Deal>;
  getDeal(id: string): Promise<Deal | undefined>;
  listDeals(): Promise<Deal[]>;
  updateDeal(id: string, updates: Partial<Deal>): Promise<Deal | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private onboardingSessions: Map<string, OnboardingSession>;
  private uploadedDocuments: Map<string, UploadedDocument>;
  private prospects: Map<string, Prospect>;
  private deals: Map<string, Deal>;

  constructor() {
    this.users = new Map();
    this.onboardingSessions = new Map();
    this.uploadedDocuments = new Map();
    this.prospects = new Map();
    this.deals = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
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
}

export const storage = new MemStorage();
