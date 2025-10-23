import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { 
  users, 
  onboardingSessions, 
  uploadedDocuments, 
  prospects, 
  deals,
  advisors,
  advisorDeals,
  lenderInvitations,
  termSheets,
  facilities,
  notifications,
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
  type InsertTermSheet,
  type Facility,
} from "@shared/schema";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User methods
  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          role: userData.role,
          advisorId: userData.advisorId,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUserRole(userId: string, role: string, advisorId?: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, advisorId: advisorId || null, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Onboarding session methods
  async createOnboardingSession(session: InsertOnboardingSession): Promise<OnboardingSession> {
    const [created] = await db
      .insert(onboardingSessions)
      .values(session)
      .returning();
    return created;
  }

  async getOnboardingSession(id: string): Promise<OnboardingSession | undefined> {
    const [session] = await db
      .select()
      .from(onboardingSessions)
      .where(eq(onboardingSessions.id, id));
    return session;
  }

  async updateOnboardingSession(
    id: string,
    updates: Partial<OnboardingSession>
  ): Promise<OnboardingSession | undefined> {
    const [updated] = await db
      .update(onboardingSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(onboardingSessions.id, id))
      .returning();
    return updated;
  }

  async listOnboardingSessions(): Promise<OnboardingSession[]> {
    return await db
      .select()
      .from(onboardingSessions)
      .orderBy(desc(onboardingSessions.createdAt));
  }

  // Uploaded document methods
  async createUploadedDocument(doc: InsertUploadedDocument): Promise<UploadedDocument> {
    const [created] = await db
      .insert(uploadedDocuments)
      .values(doc)
      .returning();
    return created;
  }

  async getUploadedDocument(id: string): Promise<UploadedDocument | undefined> {
    const [doc] = await db
      .select()
      .from(uploadedDocuments)
      .where(eq(uploadedDocuments.id, id));
    return doc;
  }

  async getDocumentsBySessionId(sessionId: string): Promise<UploadedDocument[]> {
    return await db
      .select()
      .from(uploadedDocuments)
      .where(eq(uploadedDocuments.sessionId, sessionId))
      .orderBy(desc(uploadedDocuments.uploadedAt));
  }

  async updateUploadedDocument(
    id: string,
    updates: Partial<UploadedDocument>
  ): Promise<UploadedDocument | undefined> {
    const [updated] = await db
      .update(uploadedDocuments)
      .set(updates)
      .where(eq(uploadedDocuments.id, id))
      .returning();
    return updated;
  }

  // Prospect methods
  async createProspect(prospect: InsertProspect): Promise<Prospect> {
    const [created] = await db
      .insert(prospects)
      .values(prospect)
      .returning();
    return created;
  }

  async getProspect(id: string): Promise<Prospect | undefined> {
    const [prospect] = await db
      .select()
      .from(prospects)
      .where(eq(prospects.id, id));
    return prospect;
  }

  async listProspects(): Promise<Prospect[]> {
    return await db
      .select()
      .from(prospects)
      .orderBy(desc(prospects.createdAt));
  }

  async updateProspect(
    id: string,
    updates: Partial<Prospect>
  ): Promise<Prospect | undefined> {
    const [updated] = await db
      .update(prospects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(prospects.id, id))
      .returning();
    return updated;
  }

  // Deal methods
  async createDeal(deal: InsertDeal): Promise<Deal> {
    const [created] = await db
      .insert(deals)
      .values(deal)
      .returning();
    return created;
  }

  async getDeal(id: string): Promise<Deal | undefined> {
    const [deal] = await db
      .select()
      .from(deals)
      .where(eq(deals.id, id));
    return deal;
  }

  async listDeals(): Promise<Deal[]> {
    return await db
      .select()
      .from(deals)
      .orderBy(desc(deals.createdAt));
  }

  async updateDeal(
    id: string,
    updates: Partial<Deal>
  ): Promise<Deal | undefined> {
    const [updated] = await db
      .update(deals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(deals.id, id))
      .returning();
    return updated;
  }

  // Advisor methods
  async createAdvisor(advisor: InsertAdvisor): Promise<Advisor> {
    const [created] = await db
      .insert(advisors)
      .values(advisor)
      .returning();
    return created;
  }

  async getAdvisor(id: string): Promise<Advisor | undefined> {
    const [advisor] = await db
      .select()
      .from(advisors)
      .where(eq(advisors.id, id));
    return advisor;
  }

  async getAdvisorByEmail(email: string): Promise<Advisor | undefined> {
    const [advisor] = await db
      .select()
      .from(advisors)
      .where(eq(advisors.email, email));
    return advisor;
  }

  async listAdvisors(): Promise<Advisor[]> {
    return await db
      .select()
      .from(advisors)
      .orderBy(desc(advisors.createdAt));
  }

  async updateAdvisor(
    id: string,
    updates: Partial<Advisor>
  ): Promise<Advisor | undefined> {
    const [updated] = await db
      .update(advisors)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(advisors.id, id))
      .returning();
    return updated;
  }

  // Advisor deal methods
  async createAdvisorDeal(deal: InsertAdvisorDeal): Promise<AdvisorDeal> {
    const [created] = await db
      .insert(advisorDeals)
      .values(deal)
      .returning();
    return created;
  }

  async getAdvisorDeal(id: string): Promise<AdvisorDeal | undefined> {
    const [deal] = await db
      .select()
      .from(advisorDeals)
      .where(eq(advisorDeals.id, id));
    return deal;
  }

  async listAdvisorDeals(advisorId?: string): Promise<AdvisorDeal[]> {
    if (advisorId) {
      return await db
        .select()
        .from(advisorDeals)
        .where(eq(advisorDeals.advisorId, advisorId))
        .orderBy(desc(advisorDeals.createdAt));
    }
    return await db
      .select()
      .from(advisorDeals)
      .orderBy(desc(advisorDeals.createdAt));
  }

  async updateAdvisorDeal(
    id: string,
    updates: Partial<AdvisorDeal>
  ): Promise<AdvisorDeal | undefined> {
    const [updated] = await db
      .update(advisorDeals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(advisorDeals.id, id))
      .returning();
    return updated;
  }

  // Lender invitation methods
  async createLenderInvitation(invitation: InsertLenderInvitation): Promise<LenderInvitation> {
    const [created] = await db
      .insert(lenderInvitations)
      .values(invitation)
      .returning();
    return created;
  }

  async getLenderInvitationsByDeal(advisorDealId: string): Promise<LenderInvitation[]> {
    return await db
      .select()
      .from(lenderInvitations)
      .where(eq(lenderInvitations.advisorDealId, advisorDealId))
      .orderBy(desc(lenderInvitations.invitedAt));
  }

  async getLenderInvitation(id: string): Promise<LenderInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(lenderInvitations)
      .where(eq(lenderInvitations.id, id));
    return invitation;
  }

  async updateLenderInvitation(
    id: string,
    updates: Partial<LenderInvitation>
  ): Promise<LenderInvitation | undefined> {
    const [updated] = await db
      .update(lenderInvitations)
      .set(updates)
      .where(eq(lenderInvitations.id, id))
      .returning();
    return updated;
  }

  // Term sheet methods
  async createTermSheet(termSheet: InsertTermSheet): Promise<TermSheet> {
    const [created] = await db
      .insert(termSheets)
      .values(termSheet)
      .returning();
    return created;
  }

  async getTermSheetsByDeal(advisorDealId: string): Promise<TermSheet[]> {
    return await db
      .select()
      .from(termSheets)
      .where(eq(termSheets.advisorDealId, advisorDealId))
      .orderBy(desc(termSheets.submittedAt));
  }

  async updateTermSheet(
    id: string,
    updates: Partial<TermSheet>
  ): Promise<TermSheet | undefined> {
    const [updated] = await db
      .update(termSheets)
      .set(updates)
      .where(eq(termSheets.id, id))
      .returning();
    return updated;
  }

  // Facility methods
  async listFacilities(): Promise<Facility[]> {
    return await db
      .select()
      .from(facilities)
      .orderBy(desc(facilities.createdAt));
  }

  async getFacility(id: string): Promise<Facility | undefined> {
    const [facility] = await db
      .select()
      .from(facilities)
      .where(eq(facilities.id, id));
    return facility;
  }

  // Notification methods
  async getNotificationsByUser(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async markNotificationAsRead(id: string): Promise<any | undefined> {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updated;
  }
}
