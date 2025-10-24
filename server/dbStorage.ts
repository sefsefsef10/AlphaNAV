import { db } from "./db";
import { eq, desc, sql, or } from "drizzle-orm";
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
  drawRequests,
  cashFlows,
  messages,
  notifications,
  notificationPreferences,
  covenants,
  generatedDocuments,
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
  type DrawRequest,
  type InsertDrawRequest,
  type CashFlow,
  type InsertCashFlow,
  type Message,
  type InsertMessage,
  type NotificationPreferences,
  type Covenant,
  type InsertCovenant,
  type GeneratedDocument,
  type InsertGeneratedDocument,
} from "@shared/schema";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User methods
  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
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

  async getDocumentsByFacility(facilityId: string): Promise<UploadedDocument[]> {
    return await db
      .select()
      .from(uploadedDocuments)
      .where(eq(uploadedDocuments.facilityId, facilityId))
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

  // Draw Request methods
  async createDrawRequest(drawRequestData: InsertDrawRequest): Promise<DrawRequest> {
    const [drawRequest] = await db.insert(drawRequests).values(drawRequestData).returning();
    return drawRequest;
  }

  async getDrawRequest(id: string): Promise<DrawRequest | undefined> {
    const [drawRequest] = await db
      .select()
      .from(drawRequests)
      .where(eq(drawRequests.id, id));
    return drawRequest;
  }

  async getDrawRequestsByFacility(facilityId: string): Promise<DrawRequest[]> {
    return await db
      .select()
      .from(drawRequests)
      .where(eq(drawRequests.facilityId, facilityId))
      .orderBy(desc(drawRequests.requestDate));
  }

  async listDrawRequests(): Promise<DrawRequest[]> {
    return await db
      .select()
      .from(drawRequests)
      .orderBy(desc(drawRequests.requestDate));
  }

  async updateDrawRequest(
    id: string,
    updates: Partial<DrawRequest>
  ): Promise<DrawRequest | undefined> {
    const [updated] = await db
      .update(drawRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(drawRequests.id, id))
      .returning();
    return updated;
  }

  // Cash Flow methods
  async createCashFlow(cashFlowData: InsertCashFlow): Promise<CashFlow> {
    const [cashFlow] = await db.insert(cashFlows).values(cashFlowData).returning();
    return cashFlow;
  }

  async getCashFlowsByFacility(facilityId: string): Promise<CashFlow[]> {
    return await db
      .select()
      .from(cashFlows)
      .where(eq(cashFlows.facilityId, facilityId))
      .orderBy(cashFlows.dueDate);
  }

  async listCashFlows(): Promise<CashFlow[]> {
    return await db
      .select()
      .from(cashFlows)
      .orderBy(cashFlows.dueDate);
  }

  async updateCashFlow(
    id: string,
    updates: Partial<CashFlow>
  ): Promise<CashFlow | undefined> {
    const [updated] = await db
      .update(cashFlows)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cashFlows.id, id))
      .returning();
    return updated;
  }

  // Message methods
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(messageData).returning();
    return message;
  }

  async getMessagesByThread(threadId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.threadId, threadId))
      .orderBy(messages.createdAt);
  }

  async listMessages(): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .orderBy(desc(messages.createdAt))
      .limit(100);
  }

  async markMessageAsRead(id: string): Promise<Message | undefined> {
    const [message] = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();
    return message;
  }

  // Document deletion
  async deleteUploadedDocument(id: string): Promise<void> {
    await db.delete(uploadedDocuments).where(eq(uploadedDocuments.id, id));
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

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  // Notification Preferences methods
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);
    return prefs;
  }

  async upsertNotificationPreferences(userId: string, preferences: any): Promise<NotificationPreferences> {
    const [prefs] = await db
      .insert(notificationPreferences)
      .values({ ...preferences, userId })
      .onConflictDoUpdate({
        target: notificationPreferences.userId,
        set: {
          ...preferences,
          updatedAt: new Date(),
        },
      })
      .returning();
    return prefs;
  }

  // Global search across all entities
  async globalSearch(query: string): Promise<any[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    const results: any[] = [];

    try {
      // Search deals (GP onboarding)
      const dealResults = await db
        .select()
        .from(deals)
        .where(sql`LOWER(${deals.fundName}) LIKE ${searchTerm} OR LOWER(${deals.fundStrategy}) LIKE ${searchTerm}`)
        .limit(5);

      dealResults.forEach(deal => {
        results.push({
          id: deal.id,
          type: 'deal',
          title: deal.fundName,
          subtitle: deal.fundStrategy || undefined,
          status: deal.status,
          metadata: { aum: deal.aum, requestedAmount: deal.requestedAmount },
        });
      });

      // Search prospects
      const prospectResults = await db
        .select()
        .from(prospects)
        .where(sql`LOWER(${prospects.fundName}) LIKE ${searchTerm} OR LOWER(${prospects.gpName}) LIKE ${searchTerm}`)
        .limit(5);

      prospectResults.forEach(prospect => {
        results.push({
          id: prospect.id,
          type: 'prospect',
          title: prospect.fundName,
          subtitle: prospect.gpName || undefined,
          status: prospect.status,
          metadata: { aum: prospect.aum, location: prospect.location },
        });
      });

      // Search facilities
      const facilityResults = await db
        .select()
        .from(facilities)
        .where(sql`LOWER(${facilities.fundName}) LIKE ${searchTerm} OR LOWER(${facilities.gpName}) LIKE ${searchTerm}`)
        .limit(5);

      facilityResults.forEach(facility => {
        results.push({
          id: facility.id,
          type: 'facility',
          title: facility.fundName,
          subtitle: facility.gpName || undefined,
          status: facility.status,
          metadata: { 
            principalAmount: facility.principalAmount, 
            availableCredit: facility.availableCredit,
            maturityDate: facility.maturityDate,
          },
        });
      });

      // Search advisors
      const advisorResults = await db
        .select()
        .from(advisors)
        .where(sql`LOWER(${advisors.firmName}) LIKE ${searchTerm} OR LOWER(${advisors.contactName}) LIKE ${searchTerm}`)
        .limit(5);

      advisorResults.forEach(advisor => {
        results.push({
          id: advisor.id,
          type: 'advisor',
          title: advisor.firmName,
          subtitle: advisor.contactName || undefined,
          status: advisor.status,
          metadata: { email: advisor.email, phone: advisor.phone },
        });
      });

      // Search advisor deals
      const advisorDealResults = await db
        .select()
        .from(advisorDeals)
        .where(sql`LOWER(${advisorDeals.gpFundName}) LIKE ${searchTerm} OR LOWER(${advisorDeals.gpName}) LIKE ${searchTerm}`)
        .limit(5);

      advisorDealResults.forEach(deal => {
        results.push({
          id: deal.id,
          type: 'advisor-deal',
          title: deal.gpFundName,
          subtitle: deal.gpName || undefined,
          status: deal.status,
          metadata: { 
            loanAmount: deal.loanAmount, 
            advisorId: deal.advisorId,
          },
        });
      });

      return results;
    } catch (error) {
      console.error('Global search error:', error);
      return [];
    }
  }

  // Covenant methods
  async createCovenant(covenantData: InsertCovenant): Promise<Covenant> {
    const [covenant] = await db
      .insert(covenants)
      .values(covenantData)
      .returning();
    return covenant;
  }

  async getCovenantsByFacility(facilityId: string): Promise<Covenant[]> {
    return await db
      .select()
      .from(covenants)
      .where(eq(covenants.facilityId, facilityId))
      .orderBy(desc(covenants.createdAt));
  }

  async updateCovenant(id: string, updates: Partial<Covenant>): Promise<Covenant | undefined> {
    const [covenant] = await db
      .update(covenants)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(covenants.id, id))
      .returning();
    return covenant;
  }

  async checkCovenants(facilityId: string): Promise<Covenant[]> {
    // Get all covenants for the facility
    const facilityCovenants = await this.getCovenantsByFacility(facilityId);
    
    // Check each covenant and update status
    const checkedCovenants: Covenant[] = [];
    
    for (const covenant of facilityCovenants) {
      // Skip only if currentValue is null or undefined (not zero)
      if (covenant.currentValue === null || covenant.currentValue === undefined) {
        checkedCovenants.push(covenant);
        continue;
      }

      let status: 'compliant' | 'warning' | 'breach' = 'compliant';
      const current = covenant.currentValue;
      const threshold = covenant.thresholdValue;
      
      // Check based on operator
      switch (covenant.thresholdOperator) {
        case 'less_than':
          if (current >= threshold) status = 'breach';
          else if (current >= threshold * 0.9) status = 'warning';
          break;
        case 'less_than_equal':
          if (current > threshold) status = 'breach';
          else if (current >= threshold * 0.9) status = 'warning';
          break;
        case 'greater_than':
          if (current <= threshold) status = 'breach';
          else if (current <= threshold * 1.1) status = 'warning';
          break;
        case 'greater_than_equal':
          if (current < threshold) status = 'breach';
          else if (current <= threshold * 1.1) status = 'warning';
          break;
      }

      // Update covenant status
      const updated = await this.updateCovenant(covenant.id, {
        status,
        lastChecked: new Date(),
      });

      if (updated) {
        checkedCovenants.push(updated);
        
        // Create notification if breach detected and not already notified
        if (status === 'breach' && !covenant.breachNotified) {
          // Get facility to find owner (skip notification if no owner found)
          const [facility] = await db.select().from(facilities).where(eq(facilities.id, facilityId)).limit(1);
          
          if (facility && facility.gpUserId) {
            await db.insert(notifications).values({
              userId: facility.gpUserId,
              type: 'covenant_breach',
              title: 'Covenant Breach Detected',
              message: `Covenant ${covenant.covenantType} has breached threshold: ${current} vs ${threshold}`,
              relatedEntityType: 'covenant',
              relatedEntityId: covenant.id,
              priority: 'urgent',
            });

            // Mark as notified only after successful notification
            const updatedCovenant = await this.updateCovenant(covenant.id, { breachNotified: true });
            if (updatedCovenant) {
              checkedCovenants[checkedCovenants.length - 1] = updatedCovenant;
            }
          } else {
            // Log missing owner for operations team to fix
            console.warn(`Covenant ${covenant.id} breached but no gpUserId on facility ${facilityId} - notification not sent`);
          }
        }
      }
    }

    return checkedCovenants;
  }

  // Generated Documents methods
  async createGeneratedDocument(doc: InsertGeneratedDocument): Promise<GeneratedDocument> {
    const [created] = await db.insert(generatedDocuments).values(doc).returning();
    return created;
  }

  async getGeneratedDocument(id: string): Promise<GeneratedDocument | undefined> {
    const [doc] = await db.select().from(generatedDocuments).where(eq(generatedDocuments.id, id));
    return doc;
  }

  async getGeneratedDocumentsByFacility(facilityId: string): Promise<GeneratedDocument[]> {
    return await db.select().from(generatedDocuments)
      .where(eq(generatedDocuments.facilityId, facilityId))
      .orderBy(desc(generatedDocuments.createdAt));
  }

  async getGeneratedDocumentsByDeal(dealId: string): Promise<GeneratedDocument[]> {
    return await db.select().from(generatedDocuments)
      .where(eq(generatedDocuments.dealId, dealId))
      .orderBy(desc(generatedDocuments.createdAt));
  }

  async listGeneratedDocuments(): Promise<GeneratedDocument[]> {
    return await db.select().from(generatedDocuments)
      .orderBy(desc(generatedDocuments.createdAt));
  }

  async deleteGeneratedDocument(id: string): Promise<void> {
    await db.delete(generatedDocuments).where(eq(generatedDocuments.id, id));
  }
}
