import { 
  type User, 
  type InsertUser, 
  type OnboardingSession, 
  type InsertOnboardingSession,
  type UploadedDocument,
  type InsertUploadedDocument
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private onboardingSessions: Map<string, OnboardingSession>;
  private uploadedDocuments: Map<string, UploadedDocument>;

  constructor() {
    this.users = new Map();
    this.onboardingSessions = new Map();
    this.uploadedDocuments = new Map();
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
}

export const storage = new MemStorage();
